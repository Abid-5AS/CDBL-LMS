import { normalizeToDhakaMidnight } from "./date-utils";

export const policy = {
  version: "v2.0",
  accrual: { EL_PER_YEAR: 24, CL_PER_YEAR: 10, ML_PER_YEAR: 14 }, // EL: 24 days/year (2 × 12) per Policy 6.19
  carryForward: { EL: true, EARNED: true },
  carryForwardCap: { EL: 60, EARNED: 60 }, // cap total carry at 60
  allowBackdate: { EL: true, CL: false, ML: true, EARNED: true, CASUAL: false, MEDICAL: true },
  maxBackdateDays: { EL: 30, ML: 30, EARNED: 30, MEDICAL: 30 },
  elMinNoticeDays: 5, // hard requirement: ≥5 working days per Policy 6.11
  clMaxConsecutiveDays: 3, // Policy: max 3 days per spell
  // Note: CL is exempt from notice period per Policy 6.11.a
  elAccrualPerMonth: 2, // EL accrues 2 days/month
};

export type LeaveKind = "EARNED" | "CASUAL" | "MEDICAL";

export function daysInclusive(start: Date, end: Date): number {
  const ms = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}

export function needsMedicalCertificate(type: LeaveKind | string, days: number) {
  return String(type) === "MEDICAL" && days > 3;
}

export function canBackdate(type: LeaveKind | string) {
  const key = String(type);
  const map = policy.allowBackdate as Record<string, boolean>;
  return !!map[key];
}

export function withinBackdateLimit(type: LeaveKind | string, applyDate: Date, start: Date) {
  const key = String(type) as "EARNED" | "MEDICAL" | "CASUAL";
  // CL backdate is disallowed anyway
  const normalizedApply = normalizeToDhakaMidnight(applyDate);
  const normalizedStart = normalizeToDhakaMidnight(start);
  if (key === "CASUAL") return normalizedStart >= normalizedApply;
  const max = key === "EARNED" ? policy.maxBackdateDays.EL : policy.maxBackdateDays.ML;
  const diffDays = Math.floor((normalizedApply.getTime() - normalizedStart.getTime()) / 86400000);
  return diffDays <= max;
}

export type PolicyWarnings = {
  mlNeedsCertificate?: boolean;
  elInsufficientNotice?: boolean;
  // Note: CL is exempt from notice requirements per Policy 6.11.a
};

export function elNoticeWarning(applyDate: Date, start: Date) {
  const diff = Math.floor((start.setHours(0, 0, 0, 0) - applyDate.setHours(0, 0, 0, 0)) / 86400000);
  return diff < policy.elMinNoticeDays;
}

export function makeWarnings(type: LeaveKind | string, applyDate: Date, start: Date): PolicyWarnings {
  const warnings: PolicyWarnings = {};
  // Note: CL is exempt from notice requirements per Policy 6.11.a
  if ((String(type) === "EARNED" || String(type) === "EL") && elNoticeWarning(applyDate, start)) {
    warnings.elInsufficientNotice = true;
  }
  return warnings;
}

export const labels: Record<string, string> = {
  EARNED: "Earned Leave",
  CASUAL: "Casual Leave",
  MEDICAL: "Medical Leave",
};

/**
 * Service eligibility requirements per Policy 6.18
 * Values represent minimum years of service required
 */
export const SERVICE_ELIGIBILITY_YEARS: Record<string, number> = {
  EARNED: 1,
  CASUAL: 0,
  MEDICAL: 1,
  EXTRAWITHPAY: 3,
  EXTRAWITHOUTPAY: 2,
  MATERNITY: 0.5, // 6 months
  PATERNITY: 1,
  STUDY: 3,
  SPECIAL_DISABILITY: 3,
  QUARANTINE: 0,
};

/**
 * Calculate employee service years from join date
 */
export function getServiceYears(joinDate: Date): number {
  const today = new Date();
  const diffMs = today.getTime() - joinDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25); // Use 365.25 for leap years
}

/**
 * Calculate employee service months from join date
 */
export function getServiceMonths(joinDate: Date): number {
  const today = new Date();
  const diffMs = today.getTime() - joinDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
}

/**
 * Check if employee is eligible for a specific leave type based on service duration
 * Returns { eligible: boolean, reason?: string }
 */
export function checkLeaveEligibility(
  leaveType: string,
  joinDate: Date
): { eligible: boolean; reason?: string; requiredYears?: number } {
  const serviceYears = getServiceYears(joinDate);
  const requiredYears = SERVICE_ELIGIBILITY_YEARS[leaveType];

  if (requiredYears === undefined) {
    return { eligible: true }; // No restriction for unlisted types
  }

  if (serviceYears < requiredYears) {
    const yearsLabel = requiredYears === 1 ? "year" : requiredYears < 1 ? "months" : "years";
    const displayValue = requiredYears < 1 ? Math.round(requiredYears * 12) : requiredYears;
    const displayUnit = requiredYears < 1 ? "months" : yearsLabel;

    return {
      eligible: false,
      reason: `Requires ${displayValue} ${displayUnit} of continuous service. You have ${serviceYears.toFixed(1)} years.`,
      requiredYears,
    };
  }

  return { eligible: true, requiredYears };
}

/**
 * Calculate maternity leave days based on service duration (Policy 6.23.c)
 * - 6+ months service: Full 56 days (8 weeks)
 * - <6 months service: Pro-rated based on service months
 */
export function calculateMaternityLeaveDays(joinDate: Date): {
  days: number;
  isProrated: boolean;
  serviceMonths: number;
} {
  const serviceMonths = getServiceMonths(joinDate);
  const FULL_MATERNITY_DAYS = 56; // 8 weeks per Policy 6.23.a
  const MINIMUM_MONTHS = 6;

  if (serviceMonths >= MINIMUM_MONTHS) {
    return {
      days: FULL_MATERNITY_DAYS,
      isProrated: false,
      serviceMonths,
    };
  }

  // Pro-rate for employees with less than 6 months service
  const proratedDays = Math.floor((serviceMonths / MINIMUM_MONTHS) * FULL_MATERNITY_DAYS);

  return {
    days: proratedDays,
    isProrated: true,
    serviceMonths,
  };
}
