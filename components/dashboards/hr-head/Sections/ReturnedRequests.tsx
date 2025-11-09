"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  EmptyState,
} from "@/components/ui";
import { RotateCcw, FileEdit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

export function ReturnedRequestsPanel() {
  const { data, isLoading, error } = useSWR<{ items: LeaveRequest[] }>(
    "/api/leaves?status=RETURNED",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const returnedRequests: LeaveRequest[] = Array.isArray(data?.items)
    ? data.items
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-data-error">
          Failed to load returned requests
        </CardContent>
      </Card>
    );
  }

  if (returnedRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Returned for Modification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={FileEdit}
            title="No returned requests"
            description="There are no leave requests currently returned for modification."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-data-info" />
          Returned for Modification ({returnedRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table aria-label="Returned requests table">
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
            {returnedRequests.slice(0, 5).map((leave) => {
              if (!leave.requester) return null;
              return (
                <TableRow key={leave.id}>
                  <TableCell>
                    <Link
                      href={`/employees/${leave.requester.id}`}
                      className="text-data-info hover:underline font-medium"
                    >
                      {leave.requester.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {leave.requester.email}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {leaveTypeLabel[leave.type] ?? leave.type}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-text-secondary">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-text-secondary">
                    {leave.workingDays}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={leave.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/leaves?highlight=${leave.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {returnedRequests.length > 5 && (
          <div className="p-4 text-center border-t">
            <Link href="/approvals?status=RETURNED">
              <Button variant="ghost" size="sm">
                View all ({returnedRequests.length})
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
