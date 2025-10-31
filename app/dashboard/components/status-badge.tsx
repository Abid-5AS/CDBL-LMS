import { Badge } from "@/components/ui/badge";
import { LeaveStatus } from "@prisma/client";
import { CheckCircle2, Clock, XCircle, FileText, Ban, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = LeaveStatus;

const STATUS_CONFIG: Record<Status, { 
  label: string; 
  className: string;
  icon: typeof CheckCircle2;
}> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: FileText,
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Circle,
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Ban,
  },
};

export default function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 font-medium border px-2.5 py-0.5",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
