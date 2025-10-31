import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No pending leave requests</p>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  {formatDate(leave.startDate.toISOString())} → {formatDate(leave.endDate.toISOString())}
                </TableCell>
                <TableCell>{leave.workingDays}</TableCell>
                <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                <TableCell>
                  <StatusBadge status={leave.status} />
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
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

