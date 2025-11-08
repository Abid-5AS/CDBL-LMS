/**
 * Standardized status color tokens for consistent UI across the application
 * Used in chips, badges, summary cards, and table rows
 */

export const STATUS_COLORS = {
  PENDING: {
    chip: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    card: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    badge:
      "bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800",
  },
  FORWARDED: {
    chip: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    card: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    badge:
      "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  APPROVED: {
    chip: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    card: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    badge:
      "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  RETURNED: {
    chip: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
    card: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    badge:
      "bg-yellow-50/80 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800",
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
