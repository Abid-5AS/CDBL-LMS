"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import StatusBadge from "@/app/dashboard/components/status-badge";
import useSWR from "swr";

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: string;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CancellationRequestsPanel() {
  const { data, isLoading, error } = useSWR<{ items: LeaveRequest[] }>(
    "/api/leaves?status=CANCELLATION_REQUESTED",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const cancellationRequests: LeaveRequest[] = Array.isArray(data?.items) ? data.items : [];

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-sm text-red-600">
        Failed to load cancellation requests
      </div>
    );
  }

  if (cancellationRequests.length === 0) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Cancellation Requests</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No cancellation requests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold">Cancellation Requests</h3>
        </div>
      </div>
      <div className="px-6 pb-6">
        <Table aria-label="Cancellation requests table">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
              <TableHead className="hidden md:table-cell">Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cancellationRequests.slice(0, 5).map((leave) => {
              if (!leave.requester) return null;
              return (
                <TableRow key={leave.id}>
                  <TableCell>
                    <Link
                      href={`/employees/${leave.requester.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {leave.requester.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{leave.requester.email}</div>
                  </TableCell>
                  <TableCell className="font-medium">{leaveTypeLabel[leave.type] ?? leave.type}</TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-600">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">{leave.workingDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={leave.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/approvals?leave=${leave.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

