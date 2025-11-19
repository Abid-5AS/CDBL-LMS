import type { FilterStatus } from "@/hooks/useLeaveRequests";

export const filterOptions: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
];
