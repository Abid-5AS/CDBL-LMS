"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

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

export function CancellationRequestsPanel() {
  const { data, isLoading, error } = useSWR<{ items: LeaveRequest[] }>(
    "/api/leaves?status=CANCELLATION_REQUESTED&limit=10",
    apiFetcher,
    {
      revalidateOnFocus: false, // Prevent unnecessary refetches
      dedupingInterval: 30000, // Cache results for 30 seconds
    }
  );

  const cancellationRequests: LeaveRequest[] = Array.isArray(data?.items)
    ? data.items
    : [];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center text-sm text-data-error flex flex-col items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>Failed to load cancellation requests</p>
        <p className="text-xs text-muted-foreground">{(error as any)?.info?.details || (error as any)?.message || String(error)}</p>
      </div>
    );
  }

  if (cancellationRequests.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={XCircle}
          title="No cancellation requests"
          description="There are currently no pending cancellation requests to review."
          variant="minimal"
          action={{
            label: "View All Requests",
            href: "/approvals",
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <Table aria-label="Cancellation requests table">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="text-muted-foreground font-medium">Employee</TableHead>
            <TableHead className="text-muted-foreground font-medium">Type</TableHead>
            <TableHead className="hidden sm:table-cell text-muted-foreground font-medium">Dates</TableHead>
            <TableHead className="hidden md:table-cell text-muted-foreground font-medium">Days</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cancellationRequests.slice(0, 5).map((leave) => {
            if (!leave.requester) return null;
            return (
              <TableRow key={leave.id} className="hover:bg-muted/30 border-border/50 transition-colors">
                <TableCell>
                  <Link
                    href={`/employees/${leave.requester.id}`}
                    className="text-foreground hover:text-primary hover:underline font-medium transition-colors"
                  >
                    {leave.requester.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {leave.requester.email}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {leaveTypeLabel[leave.type] ?? leave.type}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {leave.workingDays}
                </TableCell>
                <TableCell>
                  <StatusBadge status={leave.status as any} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" className="h-8 border-border/50 hover:bg-muted hover:text-foreground">
                    <Link href={`/approvals/${leave.id}?source=cancellation`}>Review</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
