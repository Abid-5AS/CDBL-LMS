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
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled",
};

export function LeaveHistoryTable({ history }: LeaveHistoryTableProps) {
  return (
    <div className="rounded-lg border border-bg-muted backdrop-blur-xl bg-bg-primary/70 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Recent Leave History
      </h3>
      <div className="max-h-[250px] overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-700">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Start
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                End
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Days
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
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
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {leave.type}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(leave.start)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(leave.end)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                    {leave.days}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_VARIANTS[leave.status] ??
                        "bg-slate-100 text-slate-700"
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
