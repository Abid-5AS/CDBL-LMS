"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, Plus } from "lucide-react";
import StatusBadge from "./status-badge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const CANCELABLE_STATUSES = new Set<LeaveRow["status"]>(["SUBMITTED", "PENDING"]);

export function RequestsTable() {
  const { data, isLoading, error, mutate } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  const rows: LeaveRow[] = Array.isArray(data?.items) ? data.items : [];

  const cancelRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error("Couldn't cancel request", {
          description: body?.error ?? "Please try again.",
        });
        return;
      }
      toast.success("Request cancelled");
      mutate();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't cancel request", {
        description: "Network error. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table aria-label="My leave requests table">
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
              <TableHead className="hidden md:table-cell">Working Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8" aria-live="polite">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-red-600 py-8" role="alert">
                  Failed to load
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={ClipboardCheck}
                    title="No leave requests yet"
                    description="Start by applying for your first leave request."
                    action={{
                      label: "Apply Leave",
                      onClick: () => window.location.href = "/leaves/apply",
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{leaveTypeLabel[row.type] ?? row.type}</TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-600">
                    <span className="sr-only">Dates: </span>
                    {formatDate(row.startDate)} → {formatDate(row.endDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">{row.workingDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600">{formatDate(row.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    {CANCELABLE_STATUSES.has(row.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" aria-label={`Cancel leave request from ${formatDate(row.startDate)} to ${formatDate(row.endDate)}`}>
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark the request as cancelled. Approvers will no longer see it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelRequest(row.id)}>
                              Cancel Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
