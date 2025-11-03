import { normalizeToDhakaMidnight } from "./date-utils";

export const policy = {
  version: "v2.0",
  accrual: { EL_PER_YEAR: 24, CL_PER_YEAR: 10, ML_PER_YEAR: 14 }, // EL: 24 days/year (2 × 12) per Policy 6.19
  carryForward: { EL: true, EARNED: true },
  carryForwardCap: { EL: 60, EARNED: 60 }, // cap total carry at 60
  allowBackdate: { EL: true, CL: false, ML: true, EARNED: true, CASUAL: false, MEDICAL: true },
  maxBackdateDays: { EL: 30, ML: 30, EARNED: 30, MEDICAL: 30 },
  clMinNoticeDays: 5, // warning only for CL (soft rule)
  elMinNoticeDays: 5, // hard requirement: ≥5 working days per Policy 6.11
  clMaxConsecutiveDays: 3, // Policy: max 3 days per spell
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
  clShortNotice?: boolean; 
  mlNeedsCertificate?: boolean;
  elInsufficientNotice?: boolean;
};

export function clNoticeWarning(applyDate: Date, start: Date) {
  const diff = Math.floor((start.setHours(0, 0, 0, 0) - applyDate.setHours(0, 0, 0, 0)) / 86400000);
  return diff < policy.clMinNoticeDays;
}

export function elNoticeWarning(applyDate: Date, start: Date) {
  const diff = Math.floor((start.setHours(0, 0, 0, 0) - applyDate.setHours(0, 0, 0, 0)) / 86400000);
  return diff < policy.elMinNoticeDays;
}

export function makeWarnings(type: LeaveKind | string, applyDate: Date, start: Date): PolicyWarnings {
  const warnings: PolicyWarnings = {};
  if (String(type) === "CASUAL" && clNoticeWarning(applyDate, start)) {
    warnings.clShortNotice = true;
  }
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
