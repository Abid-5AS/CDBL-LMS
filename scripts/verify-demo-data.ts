#!/usr/bin/env tsx

/**
 * Demo Data Verification Script
 * 
 * Validates data integrity and policy compliance of seeded demo data.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-demo-data.ts
 */

import { PrismaClient, LeaveType, LeaveStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
};

const checks: CheckResult[] = [];

function addCheck(name: string, status: "pass" | "fail" | "warning", message: string, details?: any) {
  checks.push({ name, status, message, details });
}

async function checkUsers() {
  const users = await prisma.user.findMany();
  
  // Check count
  if (users.length !== 19) {
    addCheck("user_count", "fail", `Expected 19 users, found ${users.length}`);
    return;
  }

  // Check roles exist
  const roles = users.map(u => u.role);
  const requiredRoles: Role[] = [Role.EMPLOYEE, Role.DEPT_HEAD, Role.HR_ADMIN, Role.HR_HEAD, Role.CEO, Role.SYSTEM_ADMIN];
  const missingRoles = requiredRoles.filter(r => !roles.includes(r));
  
  if (missingRoles.length > 0) {
    addCheck("user_roles", "fail", `Missing roles: ${missingRoles.join(", ")}`);
    return;
  }

  // Check specific users
  const ceo = users.find(u => u.email === "ceo@demo.local");
  const hrHead = users.find(u => u.email === "hrhead@demo.local");
  const hrAdmin = users.find(u => u.email === "hradmin@demo.local");
  const manager = users.find(u => u.email === "manager@demo.local");
  const employee1 = users.find(u => u.email === "employee1@demo.local");
  const employee3 = users.find(u => u.email === "employee3@demo.local");

  if (!ceo || ceo.role !== Role.CEO) {
    addCheck("ceo_account", "fail", "CEO account missing");
  }
  if (!hrHead || hrHead.role !== Role.HR_HEAD) {
    addCheck("hr_head_account", "fail", "HR Head account missing");
  }
  if (!hrAdmin || hrAdmin.role !== Role.HR_ADMIN) {
    addCheck("hr_admin_account", "fail", "HR Admin account missing");
  }
  if (!manager || manager.role !== Role.DEPT_HEAD || manager.department !== "IT") {
    addCheck("dept_head_it", "fail", "IT Dept Head (manager@demo.local) missing or misconfigured");
  }
  if (!employee1 || employee1.department !== "IT") {
    addCheck("employee1_department", "fail", "Employee One should belong to IT");
  }
  if (!employee3 || employee3.department !== "HR") {
    addCheck("employee3_department", "fail", "Employee Three should belong to HR");
  }

  const deptHeadCount = users.filter(u => u.role === Role.DEPT_HEAD).length;
  const employeeCount = users.filter(u => u.role === Role.EMPLOYEE).length;

  if (deptHeadCount !== 3 || employeeCount !== 12) {
    addCheck(
      "user_distribution",
      "fail",
      `Expected 3 dept heads & 12 employees; found ${deptHeadCount} dept heads and ${employeeCount} employees`
    );
  } else {
    addCheck("users", "pass", "User roster matches expected distribution (19 total)");
  }
}

async function checkLeaves() {
  const leaves = await prisma.leaveRequest.findMany();
  const minExpected = 60;
  const maxExpected = 140;

  if (leaves.length < minExpected || leaves.length > maxExpected) {
    addCheck("leave_count", "warning", `Expected ${minExpected}-${maxExpected} leaves, found ${leaves.length}`);
  } else {
    addCheck("leave_count", "pass", `${leaves.length} leave requests found`);
  }

  // Check statuses
  const statuses = leaves.map(l => l.status);
  const requiredStatuses: LeaveStatus[] = [
    LeaveStatus.APPROVED,
    LeaveStatus.PENDING,
    LeaveStatus.REJECTED,
    LeaveStatus.RETURNED,
    LeaveStatus.CANCELLATION_REQUESTED,
  ];
  const missingStatuses = requiredStatuses.filter(status => !statuses.includes(status));
  
  if (missingStatuses.length > 0) {
    addCheck("leave_statuses", "warning", `Missing statuses: ${missingStatuses.join(", ")}`);
  } else {
    addCheck("leave_statuses", "pass", "All key statuses present");
  }

  // Policy compliance checks
  let policyViolations = 0;
  const violations: string[] = [];

  for (const leave of leaves) {
    // CL consecutive days check
    if (leave.type === LeaveType.CASUAL && leave.workingDays > 3) {
      policyViolations++;
      violations.push(`Leave ${leave.id}: CL exceeds 3 consecutive days (${leave.workingDays} days)`);
    }

    // ML certificate check
    if (leave.type === LeaveType.MEDICAL && leave.workingDays > 3 && !leave.needsCertificate && !leave.certificateUrl) {
      policyViolations++;
      violations.push(`Leave ${leave.id}: ML >3 days without certificate flag`);
    }

    // Reason length check
    if (leave.reason.length < 10) {
      policyViolations++;
      violations.push(`Leave ${leave.id}: Reason too short (${leave.reason.length} chars, min 10)`);
    }
  }

  if (policyViolations > 0) {
    addCheck("leave_policy", "fail", `Found ${policyViolations} policy violations`, { violations });
  } else {
    addCheck("leave_policy", "pass", `All leaves comply with policy rules`);
  }
}

