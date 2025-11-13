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
      return "bg-data-info/10 text-data-info border-data-info/20";
    case "EARNED":
      return "bg-data-success/10 text-data-success border-data-success/20";
    case "MEDICAL":
      return "bg-data-error/10 text-data-error border-data-error/20";
    default:
      return "bg-bg-secondary text-text-secondary border-bg-muted";
  }
}
