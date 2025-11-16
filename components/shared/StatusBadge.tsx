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

// Professional Neo + Glassmorphism Status Configuration
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
    className: "bg-gradient-to-br from-gray-400/90 to-gray-500/70 text-white shadow-md shadow-gray-400/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.DRAFT),
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-gradient-to-br from-blue-500/90 to-blue-600/70 text-white shadow-md shadow-blue-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.SUBMITTED),
  },
  PENDING: {
    label: "Pending",
    className: "bg-gradient-to-br from-amber-500/90 to-amber-600/70 text-white shadow-md shadow-amber-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.PENDING),
  },
  APPROVED: {
    label: "Approved",
    className: "bg-gradient-to-br from-emerald-500/90 to-emerald-600/70 text-white shadow-md shadow-emerald-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.APPROVED),
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-gradient-to-br from-red-500/90 to-red-600/70 text-white shadow-md shadow-red-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.REJECTED),
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gradient-to-br from-slate-500/90 to-slate-600/70 text-white shadow-md shadow-slate-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.CANCELLED),
  },
  RETURNED: {
    label: "Returned",
    className: "bg-gradient-to-br from-orange-500/90 to-orange-600/70 text-white shadow-md shadow-orange-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip:
      "Returned to employee for modification. Please update and resubmit.",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    className: "bg-gradient-to-br from-amber-500/90 to-amber-600/70 text-white shadow-md shadow-amber-500/30 backdrop-blur-sm border border-white/20",
    icon: getIcon(leaveStatusIcons.PENDING),
    tooltip: "Cancellation request submitted and pending HR approval.",
  },
  RECALLED: {
    label: "Recalled",
    className: "bg-gradient-to-br from-purple-500/90 to-purple-600/70 text-white shadow-md shadow-purple-500/30 backdrop-blur-sm border border-white/20",
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
