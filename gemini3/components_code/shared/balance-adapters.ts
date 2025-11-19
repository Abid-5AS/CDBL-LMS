/**
 * Balance Adapters
 * Convert various data formats to Balance[] for LeaveBalancePanel
 */

import type { Balance, BalanceType } from "./LeaveBalancePanel";

// Policy limits (from lib/policy.ts)
const POLICY_LIMITS: Record<BalanceType, number> = {
  EARNED: 24,
  CASUAL: 10,
  MEDICAL: 14,
};

/**
 * Adapter: fromEmployeeProfile
 * Converts employee profile data (with entitlements + usage) to Balance[]
 */
export function fromEmployeeProfile(profile: {
  entitlements?: Record<string, number>;
  usage?: Record<string, number>;
  projected?: Record<string, number>;
  carryForward?: Record<string, number>;
}): Balance[] {
  const balances: Balance[] = [];

  (["EARNED", "CASUAL", "MEDICAL"] as BalanceType[]).forEach((type) => {
    const remaining = profile.entitlements?.[type] ?? 0;
    const total = POLICY_LIMITS[type];
    const used = Math.max(0, total - remaining);

    balances.push({
      type,
      used,
      total,
      projected: profile.projected?.[type],
      carryForward: type === "EARNED" ? profile.carryForward?.[type] : undefined,
    });
  });

  return balances;
}

/**
 * Adapter: fromDashboardSummary
 * Converts API balance response (e.g., /api/balance/mine) to Balance[]
 */
export function fromDashboardSummary(
  summary: Record<string, number> | null | undefined
): Balance[] {
  if (!summary) {
    // Return empty balances with policy limits
    return (["EARNED", "CASUAL", "MEDICAL"] as BalanceType[]).map((type) => ({
      type,
      used: 0,
      total: POLICY_LIMITS[type],
    }));
  }

  const balances: Balance[] = [];

  (["EARNED", "CASUAL", "MEDICAL"] as BalanceType[]).forEach((type) => {
    const remaining = summary[type] ?? 0;
    const total = POLICY_LIMITS[type];
    const used = Math.max(0, total - remaining);

    balances.push({
      type,
      used,
      total,
    });
  });

  return balances;
}

/**
 * Adapter: fromBalanceResponse
 * Converts /api/balance/mine response format to Balance[]
 * Handles year-based responses and optional fields
 */
export function fromBalanceResponse(response: {
  year?: number;
  EARNED?: number;
  CASUAL?: number;
  MEDICAL?: number;
  [key: string]: number | undefined;
}): Balance[] {
  const balances: Balance[] = [];

  (["EARNED", "CASUAL", "MEDICAL"] as BalanceType[]).forEach((type) => {
    const remaining = response[type] ?? 0;
    const total = POLICY_LIMITS[type];
    const used = Math.max(0, total - remaining);

    balances.push({
      type,
      used,
      total,
    });
  });

  return balances;
}

/**
 * Fallback: compute from history
 * Computes balances from leave history if server lacks fields
 * This is a last resort - prefer server-provided balances
 */
export function computeFromHistory(
  leaves: Array<{
    type: string;
    workingDays: number;
    status: string;
    startDate: string;
  }>,
  year?: number
): Balance[] {
  const currentYear = year ?? new Date().getFullYear();
  const balances: Balance[] = [];

  (["EARNED", "CASUAL", "MEDICAL"] as BalanceType[]).forEach((type) => {
    const total = POLICY_LIMITS[type];

    // Count approved leaves of this type in the current year
    const used = leaves
      .filter((leave) => {
        if (leave.type !== type) return false;
        if (leave.status !== "APPROVED") return false;
        const leaveYear = new Date(leave.startDate).getFullYear();
        return leaveYear === currentYear;
      })
      .reduce((sum, leave) => sum + (leave.workingDays || 0), 0);

    balances.push({
      type,
      used: Math.min(used, total), // Cap at total
      total,
    });
  });

  return balances;
}

