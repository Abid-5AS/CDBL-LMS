import { Badge } from "@/components/ui/badge";
import { LeaveStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getIcon, iconSizes, leaveStatusIcons } from "@/lib/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    className:
      "bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    icon: getIcon(leaveStatusIcons.DRAFT),
  },
  SUBMITTED: {
    label: "Submitted",
    className:
      "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
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
      "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    icon: getIcon(leaveStatusIcons.APPROVED),
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-red-50/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: getIcon(leaveStatusIcons.REJECTED),
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-slate-100/70 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
    icon: getIcon(leaveStatusIcons.CANCELLED),
  },
  RETURNED: {
    label: "Returned",
    className:
      "bg-yellow-50/80 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800",
    icon: getIcon(leaveStatusIcons.PENDING), // Use pending icon as fallback
    tooltip: "Returned to employee for modification. Please update and resubmit.",
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

export default function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  
  const badge = (
    <Badge 
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 font-medium border px-2.5 py-0.5",
        config.className,
        className
      )}
    >
      <Icon className="h-[14px] w-[14px]" size={iconSizes.sm} strokeWidth={2.5} aria-hidden />
      {config.label}
    </Badge>
  );

  if (config.tooltip) {
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
