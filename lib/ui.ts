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

// Professional Neo Color System with Glassmorphism Support
export const leaveTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    EARNED: "#0066FF", // Deep azure - Professional, reliable
    CASUAL: "#00D084", // Vibrant emerald - Fresh, balanced
    MEDICAL: "#FF3B30", // Critical red - High visibility
    MATERNITY: "#FF2D55", // Rose pink - Warm, nurturing
    PATERNITY: "#5E5CE6", // Rich violet - Modern, supportive
    STUDY: "#FFCC00", // Golden yellow - Learning, growth
    EXTRAWITHPAY: "#FF9500", // Bright orange - Premium attention
    EXTRAWITHOUTPAY: "#8E8E93", // Neutral gray - Standard
    SPECIAL_DISABILITY: "#5856D6", // Deep indigo - Dignified, important
    QUARANTINE: "#32ADE6", // Sky blue - Health-focused, calm
    SPECIAL: "#AF52DE", // Purple - Unique, special
  };
  return colors[type] || "#64748b";
};

// Glassmorphism gradient overlays for enhanced depth
export const leaveTypeGradient = (type: string): string => {
  const gradients: Record<string, string> = {
    EARNED: "linear-gradient(135deg, rgba(0, 102, 255, 0.9) 0%, rgba(0, 163, 255, 0.7) 100%)",
    CASUAL: "linear-gradient(135deg, rgba(0, 208, 132, 0.9) 0%, rgba(52, 211, 153, 0.7) 100%)",
    MEDICAL: "linear-gradient(135deg, rgba(255, 59, 48, 0.9) 0%, rgba(255, 100, 97, 0.7) 100%)",
    MATERNITY: "linear-gradient(135deg, rgba(255, 45, 85, 0.9) 0%, rgba(255, 105, 180, 0.7) 100%)",
    PATERNITY: "linear-gradient(135deg, rgba(94, 92, 230, 0.9) 0%, rgba(139, 92, 246, 0.7) 100%)",
    STUDY: "linear-gradient(135deg, rgba(255, 204, 0, 0.9) 0%, rgba(251, 191, 36, 0.7) 100%)",
    EXTRAWITHPAY: "linear-gradient(135deg, rgba(255, 149, 0, 0.9) 0%, rgba(251, 146, 60, 0.7) 100%)",
    EXTRAWITHOUTPAY: "linear-gradient(135deg, rgba(142, 142, 147, 0.9) 0%, rgba(156, 163, 175, 0.7) 100%)",
    SPECIAL_DISABILITY: "linear-gradient(135deg, rgba(88, 86, 214, 0.9) 0%, rgba(99, 102, 241, 0.7) 100%)",
    QUARANTINE: "linear-gradient(135deg, rgba(50, 173, 230, 0.9) 0%, rgba(56, 189, 248, 0.7) 100%)",
    SPECIAL: "linear-gradient(135deg, rgba(175, 82, 222, 0.9) 0%, rgba(192, 132, 252, 0.7) 100%)",
  };
  return gradients[type] || "linear-gradient(135deg, rgba(100, 116, 139, 0.9) 0%, rgba(148, 163, 184, 0.7) 100%)";
};
