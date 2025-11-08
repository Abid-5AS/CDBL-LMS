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
      "bg-status-submitted/10 text-status-submitted border-status-submitted/20",
    icon: getIcon(leaveStatusIcons.SUBMITTED),
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-data-warning/15 text-data-warning border-data-warning/30",
    icon: getIcon(leaveStatusIcons.PENDING),
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-status-approved/10 text-status-approved border-status-approved/20",
    icon: getIcon(leaveStatusIcons.APPROVED),
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-status-rejected/10 text-status-rejected border-status-rejected/20",
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
      "bg-status-returned/10 text-status-returned border-status-returned/20",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip:
      "Returned to employee for modification. Please update and resubmit.",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    className:
      "bg-data-warning/15 text-data-warning border-data-warning/30",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip: "Cancellation request submitted and pending HR approval.",
  },
  RECALLED: {
    label: "Recalled",
    className:
      "bg-card-summary-soft text-card-summary border-card-summary-soft",
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
