import { normalizeToDhakaMidnight } from "./date-utils";
import { formatDate } from "./utils";

export const policy = {
  version: "v2.0",
  accrual: { EL_PER_YEAR: 24, CL_PER_YEAR: 10, ML_PER_YEAR: 14 }, // EL: 24 days/year (2 × 12) per Policy 6.19
  carryForward: { EL: true, EARNED: true },
  carryForwardCap: { EL: 60, EARNED: 60 }, // cap total carry at 60
  allowBackdate: {
    EL: true,
    CL: false,
    ML: true,
    EARNED: true,
    CASUAL: false,
    MEDICAL: true,
  },
  maxBackdateDays: { EL: 30, ML: 30, EARNED: 30, MEDICAL: 30 },
  elMinNoticeDays: 5, // hard requirement: ≥5 working days per Policy 6.11 (for EL only)
  clMaxConsecutiveDays: 3, // Policy: max 3 days per spell
  // IMPORTANT: CL and Quarantine leave are EXEMPT from notice requirements per Policy 6.11.a
  // "All applications for leave... at least 5 working days ahead (with the exception of casual leave and quarantine leave)"
  elAccrualPerMonth: 2, // EL accrues 2 days/month
};

export type LeaveKind = "EARNED" | "CASUAL" | "MEDICAL";

export function daysInclusive(start: Date, end: Date): number {
  const ms = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}

export function needsMedicalCertificate(
  type: LeaveKind | string,
  days: number
) {
  return String(type) === "MEDICAL" && days > 3;
}

export function canBackdate(type: LeaveKind | string) {
  const key = String(type);
  const map = policy.allowBackdate as Record<string, boolean>;
  return !!map[key];
}

export function withinBackdateLimit(
  type: LeaveKind | string,
  applyDate: Date,
  start: Date
) {
  const key = String(type) as "EARNED" | "MEDICAL" | "CASUAL";
  // CL backdate is disallowed anyway
  const normalizedApply = normalizeToDhakaMidnight(applyDate);
  const normalizedStart = normalizeToDhakaMidnight(start);
  if (key === "CASUAL") return normalizedStart >= normalizedApply;
  const max =
    key === "EARNED" ? policy.maxBackdateDays.EL : policy.maxBackdateDays.ML;
  const diffDays = Math.floor(
    (normalizedApply.getTime() - normalizedStart.getTime()) / 86400000
  );
  return diffDays <= max;
}

export type PolicyWarnings = {
  mlNeedsCertificate?: boolean;
  elInsufficientNotice?: boolean;
  clShortNotice?: boolean;
  // Note: CL is exempt from notice requirements per Policy 6.11.a
};

export function elNoticeWarning(applyDate: Date, start: Date) {
  const diff = Math.floor(
    (start.setHours(0, 0, 0, 0) - applyDate.setHours(0, 0, 0, 0)) / 86400000
  );
  return diff < policy.elMinNoticeDays;
}

/**
 * Check if CL (Casual Leave) notice is insufficient
 * Note: Per Policy 6.11.a, CL is EXEMPT from notice requirements
 * This function always returns false to maintain API consistency
 */
export function clNoticeWarning(applyDate: Date, start: Date): boolean {
  // CL is exempt from notice requirements per Policy 6.11.a
  // Always return false to indicate no warning needed
  return false;
}

