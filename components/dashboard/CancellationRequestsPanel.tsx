"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { XCircle, AlertCircle } from "lucide-react";
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
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          Failed to load cancellation requests
        </CardContent>
      </Card>
    );
  }

  if (cancellationRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cancellation Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={XCircle}
            title="No cancellation requests"
            description="There are no pending cancellation requests awaiting HR review."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Cancellation Requests ({cancellationRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
        {cancellationRequests.length > 5 && (
          <div className="p-4 text-center border-t">
            <Button asChild variant="ghost" size="sm">
              <Link href="/approvals?status=CANCELLATION_REQUESTED">View all ({cancellationRequests.length})</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

