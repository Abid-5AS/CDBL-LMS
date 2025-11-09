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
    <div className="rounded-lg border border-bg-muted backdrop-blur-xl bg-bg-primary/70 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Recent Leave History
      </h3>
      <div className="max-h-[250px] overflow-y-auto rounded-lg border border-border-strong dark:border-border-strong">
        <Table>
          <TableHeader className="bg-bg-secondary dark:bg-bg-secondary/50">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase text-text-secondary dark:text-text-secondary">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-text-secondary dark:text-text-secondary">
                Start
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-text-secondary dark:text-text-secondary">
                End
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-text-secondary dark:text-text-secondary">
                Days
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-text-secondary dark:text-text-secondary">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No leave records available.
                </TableCell>
              </TableRow>
            ) : (
              history.map((leave) => (
                <TableRow
                  key={leave.id}
                  className="hover:bg-bg-secondary dark:hover:bg-bg-secondary/50"
                >
                  <TableCell className="text-sm font-medium text-text-secondary dark:text-text-secondary">
                    {leave.type}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary dark:text-text-secondary">
                    {formatDate(leave.start)}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary dark:text-text-secondary">
                    {formatDate(leave.end)}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary dark:text-text-secondary">
                    {leave.days}
                  </TableCell>
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
