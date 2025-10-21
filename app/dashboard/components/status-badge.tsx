import { Badge } from "@/components/ui/badge";

type Status = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
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
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_STYLES[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
