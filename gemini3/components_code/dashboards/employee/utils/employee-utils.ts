/**
 * Employee Dashboard Utilities
 * Helper functions for employee dashboard components
 */

import { UserCheck, Users, Shield, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LEAVE_BALANCE_KEYS = [
  "EARNED",
  "CASUAL",
  "MEDICAL",
  "EXTRAWITHPAY",
  "EXTRAWITHOUTPAY",
  "MATERNITY",
  "PATERNITY",
  "STUDY",
  "SPECIAL_DISABILITY",
  "QUARANTINE",
] as const;

export const APPROVAL_STAGES = {
  1: { role: "HR Admin", icon: UserCheck },
  2: { role: "Manager", icon: Users },
  3: { role: "HR Head", icon: Shield },
  4: { role: "CEO", icon: Activity },
};

/**
 * Determine current approval stage from approvals array
 */
export function getCurrentApprovalStage(approvals: any[] | undefined): {
  stage: number;
  role: string;
  icon: LucideIcon;
} {
  if (!approvals || approvals.length === 0) {
    return { stage: 1, role: "HR Admin", icon: UserCheck };
  }

  // Find the first pending approval or the last approval
  const pendingApproval = approvals.find((a) => a.decision === "PENDING");
  if (pendingApproval && pendingApproval.step) {
    const stageInfo =
      APPROVAL_STAGES[pendingApproval.step as keyof typeof APPROVAL_STAGES];
    return { stage: pendingApproval.step, ...stageInfo };
  }

  // If all forwarded, find the highest step
  const maxStep = Math.max(...approvals.map((a) => a.step || 1));
  const stageInfo =
    APPROVAL_STAGES[Math.min(maxStep + 1, 4) as keyof typeof APPROVAL_STAGES] ||
    APPROVAL_STAGES[1];
  return { stage: maxStep + 1, ...stageInfo };
}

/**
 * Calculate days waiting since creation
 */
export function getDaysWaiting(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Normalize balance data to only include valid leave types
 */
export function normalizeBalanceData(
  balanceData: Record<string, unknown> | undefined
): Record<string, number> {
  if (!balanceData) return {};

  return Object.entries(balanceData).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      if (
        LEAVE_BALANCE_KEYS.includes(key as (typeof LEAVE_BALANCE_KEYS)[number]) &&
        typeof value === "number"
      ) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
}
