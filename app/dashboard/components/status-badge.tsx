import { Badge } from "@/components/ui/badge";

type Status = "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-900 hover:bg-blue-100",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-900 hover:bg-yellow-100",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-900 hover:bg-red-100",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return <Badge className={config.className}>{config.label}</Badge>;
}
