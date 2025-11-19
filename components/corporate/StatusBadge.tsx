"use client";

import { cn } from "@/lib/utils";
import type { DensityMode } from "@/lib/ui/density-modes";
import { statusBadgeClass } from "@/lib/ui/density-modes";
import type { LeaveStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: LeaveStatus;
  density?: DensityMode;
  className?: string;
}

/**
 * Corporate Status Badge
 * Displays leave request status with semantic colors
 *
 * Design: Solid background with colored text and border
 * No gradients, simple pill shape
 */
export function StatusBadge({
  status,
  density = "comfortable",
  className,
}: StatusBadgeProps) {
  const statusLabels: Record<LeaveStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
    CANCELLATION_REQUESTED: "Cancellation Requested",
    RECALLED: "Recalled",
  };

  return (
    <span className={cn(statusBadgeClass(status, density), className)}>
      {statusLabels[status] || status}
    </span>
  );
}
