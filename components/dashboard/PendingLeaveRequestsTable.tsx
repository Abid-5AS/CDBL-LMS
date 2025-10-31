import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import StatusBadge from "@/app/dashboard/components/status-badge";

export async function PendingLeaveRequestsTable() {
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: {
        in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
      },
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (leaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={ClipboardCheck}
            title="No pending requests"
            description="All leave requests have been processed. Check back later for new submissions."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table aria-label="Pending leave requests table">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
              <TableHead className="hidden md:table-cell">Days</TableHead>
              <TableHead className="hidden lg:table-cell">Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
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
                <TableCell>{leaveTypeLabel[leave.type] ?? leave.type}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="sr-only">Dates: </span>
                  {formatDate(leave.startDate.toISOString())} → {formatDate(leave.endDate.toISOString())}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="sr-only">Working days: </span>
                  {leave.workingDays}
                </TableCell>
                <TableCell className="hidden lg:table-cell max-w-xs truncate">
                  <span className="sr-only">Reason: </span>
                  {leave.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={leave.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" aria-label={`Review leave request from ${leave.requester.name}`}>
                    <Link href={`/approvals?leave=${leave.id}`}>Review</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

