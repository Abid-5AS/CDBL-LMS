import {
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { LeaveHistoryEntry } from "@/lib/employee";
import { LeaveTable, ColumnDef } from "@/components/shared/LeaveTable";

type LeaveHistoryTableProps = {
  history: LeaveHistoryEntry[];
};

const STATUS_VARIANTS: Record<string, string> = {
  APPROVED: "bg-data-success/10 text-data-success border-data-success/20",
  PENDING: "bg-data-warning/10 text-data-warning border-data-warning/20",
  SUBMITTED: "bg-data-info/10 text-data-info border-data-info/20",
  REJECTED: "bg-data-error/10 text-data-error border-data-error/20",
  CANCELLED:
    "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
};

export function LeaveHistoryTable({ history }: LeaveHistoryTableProps) {
  const columns: ColumnDef<LeaveHistoryEntry>[] = [
    {
      header: "Type",
      accessorKey: "type",
      cell: (item) => <span className="text-sm font-medium">{item.type}</span>,
    },
    {
      header: "Start",
      accessorKey: "start",
      cell: (item) => <span className="text-sm">{formatDate(item.start)}</span>,
    },
    {
      header: "End",
      accessorKey: "end",
      cell: (item) => <span className="text-sm">{formatDate(item.end)}</span>,
    },
    {
      header: "Days",
      accessorKey: "days",
      cell: (item) => <span className="text-sm">{item.days}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => (
        <Badge
          className={
            STATUS_VARIANTS[item.status] ??
            "bg-bg-secondary text-text-secondary"
          }
        >
          {item.status.toLowerCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="neo-card rounded-2xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] p-6 shadow-[var(--shadow-1)]">
      <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        Recent Leave History
      </h3>
      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[var(--shell-card-border)]">
        <LeaveTable
          data={history}
          columns={columns}
          keyField="id"
          emptyState={
            <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              No leave records available.
            </div>
          }
        />
      </div>
    </div>
  );
}