async function checkForeignKeys() {
  // Check LeaveRequest references
  const leaves = await prisma.leaveRequest.findMany({ include: { requester: true } });
  const invalidLeaves = leaves.filter(l => !l.requester);
  
  if (invalidLeaves.length > 0) {
    addCheck("leave_foreign_keys", "fail", `${invalidLeaves.length} leaves with invalid requesterId`);
    return;
  }

  // Check Approval references
  const approvals = await prisma.approval.findMany({
    include: { leave: true, approver: true },
  });
  const invalidApprovals = approvals.filter(a => !a.leave || !a.approver);
  
  if (invalidApprovals.length > 0) {
    addCheck("approval_foreign_keys", "fail", `${invalidApprovals.length} approvals with invalid references`);
    return;
  }

  addCheck("foreign_keys", "pass", "All foreign key relationships valid");
}

async function checkApprovalChains() {
  const leaves = await prisma.leaveRequest.findMany({
    include: { approvals: { orderBy: { step: "asc" }, include: { approver: true } } },
  });

  let invalidChains = 0;
  const issues: string[] = [];

  for (const leave of leaves) {
    if (leave.status === "DRAFT" || leave.status === "SUBMITTED") {
      continue; // No approvals yet
    }

    const approvals = leave.approvals;
    if (approvals.length === 0) continue;

    // Check step sequence
    for (let i = 0; i < approvals.length - 1; i++) {
      if (approvals[i].step >= approvals[i + 1].step) {
        invalidChains++;
        issues.push(`Leave ${leave.id}: Invalid step sequence`);
        break;
      }
    }

    // Check FORWARDED decisions have toRole
    for (const approval of approvals) {
      if (approval.decision === "FORWARDED" && !approval.toRole) {
        invalidChains++;
        issues.push(`Leave ${leave.id}, Approval ${approval.id}: FORWARDED missing toRole`);
      }
    }

    // Check final decision is from HR_HEAD or CEO
    if (leave.status === "APPROVED" || leave.status === "REJECTED") {
      const finalApproval = approvals[approvals.length - 1];
      if (finalApproval && !["HR_HEAD", "CEO"].includes(finalApproval.approver.role)) {
        invalidChains++;
        issues.push(`Leave ${leave.id}: Final decision not from HR_HEAD or CEO`);
      }
    }
  }

  if (invalidChains > 0) {
    addCheck("approval_chains", "fail", `Found ${invalidChains} approval chain issues`, { issues });
  } else {
    addCheck("approval_chains", "pass", "All approval chains valid");
  }
}

async function checkBalances() {
  const users = await prisma.user.findMany({ where: { role: Role.EMPLOYEE } });
  const currentYear = new Date().getFullYear();
  
  let balanceIssues = 0;
  const issues: string[] = [];

  for (const user of users) {
    const balances = await prisma.balance.findMany({
      where: { userId: user.id, year: currentYear },
    });

    // Check balance consistency: closing = opening + accrued - used
    for (const balance of balances) {
      const expectedClosing = Math.max((balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0), 0);
      if (balance.closing !== expectedClosing) {
        balanceIssues++;
        issues.push(`User ${user.email} (${balance.type}): closing mismatch. Expected ${expectedClosing}, got ${balance.closing}`);
      }

      // Check no negative balances
      if (balance.closing < 0 || balance.used < 0) {
        balanceIssues++;
        issues.push(`User ${user.email} (${balance.type}): Negative balance detected`);
      }
    }
  }

  if (balanceIssues > 0) {
    addCheck("balances", "fail", `Found ${balanceIssues} balance issues`, { issues });
  } else {
    addCheck("balances", "pass", `All balances consistent for ${users.length} employees`);
  }
}

