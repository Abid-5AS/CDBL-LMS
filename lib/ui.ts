export const leaveTypeLabel: Record<string, string> = {
  EARNED: "Earned Leave",
  CASUAL: "Casual Leave",
  MEDICAL: "Medical Leave (Sick Leave)",
  EXTRAWITHPAY: "Extraordinary Leave (with pay)",
  EXTRAWITHOUTPAY: "Extraordinary Leave (without pay)",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  STUDY: "Study Leave",
  SPECIAL_DISABILITY: "Special Disability Leave",
  QUARANTINE: "Quarantine Leave",
  SPECIAL: "Special Leave (EL Excess)",
};

export const leaveTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    EARNED: "#3b82f6", // blue
    CASUAL: "#22c55e", // green
    MEDICAL: "#ef4444", // red
    MATERNITY: "#ec4899", // pink
    PATERNITY: "#a855f7", // purple
    STUDY: "#eab308", // yellow
    EXTRAWITHPAY: "#f97316", // orange
    EXTRAWITHOUTPAY: "#6b7280", // gray
    SPECIAL_DISABILITY: "#6366f1", // indigo
    QUARANTINE: "#14b8a6", // teal
    SPECIAL: "#8b5cf6", // violet
  };
  return colors[type] || "#64748b"; // default to slate
};
