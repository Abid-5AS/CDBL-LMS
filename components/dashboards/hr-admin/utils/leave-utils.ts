/**
 * HR Admin Dashboard Utilities
 */

export const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

/**
 * Get color class for leave type badge
 */
export function getLeaveTypeColor(type: string): string {
  switch (type) {
    case "CASUAL":
      return "bg-info dark:bg-info/80/10 text-info dark:text-info/90 border-info/20";
    case "EARNED":
      return "bg-success dark:bg-success/80/10 text-success dark:text-success/90 border-success/20";
    case "MEDICAL":
      return "bg-danger dark:bg-danger/80/10 text-danger dark:text-danger/90 border-danger/20";
    default:
      return "bg-muted dark:bg-muted/80 text-muted-foreground dark:text-muted-foreground/80 border-border dark:border-border/30";
  }
}