export function makeWarnings(
  type: LeaveKind | string,
  applyDate: Date,
  start: Date
): PolicyWarnings {
  const warnings: PolicyWarnings = {};
  // Note: CL is exempt from notice requirements per Policy 6.11.a
  if (
    (String(type) === "EARNED" || String(type) === "EL") &&
    elNoticeWarning(applyDate, start)
  ) {
    warnings.elInsufficientNotice = true;
  }
  // CL is exempt, but we can include it for API consistency (will always be false)
  if (
    (String(type) === "CASUAL" || String(type) === "CL") &&
    clNoticeWarning(applyDate, start)
  ) {
    warnings.clShortNotice = true;
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
  SPECIAL: 1, // Transferred from EL, same eligibility requirement
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
    const yearsLabel =
      requiredYears === 1 ? "year" : requiredYears < 1 ? "months" : "years";
    const displayValue =
      requiredYears < 1 ? Math.round(requiredYears * 12) : requiredYears;
    const displayUnit = requiredYears < 1 ? "months" : yearsLabel;

    return {
      eligible: false,
      reason: `Requires ${displayValue} ${displayUnit} of continuous service. You have ${serviceYears.toFixed(
        1
      )} years.`,
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
  const proratedDays = Math.floor(
    (serviceMonths / MINIMUM_MONTHS) * FULL_MATERNITY_DAYS
  );

  return {
    days: proratedDays,
    isProrated: true,
    serviceMonths,
  };
}

/**
 * Validate quarantine leave duration (Policy 6.28.b)
 * - Standard: Up to 21 days
 * - Exceptional: 21-30 days (requires CEO approval)
 * - Maximum: 30 days
 */
export function validateQuarantineLeaveDuration(days: number): {
  valid: boolean;
  requiresExceptionalApproval: boolean;
  reason?: string;
} {
  if (days <= 21) {
    return { valid: true, requiresExceptionalApproval: false };
  }

  if (days <= 30) {
    return {
      valid: true,
      requiresExceptionalApproval: true,
      reason:
        "Quarantine leave exceeding 21 days requires exceptional approval from CEO (Policy 6.28.b)",
    };
  }

  return {
    valid: false,
    requiresExceptionalApproval: false,
    reason: "Quarantine leave cannot exceed 30 days per Policy 6.28.b",
  };
}

/**
 * Validate special disability leave duration (Policy 6.27.c)
 * - Maximum: 6 months (180 days) per disability
 */
export function validateSpecialDisabilityDuration(days: number): {
  valid: boolean;
  reason?: string;
} {
  const MAX_DAYS = 180; // 6 months

  if (days > MAX_DAYS) {
    return {
      valid: false,
      reason: `Special disability leave cannot exceed ${MAX_DAYS} days (6 months) per Policy 6.27.c. Requested: ${days} days.`,
    };
  }

  return { valid: true };
}

/**
 * Validate extraordinary leave duration based on service years (Policy 6.22.a, 6.22.b)
 * - <5 years service: Maximum 6 months (180 days)
 * - >=5 years service: Maximum 12 months (365 days)
 */
export function validateExtraordinaryLeaveDuration(
  days: number,
  joinDate: Date
): {
  valid: boolean;
  reason?: string;
  maxAllowed: number;
} {
  const serviceYears = getServiceYears(joinDate);
  const maxDays = serviceYears >= 5 ? 365 : 180; // 12 months or 6 months
  const maxLabel = serviceYears >= 5 ? "12 months" : "6 months";

  if (days > maxDays) {
    return {
      valid: false,
      reason: `Extraordinary leave cannot exceed ${maxLabel} for employees with ${serviceYears.toFixed(
        1
      )} years of service (Policy 6.22). Requested: ${days} days.`,
      maxAllowed: maxDays,
    };
  }

  return { valid: true, maxAllowed: maxDays };
}

/**
 * Check medical leave usage against annual limit (Policy 6.21.c)
 * Medical leave in excess of 14 days shall be adjusted with EL/special leave
 */
export function checkMedicalLeaveAnnualLimit(
  usedThisYear: number,
  requestedDays: number
): {
  withinLimit: boolean;
  totalUsage: number;
  exceedsDays: number;
  warning?: string;
} {
  const ML_ANNUAL_LIMIT = policy.accrual.ML_PER_YEAR; // 14 days
  const totalUsage = usedThisYear + requestedDays;
  const exceedsDays = Math.max(0, totalUsage - ML_ANNUAL_LIMIT);

  if (exceedsDays > 0) {
    return {
      withinLimit: false,
      totalUsage,
      exceedsDays,
      warning: `This request would exceed annual medical leave limit of ${ML_ANNUAL_LIMIT} days. You have used ${usedThisYear} days and are requesting ${requestedDays} days (total: ${totalUsage} days). Per Policy 6.21.c, medical leave beyond ${ML_ANNUAL_LIMIT} days should be deducted from Earned/Special leave. Consider applying for ${
        requestedDays - exceedsDays
      } days as Medical Leave and ${exceedsDays} days as Earned Leave instead.`,
    };
  }

  return {
    withinLimit: true,
    totalUsage,
    exceedsDays: 0,
  };
}

/**
 * Validate EL encashment eligibility and amount (Policy 6.19.f)
 * Employees can encash EL balance exceeding 10 days
 * @param currentBalance - Current EL balance (opening + accrued - used)
 * @param requestedDays - Days employee wants to encash
 * @returns Validation result with eligibility and max encashable days
 */
export function validateELEncashment(
  currentBalance: number,
  requestedDays: number
): {
  valid: boolean;
  reason?: string;
  maxEncashable: number;
  remainingBalance: number;
} {
  const EL_MIN_RETAIN = 10; // Must keep at least 10 days per Policy 6.19.f
  const maxEncashable = Math.max(0, currentBalance - EL_MIN_RETAIN);

  if (currentBalance <= EL_MIN_RETAIN) {
    return {
      valid: false,
      reason: `Encashment requires EL balance exceeding ${EL_MIN_RETAIN} days (Policy 6.19.f). Your current balance is ${currentBalance} days.`,
      maxEncashable: 0,
      remainingBalance: currentBalance,
    };
  }

  if (requestedDays <= 0) {
    return {
      valid: false,
      reason: "Requested days must be greater than 0.",
      maxEncashable,
      remainingBalance: currentBalance,
    };
  }

  if (requestedDays > maxEncashable) {
    return {
      valid: false,
      reason: `You can encash up to ${maxEncashable} days. Requested: ${requestedDays} days. You must retain at least ${EL_MIN_RETAIN} days EL balance per Policy 6.19.f.`,
      maxEncashable,
      remainingBalance: currentBalance,
    };
  }

  const remainingBalance = currentBalance - requestedDays;

  return {
    valid: true,
    maxEncashable,
    remainingBalance,
  };
}

/**
 * Validate study leave duration (Policy 6.25.b)
 * Initial study leave: Maximum 1 year (365 days)
 * Extension: Maximum 1 additional year (total 2 years/730 days)
 * Extension requires Board of Directors approval
 * @param requestedDays - Days requested for study leave
 * @param previousStudyLeaveDays - Total days of previous study leave (if extension)
 * @returns Validation result with duration limits
 */
export function validateStudyLeaveDuration(
  requestedDays: number,
  previousStudyLeaveDays?: number
): {
  valid: boolean;
  reason?: string;
  isExtension: boolean;
  requiresBoardApproval: boolean;
  totalDays: number;
} {
  const isExtension = !!previousStudyLeaveDays && previousStudyLeaveDays > 0;
  const totalDays = isExtension
    ? (previousStudyLeaveDays ?? 0) + requestedDays
    : requestedDays;

  if (!isExtension) {
    // Initial study leave: Maximum 365 days (1 year)
    if (requestedDays > 365) {
      return {
        valid: false,
        reason: `Initial study leave cannot exceed 365 days (1 year). Requested: ${requestedDays} days.`,
        isExtension: false,
        requiresBoardApproval: false,
        totalDays: requestedDays,
      };
    }

    return {
      valid: true,
      isExtension: false,
      requiresBoardApproval: false,
      totalDays: requestedDays,
    };
  } else {
    // Extension: Total cannot exceed 730 days (2 years)
    if (totalDays > 730) {
      return {
        valid: false,
        reason: `Total study leave including extension cannot exceed 730 days (2 years). Previous: ${previousStudyLeaveDays} days, Requested: ${requestedDays} days, Total: ${totalDays} days.`,
        isExtension: true,
        requiresBoardApproval: true,
        totalDays,
      };
    }

    return {
      valid: true,
      isExtension: true,
      requiresBoardApproval: true, // All extensions require Board approval
      totalDays,
    };
  }
}

/**
 * Validate study leave retirement eligibility (Policy 6.25.a)
 * Study leave may only be granted if employee has at least 5 years of service left before retirement
 * @param retirementDate - Employee's expected retirement date
 * @param studyLeaveEndDate - Expected end date of study leave
 * @returns Validation result with years until retirement
 */
export function validateStudyLeaveRetirement(
  retirementDate: Date | null,
  studyLeaveEndDate: Date
): {
  valid: boolean;
  reason?: string;
  yearsUntilRetirement?: number;
} {
  if (!retirementDate) {
    // If no retirement date is set, we cannot validate
    // This could be either allowed (employee hasn't reached retirement age) or blocked
    // For now, we'll return a warning but allow it
    return {
      valid: true,
      reason:
        "Retirement date not set. Please ensure employee has at least 5 years until retirement per Policy 6.25.a",
    };
  }

  // Calculate years between study leave end and retirement
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const yearsUntilRetirement =
    (retirementDate.getTime() - studyLeaveEndDate.getTime()) /
    millisecondsPerYear;

  if (yearsUntilRetirement < 5) {
    return {
      valid: false,
      reason: `Study leave cannot be granted if less than 5 years until retirement. Retirement: ${formatDate(
        retirementDate
      )}, Study leave end: ${formatDate(
        studyLeaveEndDate
      )}, Years until retirement: ${yearsUntilRetirement.toFixed(
        1
      )} years (Policy 6.25.a)`,
      yearsUntilRetirement,
    };
  }

  return {
    valid: true,
    yearsUntilRetirement,
  };
}

/**
 * Calculate Special Disability Leave pay breakdown (Policy 6.22)
 * Pay structure:
 * - First 90 days (0-90): Full pay (1.0x)
 * - Next 90 days (91-180): Half pay (0.5x)
 * - Beyond 180 days: Unpaid (0x, but duration validation prevents this)
 *
 * @param totalDays - Total working days of leave
 * @returns Pay breakdown with full, half, and unpaid days
 */
export function calculateSpecialDisabilityPay(totalDays: number): {
  fullPayDays: number;
  halfPayDays: number;
  unPaidDays: number;
  totalDays: number;
} {
  const FULL_PAY_THRESHOLD = 90;
  const HALF_PAY_THRESHOLD = 180;

  let fullPayDays = 0;
  let halfPayDays = 0;
  let unPaidDays = 0;

  if (totalDays <= FULL_PAY_THRESHOLD) {
    // All days at full pay
    fullPayDays = totalDays;
  } else if (totalDays <= HALF_PAY_THRESHOLD) {
    // First 90 days at full pay, remainder at half pay
    fullPayDays = FULL_PAY_THRESHOLD;
    halfPayDays = totalDays - FULL_PAY_THRESHOLD;
  } else {
    // First 90 at full, next 90 at half, remainder unpaid
    fullPayDays = FULL_PAY_THRESHOLD;
    halfPayDays = HALF_PAY_THRESHOLD - FULL_PAY_THRESHOLD; // 90 days
    unPaidDays = totalDays - HALF_PAY_THRESHOLD;
  }

  return {
    fullPayDays,
    halfPayDays,
    unPaidDays,
    totalDays,
  };
}

/**
 * Validate Special Disability Leave incident date and timeline (Policy 6.22)
 * Rules:
 * - Incident date must be within 3 months before leave start date
 * - Incident date cannot be in the future
 * - Duration already validated separately (max 180 days)
 *
 * @param incidentDate - Date when the disabling incident occurred
 * @param startDate - Proposed leave start date
 * @returns Validation result with incident timeline details
 */
export function validateSpecialDisabilityIncidentDate(
  incidentDate: Date,
  startDate: Date
): {
  valid: boolean;
  reason?: string;
  monthsSinceIncident?: number;
  validDateRange?: { earliest: Date; latest: Date };
} {
  const normalizedIncident = normalizeToDhakaMidnight(incidentDate);
  const normalizedStart = normalizeToDhakaMidnight(startDate);
  const today = normalizeToDhakaMidnight(new Date());

  // Check if incident date is in the future
  if (normalizedIncident > today) {
    return {
      valid: false,
      reason: `Incident date cannot be in the future. Incident date: ${formatDate(
        normalizedIncident
      )}, Today: ${formatDate(today)}`,
    };
  }

  // Calculate 3 months before start date (90 days for simplicity)
  const threeMonthsAgo = new Date(normalizedStart);
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

  // Check if incident is within 3 months of start date
  if (normalizedIncident < threeMonthsAgo) {
    const daysSinceIncident = Math.floor(
      (normalizedStart.getTime() - normalizedIncident.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const monthsSinceIncident = daysSinceIncident / 30.44;

    return {
      valid: false,
      reason: `Special Disability Leave must be taken within 3 months of the disabling incident (Policy 6.22). Incident occurred ${monthsSinceIncident.toFixed(
        1
      )} months before leave start. Valid date range: ${formatDate(
        threeMonthsAgo
      )} to ${formatDate(normalizedStart)}`,
      monthsSinceIncident,
      validDateRange: {
        earliest: threeMonthsAgo,
        latest: normalizedStart,
      },
    };
  }

  // Check if incident is after start date (doesn't make sense)
  if (normalizedIncident > normalizedStart) {
    return {
      valid: false,
      reason: `Incident date cannot be after leave start date. Incident: ${formatDate(
        normalizedIncident
      )}, Start: ${formatDate(normalizedStart)}`,
    };
  }

  const daysSinceIncident = Math.floor(
    (normalizedStart.getTime() - normalizedIncident.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const monthsSinceIncident = daysSinceIncident / 30.44;

  return {
    valid: true,
    monthsSinceIncident,
    validDateRange: {
      earliest: threeMonthsAgo,
      latest: normalizedStart,
    },
  };
}
