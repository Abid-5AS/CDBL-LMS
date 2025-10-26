"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { HRApprovalItem } from "./types";

type EmployeeDetailModalProps = {
  open: boolean;
  item: HRApprovalItem | null;
  onOpenChange: (open: boolean) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  loading?: boolean;
};

const fallbackBalances = [
  { label: "Earned Leave", value: 18 },
  { label: "Casual Leave", value: 6 },
  { label: "Medical Leave", value: 10 },
];

const fallbackHistory = [
  { id: "H-1023", type: "Earned Leave", days: 5, status: "approved" },
  { id: "H-1018", type: "Casual Leave", days: 2, status: "approved" },
  { id: "H-1004", type: "Medical Leave", days: 3, status: "rejected" },
  { id: "H-998", type: "Earned Leave", days: 4, status: "approved" },
  { id: "H-990", type: "Casual Leave", days: 1, status: "approved" },
];

function statusTone(status: string | undefined) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "REJECTED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export function EmployeeDetailModal({
  open,
  item,
  onOpenChange,
  onApprove,
  onReject,
  loading,
}: EmployeeDetailModalProps) {
  const stage = item?.approvals?.[item.currentStageIndex]?.status ?? "Pending";

  const balances = fallbackBalances;
  const history = fallbackHistory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Employee Profile &amp; Leave Summary</DialogTitle>
        </DialogHeader>

        {!item ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Select a request to view full details.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Employee</h3>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {item.requestedByName ?? "Unknown employee"}
                </p>
                <p className="text-sm text-muted-foreground">{item.requestedByEmail ?? "—"}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Department</h3>
                <p className="mt-1 text-sm font-medium text-slate-900">Operations &amp; Admin</p>
                <p className="text-sm text-muted-foreground">Reporting Manager: Rahman, IT</p>
              </div>
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Designation</h3>
                <p className="mt-1 text-sm font-medium text-slate-900">Senior Officer</p>
                <p className="text-sm text-muted-foreground">Employee ID: {item.requestedById ?? "CDBL-1024"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xs uppercase text-muted-foreground">Current Stage</h3>
                <Badge className={statusTone(stage)}>{stage}</Badge>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4 sm:items-center">
              <div className="sm:col-span-2">
                <h3 className="text-xs uppercase text-muted-foreground">Leave Type</h3>
                <p className="mt-1 text-base font-semibold text-slate-900">{item.type}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Duration</h3>
                <p className="mt-1 text-sm text-slate-900">
                  {formatDate(item.start)} → {formatDate(item.end)}
                </p>
                <p className="text-xs text-muted-foreground">{item.requestedDays} calendar days</p>
              </div>
              <div>
                <h3 className="text-xs uppercase text-muted-foreground">Reason</h3>
                <p className="mt-1 text-sm text-slate-900">{item.reason}</p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Current Leave Balances</h3>
                <p className="text-xs text-muted-foreground">As per latest HR sync</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {balances.map((balance) => (
                  <Card key={balance.label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground uppercase">{balance.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-slate-900">{balance.value} days</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent History</h3>
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{entry.type}</p>
                      <p className="text-xs text-muted-foreground">{entry.days} day(s) • Ref: {entry.id}</p>
                    </div>
                    <Badge className={statusTone(entry.status)}>{entry.status}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onReject} disabled={loading || !item}>
              {loading ? "Processing..." : "Reject"}
            </Button>
            <Button onClick={onApprove} disabled={loading || !item}>
              {loading ? "Processing..." : "Approve"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
