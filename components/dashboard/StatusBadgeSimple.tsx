"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Hourglass,
  Check,
  Ban,
  Archive,
  RefreshCcw,
  BadgeAlert,
  AlertOctagon,
  CircleHelp,
} from "lucide-react";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"
  | "OVERSTAY_PENDING";

/**
 * A badge component to display the leave status with appropriate colors and icons.
 * This is aware of all the new v2.0 policy statuses.
 */
export function StatusBadgeSimple({ status }: { status: LeaveStatus }) {
  const statusConfig = useMemo(() => {
    switch (status) {
      case "SUBMITTED":
      case "PENDING":
        return {
          label: "Pending",
          icon: Hourglass,
          className: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
        };
      case "APPROVED":
        return {
          label: "Approved",
          icon: Check,
          className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          icon: Ban,
          className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          icon: Archive,
          className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        };
      case "RETURNED":
        return {
          label: "Returned",
          icon: RefreshCcw,
          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300",
        };
      case "CANCELLATION_REQUESTED":
        return {
          label: "Cancelling",
          icon: Archive,
          className: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
        };
      case "RECALLED":
        return {
          label: "Recalled",
          icon: BadgeAlert,
          className: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
        };
      case "OVERSTAY_PENDING":
        return {
          label: "Overstay",
          icon: AlertOctagon,
          className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 font-bold",
        };
      default:
        return {
          label: "Unknown",
          icon: CircleHelp,
          className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        };
    }
  }, [status]);

  const Icon = statusConfig.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusConfig.className
      )}
    >
      <Icon className="size-3.5" />
      <span>{statusConfig.label}</span>
    </div>
  );
}

