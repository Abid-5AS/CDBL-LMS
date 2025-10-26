"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "./status-badge";
import { leaveTypeLabel } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-red-600 py-8">
                  Failed to load
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No leave requests yet. Apply your first leave!
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{leaveTypeLabel[row.type] ?? row.type}</TableCell>
                  <TableCell>
                    {formatDate(row.startDate)} → {formatDate(row.endDate)}
                  </TableCell>
                  <TableCell>{row.workingDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{formatDate(row.updatedAt)}</TableCell>
                  <TableCell>
                    {CANCELABLE_STATUSES.has(row.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
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
