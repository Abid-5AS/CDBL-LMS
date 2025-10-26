import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/SectionHeader";
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
  CANCELLED: "bg-slate-200 text-slate-700",
};

export function LeaveHistoryTable({ history }: LeaveHistoryTableProps) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Recent Leave History" />
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Type</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Start</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">End</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Days</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No leave records available.
                </TableCell>
              </TableRow>
            ) : (
              history.map((leave) => (
                <TableRow key={leave.id} className="hover:bg-slate-50">
                  <TableCell className="text-sm font-medium text-slate-900">{leave.type}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(leave.start)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(leave.end)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{leave.days}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_VARIANTS[leave.status] ?? "bg-slate-100 text-slate-700"}>
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
