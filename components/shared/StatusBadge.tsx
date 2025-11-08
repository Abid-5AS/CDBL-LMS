"use client";

import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { getIcon, leaveStatusIcons, iconSizes } from "@/lib/icons";
import type { LeaveStatus } from "@/lib/workflow";
import clsx from "clsx";

type Status = LeaveStatus;

const STATUS_CONFIG: Record<
  Status,
  {
    label: string;
    className: string;
    icon: ReturnType<typeof getIcon>;
    tooltip?: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-status-draft/10 text-status-draft border-status-draft/20",
    icon: getIcon(leaveStatusIcons.DRAFT),
  },
  SUBMITTED: {
    label: "Submitted",
    className:
      "bg-status-submitted text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800",
    icon: getIcon(leaveStatusIcons.SUBMITTED),
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800",
    icon: getIcon(leaveStatusIcons.PENDING),
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-status-approved text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800",
    icon: getIcon(leaveStatusIcons.APPROVED),
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-status-rejected text-red-700 border-red-200 dark:text-red-300 dark:border-red-800",
    icon: getIcon(leaveStatusIcons.REJECTED),
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
    icon: getIcon(leaveStatusIcons.CANCELLED),
  },
  RETURNED: {
    label: "Returned",
    className:
      "bg-status-returned text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip:
      "Returned to employee for modification. Please update and resubmit.",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    className:
      "bg-orange-50/80 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip: "Cancellation request submitted and pending HR approval.",
  },
  RECALLED: {
    label: "Recalled",
    className:
      "bg-purple-50/80 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip: "Employee recalled from leave by HR. Remaining balance restored.",
  },
};

type StatusBadgeProps = {
  status: Status;
  className?: string;
  showTooltip?: boolean;
};

/**
 * Unified Status Badge Component
 * Consolidates app/dashboard/components/status-badge.tsx and components/dashboard/StatusBadgeSimple.tsx
 * Supports all LeaveStatus values with consistent styling and tooltips
 */
export function StatusBadge({
  status,
  className,
  showTooltip = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={clsx(
        "flex items-center gap-1.5 font-medium border px-2.5 py-0.5",
        config.className,
        className
      )}
    >
      <Icon
        className="h-3.5 w-3.5"
        size={iconSizes.sm}
        strokeWidth={2.5}
        aria-hidden
      />
      {config.label}
    </Badge>
  );

  if (showTooltip && config.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

// Export default for backward compatibility
export default StatusBadge;
