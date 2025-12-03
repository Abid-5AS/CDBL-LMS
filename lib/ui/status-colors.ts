/**
 * Standardized status color tokens for consistent UI across the application
 * Used in chips, badges, summary cards, and table rows
 */

export const STATUS_COLORS = {
  PENDING: {
    chip: "bg-warning/15 dark:bg-warning/25 text-warning dark:text-warning/90 border-warning/30 dark:border-warning/40 hover:bg-warning/20 dark:hover:bg-warning/30 transition-colors duration-100",
    card: "bg-warning/10 dark:bg-warning/20 border-warning/20 dark:border-warning/30 text-warning dark:text-warning/90",
    badge: "bg-warning/15 dark:bg-warning/25 text-warning dark:text-warning/90 border-warning/30",
  },
  FORWARDED: {
    chip: "bg-info/15 dark:bg-info/25 text-info dark:text-info/90 border-info/30 dark:border-info/40 hover:bg-info/20 dark:hover:bg-info/30 transition-colors duration-100",
    card: "bg-info/10 dark:bg-info/20 border-info/20 dark:border-info/30 text-info dark:text-info/90",
    badge: "bg-info/15 dark:bg-info/25 text-info dark:text-info/90 border-info/30",
  },
  APPROVED: {
    chip: "bg-success/15 dark:bg-success/25 text-success dark:text-success/90 border-success/30 dark:border-success/40 hover:bg-success/20 dark:hover:bg-success/30 transition-colors duration-100",
    card: "bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/30 text-success dark:text-success/90",
    badge: "bg-success/15 dark:bg-success/25 text-success dark:text-success/90 border-success/30",
  },
  REJECTED: {
    chip: "bg-danger/15 dark:bg-danger/25 text-danger dark:text-danger/90 border-danger/30 dark:border-danger/40 hover:bg-danger/20 dark:hover:bg-danger/30 transition-colors duration-100",
    card: "bg-danger/10 dark:bg-danger/20 border-danger/20 dark:border-danger/30 text-danger dark:text-danger/90",
    badge: "bg-danger/15 dark:bg-danger/25 text-danger dark:text-danger/90 border-danger/30",
  },
  RETURNED: {
    chip: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/40 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-colors duration-100",
    card: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400",
    badge: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  CANCELLED: {
    chip: "bg-muted dark:bg-muted/80 text-muted-foreground dark:text-muted-foreground/80 border-muted dark:border-muted/50 hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors duration-100",
    card: "bg-muted dark:bg-muted/80 border-muted dark:border-muted/50 text-muted-foreground dark:text-muted-foreground/80",
    badge: "bg-muted dark:bg-muted/80 text-muted-foreground dark:text-muted-foreground/80 border-muted dark:border-muted/50",
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

  // Map FORWARDED to info colors
  if (normalizedStatus === "FORWARDED") {
    return STATUS_COLORS.FORWARDED[variant];
  }

  const statusKey = normalizedStatus as StatusColorKey;
  if (statusKey in STATUS_COLORS) {
    return STATUS_COLORS[statusKey][variant];
  }

  // Default fallback to pending
  return STATUS_COLORS.PENDING[variant];
}
