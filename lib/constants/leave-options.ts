/**
 * Centralized constants for leave types, status options, and filter options
 * Used across all components for consistency
 */

import { LeaveType, LeaveStatus } from "@prisma/client";
import { leaveTypeLabel } from "@/lib/ui";

/**
 * Leave type options for filters and dropdowns
 */
export const LEAVE_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.values(LeaveType).map((type) => ({
    value: type,
    label: leaveTypeLabel[type] || type,
  })),
];

/**
 * Status options - role-aware
 * Different roles see different status labels based on their workflow perspective
 */
export const getStatusOptions = (role: string) => {
  if (role === "DEPT_HEAD") {
    return [
      { value: "all", label: "All" },
      { value: "PENDING", label: "Pending" },
      { value: "FORWARDED", label: "Forwarded" },
      { value: "RETURNED", label: "Returned" },
      { value: "CANCELLED", label: "Cancelled" },
    ];
  }

  if (role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO") {
    return [
      { value: "all", label: "All" },
      { value: "PENDING", label: "Pending" },
      { value: "SUBMITTED", label: "Submitted" },
      { value: "APPROVED", label: "Approved" },
      { value: "FORWARDED", label: "Forwarded" },
      { value: "RETURNED", label: "Returned" },
      { value: "REJECTED", label: "Rejected" },
      { value: "CANCELLED", label: "Cancelled" },
    ];
  }

  // Default status options for employees
  return [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "RETURNED", label: "Returned" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
  ];
};

/**
 * Standard status options (non-role-aware)
 */
export const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "FORWARDED", label: "Forwarded" },
  { value: "RETURNED", label: "Returned" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

/**
 * Action labels for success messages
 */
export const ACTION_LABELS = {
  approve: "approved",
  reject: "rejected",
  return: "returned",
  forward: "forwarded",
  cancel: "cancelled",
} as const;

export type LeaveAction = keyof typeof ACTION_LABELS;
