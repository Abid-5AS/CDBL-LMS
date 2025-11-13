"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ModernTable,
  Button,
  EmptyState,
} from "@/components/ui";
import { RotateCcw, FileEdit } from "lucide-react";
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
            action={{
              label: "View All Requests",
              href: "/approvals",
            }}
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
        <ModernTable>
            <ModernTable.Row>
              <ModernTable.Header>Employee</ModernTable.Header>
              <ModernTable.Header>Type</ModernTable.Header>
              <ModernTable.Header className="hidden sm:table-cell">Dates</ModernTable.Header>
              <ModernTable.Header className="hidden md:table-cell">Days</ModernTable.Header>
              <ModernTable.Header>Status</ModernTable.Header>
              <ModernTable.Header className="text-right">Actions</ModernTable.Header>
            </ModernTable.Row>
          <ModernTable.Body>
            {returnedRequests.slice(0, 5).map((leave) => {
              if (!leave.requester) return null;
              return (
                <ModernTable.Row key={leave.id}>
                  <ModernTable.Cell>
                    <Link
                      href={`/employees/${leave.requester.id}`}
                      className="text-data-info hover:underline font-medium"
                    >
                      {leave.requester.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {leave.requester.email}
                    </div>
                  </ModernTable.Cell>
                  <ModernTable.Cell className="font-medium">
                    {leaveTypeLabel[leave.type] ?? leave.type}
                  </ModernTable.Cell>
                  <ModernTable.Cell className="hidden sm:table-cell text-text-secondary">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </ModernTable.Cell>
                  <ModernTable.Cell className="hidden md:table-cell text-text-secondary">
                    {leave.workingDays}
                  </ModernTable.Cell>
                  <ModernTable.Cell>
                    <StatusBadge status={leave.status as any} />
                  </ModernTable.Cell>
                  <ModernTable.Cell className="text-right">
                    <Link href={`/leaves?highlight=${leave.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </ModernTable.Cell>
                </ModernTable.Row>
              );
            })}
          </ModernTable.Body>
        </ModernTable>
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
