"use client";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  Button,
} from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, FileEdit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui/ui";
import Link from "next/link";
import { StatusBadge, EmptyState } from "@/components/shared";
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


export function ReturnedRequestsPanel() {
  const { data, isLoading, error } = useSWR<{ items: LeaveRequest[] }>(
    "/api/leaves?status=RETURNED",
    apiFetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const returnedRequests: LeaveRequest[] = Array.isArray(data?.items)
    ? data.items
    : [];

  if (isLoading) {
    return (
      <GlassCard variant="hover">
        <GlassCardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard variant="hover">
        <GlassCardContent className="py-12 text-center text-sm text-danger dark:text-danger/90">
          Failed to load returned requests
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (returnedRequests.length === 0) {
    return (
      <GlassCard variant="hover">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Returned for Modification
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <EmptyState
            icon={FileEdit}
            title="No returned requests"
            description="There are no leave requests currently returned for modification."
            action={{
              label: "View All Requests",
              href: "/approvals",
            }}
          />
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="hover">
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-info dark:text-info/90" />
          Returned for Modification ({returnedRequests.length})
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="p-0">
        <Table>
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
                      className="text-info dark:text-info/90 hover:underline font-medium"
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
                  <TableCell className="hidden sm:table-cell text-muted-foreground dark:text-muted-foreground/80">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground dark:text-muted-foreground/80">
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
      </GlassCardContent>
    </GlassCard>
  );
}
