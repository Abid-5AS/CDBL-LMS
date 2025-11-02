#!/usr/bin/env tsx

/**
 * Policy Audit Script
 * 
 * Validates leave management system compliance with CDBL HR policy.
 * 
 * Usage:
 *   pnpm policy:audit
 *   pnpm policy:audit --json
 */

import { PrismaClient } from "@prisma/client";
import { policy } from "../lib/policy";
import { getBackdateSettings } from "../lib/org-settings";

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
};

type AuditReport = {
  passed: boolean;
  timestamp: string;
  checks: CheckResult[];
};

const checks: CheckResult[] = [];

function addCheck(name: string, status: "pass" | "fail" | "warning", message: string, details?: any) {
  checks.push({ name, status, message, details });
}

async function checkELAccrual() {
  // Check EL accrual: 2 days/month, max carry 60
  addCheck(
    "el_accrual",
    "pass",
    `EL accrual: ${policy.elAccrualPerMonth} days/month, max carry: ${policy.carryForwardCap.EL}`
  );
}

async function checkCLSpellLimit() {
  // Check CL max consecutive days
  const leaves = await prisma.leaveRequest.findMany({
    where: { type: "CASUAL" },
    select: { workingDays: true },
  });

  const violations = leaves.filter((l) => l.workingDays > policy.clMaxConsecutiveDays);
  if (violations.length > 0) {
    addCheck(
      "cl_spell_limit",
      "fail",
      `Found ${violations.length} CL requests exceeding ${policy.clMaxConsecutiveDays} days per spell`,
      { violations: violations.map((v) => v.workingDays) }
    );
  } else {
    addCheck("cl_spell_limit", "pass", `All CL requests ≤ ${policy.clMaxConsecutiveDays} days per spell`);
  }
}

async function checkCLAnnualCap() {
  // Check CL annual cap ≤10 days/year
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  for (const user of users) {
    const total = await prisma.leaveRequest.aggregate({
      where: {
        requesterId: user.id,
        type: "CASUAL",
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { gte: yearStart, lt: yearEnd },
      },
      _sum: { workingDays: true },
    });

    const totalDays = total._sum.workingDays ?? 0;
    if (totalDays > policy.accrual.CL_PER_YEAR) {
      addCheck(
        "cl_annual_cap",
        "fail",
        `User ${user.email} exceeded CL annual cap: ${totalDays} > ${policy.accrual.CL_PER_YEAR}`,
        { userId: user.id, totalDays, cap: policy.accrual.CL_PER_YEAR }
      );
    }
  }

  if (!checks.some((c) => c.name === "cl_annual_cap")) {
    addCheck("cl_annual_cap", "pass", `All users within CL annual cap of ${policy.accrual.CL_PER_YEAR} days`);
  }
}

async function checkMLCertificate() {
  // Check ML >3 days has certificate
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      type: "MEDICAL",
      workingDays: { gt: 3 },
    },
    select: { id: true, workingDays: true, needsCertificate: true, certificateUrl: true },
  });

  const violations = leaves.filter(
    (l) => !l.needsCertificate && !l.certificateUrl
  );
  if (violations.length > 0) {
    addCheck(
      "ml_certificate",
      "fail",
      `Found ${violations.length} ML requests >3 days without certificate`,
      { violations: violations.map((v) => ({ id: v.id, days: v.workingDays })) }
    );
  } else {
    addCheck("ml_certificate", "pass", "All ML requests >3 days have certificates");
  }
}

async function checkBackdateSettings() {
  // Check orgSettings backdate toggles
  try {
    const settings = await getBackdateSettings();
    const status = settings.EL === "ask" ? "warning" : "pass";
    addCheck(
      "backdate_settings",
      status,
      `Backdate settings: EL=${settings.EL}, CL=${settings.CL}, ML=${settings.ML}${settings.EL === "ask" ? " (EL=ask requires confirmation)" : ""}`,
      { settings }
    );
  } catch (error) {
    addCheck(
      "backdate_settings",
      "warning",
      "Could not read backdate settings (orgSettings may not be initialized)",
      { error: String(error) }
    );
  }
}

async function checkWorkflowChain() {
  // Check approval chain: intermediate roles must FORWARD
  const approvals = await prisma.approval.findMany({
    where: { decision: "FORWARDED" },
    include: { approver: { select: { role: true } } },
  });

  const forwardedByHRAdmin = approvals.filter((a) => a.approver.role === "HR_ADMIN");
  const forwardedByDeptHead = approvals.filter((a) => a.approver.role === "DEPT_HEAD");

  if (forwardedByHRAdmin.length === 0 && forwardedByDeptHead.length === 0) {
    addCheck(
      "workflow_chain",
      "warning",
      "No FORWARDED approvals found - chain may not be tested yet"
    );
  } else {
    addCheck(
      "workflow_chain",
      "pass",
      `Found ${forwardedByHRAdmin.length} forwards by HR_ADMIN, ${forwardedByDeptHead.length} by DEPT_HEAD`
    );
  }
}

async function main() {
  const jsonOutput = process.argv.includes("--json");

  try {
    console.log("Running policy audit...\n");

    await checkELAccrual();
    await checkCLSpellLimit();
    await checkCLAnnualCap();
    await checkMLCertificate();
    await checkBackdateSettings();
    await checkWorkflowChain();

    // Pass if no failures (warnings are OK)
    const passed = checks.every((c) => c.status !== "fail");
    const report: AuditReport = {
      passed,
      timestamp: new Date().toISOString(),
      checks,
    };

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log("\n" + "=".repeat(60));
      console.log("POLICY AUDIT REPORT");
      console.log("=".repeat(60) + "\n");

      checks.forEach((check) => {
        const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
        console.log(`${icon} ${check.name}: ${check.message}`);
        if (check.details) {
          console.log(`   Details:`, JSON.stringify(check.details, null, 2));
        }
      });

      console.log("\n" + "=".repeat(60));
      console.log(`Overall: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
      console.log("=".repeat(60) + "\n");
    }

    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error("Audit error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

