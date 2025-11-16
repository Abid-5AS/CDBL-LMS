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
import type { BadgeProps } from "@/components/ui/badge";
import clsx from "clsx";

type Status = LeaveStatus;

// Map leave status to Badge variant (uses centralized neo design)
const STATUS_CONFIG: Record<
  Status,
  {
    label: string;
    variant: BadgeProps["variant"];
    icon: ReturnType<typeof getIcon>;
    tooltip?: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    variant: "ghost",
    icon: getIcon(leaveStatusIcons.DRAFT),
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "info",
    icon: getIcon(leaveStatusIcons.SUBMITTED),
  },
  PENDING: {
    label: "Pending",
    variant: "warning",
    icon: getIcon(leaveStatusIcons.PENDING),
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
    icon: getIcon(leaveStatusIcons.APPROVED),
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: getIcon(leaveStatusIcons.REJECTED),
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    icon: getIcon(leaveStatusIcons.CANCELLED),
  },
  RETURNED: {
    label: "Returned",
    variant: "warning",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip:
      "Returned to employee for modification. Please update and resubmit.",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    variant: "warning",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip: "Cancellation request submitted and pending HR approval.",
  },
  RECALLED: {
    label: "Recalled",
    variant: "info",
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
      variant={config.variant}
      className={clsx("flex items-center gap-1.5 font-medium", className)}
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