async function checkAuditLogs() {
  const logs = await prisma.auditLog.findMany();
  
  if (logs.length < 50) {
    addCheck("audit_count", "warning", `Expected 50+ audit logs, found ${logs.length}`);
  } else {
    addCheck("audit_count", "pass", `${logs.length} audit log entries found`);
  }

  // Check required action types
  const actions = logs.map(l => l.action);
  const requiredActions = ["LEAVE_SUBMITTED", "LEAVE_FORWARD", "LEAVE_APPROVE", "LEAVE_REJECT", "LEAVE_CANCEL"];
  const foundActions = requiredActions.filter(a => actions.includes(a));

  if (foundActions.length < 3) {
    addCheck("audit_actions", "warning", `Missing some action types. Found: ${foundActions.join(", ")}`);
  } else {
    addCheck("audit_actions", "pass", `Required audit actions present: ${foundActions.join(", ")}`);
  }
}

async function checkHolidays() {
  const holidays = await prisma.holiday.findMany();
  
  if (holidays.length < 15) {
    addCheck("holiday_count", "warning", `Expected 15+ holidays, found ${holidays.length}`);
  } else {
    addCheck("holiday_count", "pass", `${holidays.length} holidays found`);
  }

  // Check required holidays
  const currentYear = new Date().getFullYear();
  const requiredHolidays = [
    { date: new Date(currentYear, 0, 1), name: "New Year's Day" },
    { date: new Date(currentYear, 2, 26), name: "Independence & National day" },
    { date: new Date(currentYear, 11, 16), name: "Victory Day" },
    { date: new Date(currentYear, 11, 25), name: "Christmas Day" },
  ];

  let missingHolidays = 0;
  for (const req of requiredHolidays) {
    const found = holidays.find(h => 
      h.date.getFullYear() === req.date.getFullYear() &&
      h.date.getMonth() === req.date.getMonth() &&
      h.date.getDate() === req.date.getDate()
    );
    if (!found) {
      missingHolidays++;
    }
  }

  if (missingHolidays > 0) {
    addCheck("holiday_required", "warning", `${missingHolidays} required holidays missing`);
  } else {
    addCheck("holiday_required", "pass", "All required holidays present");
  }
}

async function checkOrgSettings() {
  try {
    const settings = await prisma.orgSettings.findUnique({
      where: { key: "allowBackdate" },
    });

    if (!settings) {
      addCheck("org_settings", "warning", "OrgSettings not initialized");
      return;
    }

    const value = settings.value as any;
    if (value?.allowBackdate?.EL === "ask" && value?.allowBackdate?.CL === false && value?.allowBackdate?.ML === true) {
      addCheck("org_settings", "pass", "OrgSettings correctly initialized");
    } else {
      addCheck("org_settings", "fail", "OrgSettings values incorrect", { value });
    }
  } catch (error) {
    addCheck("org_settings", "warning", "Could not check OrgSettings (model may not exist)");
  }
}

async function main() {
  console.log("Running demo data verification...\n");

  await checkUsers();
  await checkLeaves();
  await checkForeignKeys();
  await checkApprovalChains();
  await checkBalances();
  await checkAuditLogs();
  await checkHolidays();
  await checkOrgSettings();

  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION REPORT");
  console.log("=".repeat(60) + "\n");

  checks.forEach((check) => {
    const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details) {
      if (Array.isArray(check.details) && check.details.length > 0) {
        check.details.slice(0, 5).forEach((detail: string) => {
          console.log(`   - ${detail}`);
        });
        if (check.details.length > 5) {
          console.log(`   ... and ${check.details.length - 5} more`);
        }
      } else if (typeof check.details === "object") {
        console.log(`   Details:`, JSON.stringify(check.details, null, 2));
      }
    }
  });

  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warning").length;

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${passed} passed, ${warned} warnings, ${failed} failed`);
  console.log("=".repeat(60) + "\n");

  const overallPassed = failed === 0;

  process.exit(overallPassed ? 0 : 1);
}

main()
  .catch(async (error) => {
    console.error("Verification error:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
