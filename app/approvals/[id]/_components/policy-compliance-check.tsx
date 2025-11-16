"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Balance, LeaveType } from "@prisma/client";
import { policy } from "@/lib/policy";

type PolicyComplianceCheckProps = {
  leaveType: LeaveType;
  workingDays: number;
  startDate: Date;
  endDate: Date;
  balances: Balance[];
};

type ComplianceCheck = {
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
};

export function PolicyComplianceCheck({
  leaveType,
  workingDays,
  startDate,
  endDate,
  balances,
}: PolicyComplianceCheckProps) {
  const checks: ComplianceCheck[] = [];

  // Get balance for the leave type
  const balance = balances.find((b) => b.type === leaveType);
  const availableBalance = balance
    ? (balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0)
    : 0;

  // Check 1: Balance Availability
  if (availableBalance >= workingDays) {
    checks.push({
      status: "pass",
      message: "Sufficient balance available",
      details: `${availableBalance} days available, ${workingDays} days requested`,
    });
  } else if (availableBalance > 0) {
    checks.push({
      status: "warning",
      message: "Partial balance available",
      details: `Only ${availableBalance} days available, ${workingDays} days requested (${
        workingDays - availableBalance
      } days short)`,
    });
  } else {
    checks.push({
      status: "fail",
      message: "Insufficient balance",
      details: `0 days available, ${workingDays} days requested`,
    });
  }

  // Check 2: Maximum Leave Duration
  const maxDays = policy.maxContinuousDays[leaveType];
  if (maxDays) {
    if (workingDays <= maxDays) {
      checks.push({
        status: "pass",
        message: "Within maximum duration",
        details: `${workingDays} days requested, max ${maxDays} days allowed`,
      });
    } else {
      checks.push({
        status: "fail",
        message: "Exceeds maximum duration",
        details: `${workingDays} days requested, max ${maxDays} days allowed (${
          workingDays - maxDays
        } days over)`,
      });
    }
  }

  // Check 3: Medical Leave Certificate Requirement
  if (leaveType === "MEDICAL" && workingDays > 7) {
    checks.push({
      status: "warning",
      message: "Requires medical certificate",
      details: "Medical leave exceeding 7 days requires certificate (Policy 6.21.b)",
    });
  }

  // Check 4: Medical Leave Return-to-Duty Certificate
  if (leaveType === "MEDICAL" && workingDays > 7) {
    checks.push({
      status: "warning",
      message: "Fitness certificate required before duty return",
      details: "Employee must submit fitness certificate before resuming duty (Policy 6.21.c)",
    });
  }

  // Check 5: Advance Notice (simplified check)
  const daysUntilStart = Math.ceil(
    (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (leaveType === "CASUAL") {
    if (daysUntilStart >= 3) {
      checks.push({
        status: "pass",
        message: "Advance notice provided",
        details: `Request submitted ${daysUntilStart} days in advance`,
      });
    } else if (daysUntilStart >= 0) {
      checks.push({
        status: "warning",
        message: "Short notice",
        details: `Only ${daysUntilStart} days advance notice (3+ days recommended for CL)`,
      });
    }
  }

  // Check 6: Blackout Dates (Example: December 25-31 for year-end)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isDecemberYearEnd =
    (start.getMonth() === 11 && start.getDate() >= 25) ||
    (end.getMonth() === 11 && end.getDate() >= 25);

  if (isDecemberYearEnd) {
    checks.push({
      status: "warning",
      message: "Overlaps year-end period",
      details: "Leave request includes December 25-31 (year-end processing period)",
    });
  }

  // Calculate overall compliance
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const passCount = checks.filter((c) => c.status === "pass").length;

  const overallStatus =
    failCount > 0 ? "fail" : warningCount > 0 ? "warning" : "pass";

  return (
    <Card className={`rounded-2xl shadow-sm ${
      overallStatus === "pass"
        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
        : overallStatus === "fail"
        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
        : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Compliance
          </span>
          <Badge
            variant={
              overallStatus === "pass"
                ? "default"
                : overallStatus === "fail"
                ? "destructive"
                : "secondary"
            }
            className={
              overallStatus === "pass"
                ? "bg-green-600"
                : overallStatus === "fail"
                ? "bg-red-600"
                : "bg-yellow-600"
            }
          >
            {overallStatus === "pass" && "All Checks Passed"}
            {overallStatus === "fail" && "Policy Violations"}
            {overallStatus === "warning" && "Review Required"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {check.status === "pass" && (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
              {check.status === "fail" && (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              {check.status === "warning" && (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                check.status === "pass"
                  ? "text-green-700 dark:text-green-300"
                  : check.status === "fail"
                  ? "text-red-700 dark:text-red-300"
                  : "text-yellow-700 dark:text-yellow-300"
              }`}>
                {check.message}
              </p>
              {check.details && (
                <p className={`text-xs mt-1 ${
                  check.status === "pass"
                    ? "text-green-600 dark:text-green-400"
                    : check.status === "fail"
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}>
                  {check.details}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="pt-3 border-t border-muted mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compliance Summary</span>
            <div className="flex items-center gap-3">
              <span className="text-green-600 dark:text-green-400">
                ✓ {passCount} passed
              </span>
              {warningCount > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⚠ {warningCount} warnings
                </span>
              )}
              {failCount > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  ✗ {failCount} failed
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
