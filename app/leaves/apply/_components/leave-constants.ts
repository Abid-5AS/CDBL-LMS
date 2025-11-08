import { leaveTypeLabel } from "@/lib/ui";

export type LeaveType =
  | "EARNED"
  | "CASUAL"
  | "MEDICAL"
  | "MATERNITY"
  | "PATERNITY"
  | "STUDY"
  | "SPECIAL_DISABILITY"
  | "QUARANTINE"
  | "EXTRAWITHPAY"
  | "EXTRAWITHOUTPAY";

export const LEAVE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "EARNED", label: leaveTypeLabel.EARNED },
  { value: "CASUAL", label: leaveTypeLabel.CASUAL },
  { value: "MEDICAL", label: leaveTypeLabel.MEDICAL },
  { value: "MATERNITY", label: leaveTypeLabel.MATERNITY },
  { value: "PATERNITY", label: leaveTypeLabel.PATERNITY },
  { value: "STUDY", label: leaveTypeLabel.STUDY },
  { value: "SPECIAL_DISABILITY", label: leaveTypeLabel.SPECIAL_DISABILITY },
  { value: "QUARANTINE", label: leaveTypeLabel.QUARANTINE },
  { value: "EXTRAWITHPAY", label: leaveTypeLabel.EXTRAWITHPAY },
  { value: "EXTRAWITHOUTPAY", label: leaveTypeLabel.EXTRAWITHOUTPAY },
];

export const POLICY_TOOLTIPS: Record<LeaveType, string> = {
  EARNED: "Submit ≥ 5 working days before start. Accrues 2 days per month. Balance carries forward up to 60 days.",
  CASUAL: "Max 3 consecutive days per spell. Cannot start/end on Friday, Saturday, or holidays. Must retain 5 days balance.",
  MEDICAL: "Attach certificate if > 3 days. Fitness certificate required to return if > 7 days. Backdating allowed up to 30 days.",
  MATERNITY: "Requires medical certificate. Usually 16 weeks duration. Apply well in advance.",
  PATERNITY: "Usually up to 14 days. Apply with sufficient notice. May require supporting documentation.",
  STUDY: "Requires approval from HR. Supporting documentation may be required. Apply in advance for planning.",
  SPECIAL_DISABILITY: "Medical certificate required. Subject to HR approval. Duration varies by case.",
  QUARANTINE: "Backdating allowed if applicable. Medical certificate may be required. Subject to HR verification.",
  EXTRAWITHPAY: "Requires CEO approval. Subject to company policy. May require supporting documentation.",
  EXTRAWITHOUTPAY: "Requires CEO approval. Does not affect leave balance. Subject to company policy.",
};

export const RULE_TIPS: Record<LeaveType, string[]> = {
  CASUAL: [
    "Max 3 consecutive days per spell",
    "Cannot start/end on Friday, Saturday, or holidays",
    "Must retain 5 days balance",
  ],
  EARNED: [
    "Submit at least 5 working days in advance",
    "Accrues 2 days per month",
    "Balance carries forward up to 60 days",
  ],
  MEDICAL: [
    "Certificate required if > 3 days",
    "Fitness certificate required to return if > 7 days",
    "Backdating allowed up to 30 days",
  ],
  MATERNITY: [
    "Requires medical certificate",
    "Usually 16 weeks duration",
    "Apply well in advance",
  ],
  PATERNITY: [
    "Usually up to 14 days",
    "Apply with sufficient notice",
    "May require supporting documentation",
  ],
  STUDY: [
    "Requires approval from HR",
    "Supporting documentation may be required",
    "Apply in advance for planning",
  ],
  SPECIAL_DISABILITY: [
    "Medical certificate required",
    "Subject to HR approval",
    "Duration varies by case",
  ],
  QUARANTINE: [
    "Backdating allowed if applicable",
    "Medical certificate may be required",
    "Subject to HR verification",
  ],
  EXTRAWITHPAY: [
    "Requires CEO approval",
    "Subject to company policy",
    "May require supporting documentation",
  ],
  EXTRAWITHOUTPAY: [
    "Requires CEO approval",
    "Does not affect leave balance",
    "Subject to company policy",
  ],
};
