/**
 * Standardized status color tokens for consistent UI across the application
 * Used in chips, badges, summary cards, and table rows
 */

export const STATUS_COLORS = {
  PENDING: {
    chip: "bg-data-warning-soft text-data-warning border-data-warning/30 hover:bg-data-warning-soft/80",
    card:
      "bg-data-warning-soft/80 dark:bg-data-warning-soft/30 border-data-warning/20 dark:border-data-warning/40 text-data-warning",
    badge: "bg-data-warning/15 text-data-warning border-data-warning/30",
  },
  FORWARDED: {
    chip: "bg-data-info-soft text-data-info border-data-info/30 hover:bg-data-info-soft/80",
    card:
      "bg-data-info-soft/80 dark:bg-data-info-soft/30 border-data-info/20 dark:border-data-info/40 text-data-info",
    badge: "bg-data-info/15 text-data-info border-data-info/30",
  },
  APPROVED: {
    chip: "bg-data-success-soft text-data-success border-data-success/30 hover:bg-data-success-soft/80",
    card:
      "bg-data-success-soft/80 dark:bg-data-success-soft/30 border-data-success/20 dark:border-data-success/40 text-data-success",
    badge: "bg-data-success/15 text-data-success border-data-success/30",
  },
  RETURNED: {
    chip: "bg-status-returned/15 text-status-returned border-status-returned/30 hover:bg-status-returned/25",
    card:
      "bg-status-returned/10 dark:bg-status-returned/20 border-status-returned/30 text-status-returned",
    badge: "bg-status-returned/15 text-status-returned border-status-returned/30",
  },
  CANCELLED: {
    chip: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20 hover:bg-status-cancelled/20",
    card: "bg-bg-secondary border-bg-muted text-text-secondary",
    badge:
      "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

/**
 * Get color classes for a status
 */
export function getStatusColors(
  status: string,
  variant: "chip" | "card" | "badge" = "chip"
): string {
  const normalizedStatus = status.toUpperCase();

  // Map FORWARDED to APPROVED colors for consistency
  if (normalizedStatus === "FORWARDED") {
    return STATUS_COLORS.FORWARDED[variant];
  }

  const statusKey = normalizedStatus as StatusColorKey;
  if (statusKey in STATUS_COLORS) {
    return STATUS_COLORS[statusKey][variant];
  }

  // Default fallback
  return STATUS_COLORS.PENDING[variant];
}
