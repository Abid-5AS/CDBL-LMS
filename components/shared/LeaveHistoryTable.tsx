import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { LeaveHistoryEntry } from "@/lib/employee";

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
  return (
    <div className="neo-card rounded-2xl border border-[var(--shell-card-border)] bg-[var(--color-card-elevated)] p-6 shadow-[var(--shadow-1)]">
      <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        Recent Leave History
      </h3>
      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[var(--shell-card-border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-[var(--color-text-secondary)]"
                >
                  No leave records available.
                </TableCell>
              </TableRow>
            ) : (
              history.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="text-sm font-medium">
                    {leave.type}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(leave.start)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(leave.end)}
                  </TableCell>
                  <TableCell className="text-sm">{leave.days}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_VARIANTS[leave.status] ??
                        "bg-bg-secondary text-text-secondary"
                      }
                    >
                      {leave.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
