"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Edit, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import useSWR from "swr";
import { LeaveStatus } from "@prisma/client";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ReturnedLeave = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  updatedAt: string;
};

type ReturnComment = {
  id: number;
  comment: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
};

export function ReturnedRequestsSection() {
  const { data: leavesData, isLoading: leavesLoading, mutate } = useSWR<{ items: ReturnedLeave[] }>(
    "/api/leaves?mine=1&status=RETURNED",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const returnedLeaves = Array.isArray(leavesData?.items) ? leavesData.items : [];

  if (leavesLoading) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (returnedLeaves.length === 0) {
    return null; // Don't show section if no returned requests
  }

  return (
    <Card className="rounded-2xl border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Action Required: Returned Requests
        </CardTitle>
        <CardDescription>
          {returnedLeaves.length} request{returnedLeaves.length !== 1 ? "s" : ""} need{returnedLeaves.length === 1 ? "s" : ""} your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="hidden md:table-cell">Days</TableHead>
                <TableHead>Returned By</TableHead>
                <TableHead className="hidden lg:table-cell">Comment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnedLeaves.map((leave) => (
                <ReturnedRequestRow key={leave.id} leave={leave} onResubmit={mutate} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReturnedRequestRow({ leave, onResubmit }: { leave: ReturnedLeave; onResubmit: () => void }) {
  const { data: commentsData } = useSWR<{ items?: ReturnComment[]; comments?: ReturnComment[] }>(
    `/api/leaves/${leave.id}/comments`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const comments = Array.isArray(commentsData?.items) 
    ? commentsData.items 
    : Array.isArray(commentsData?.comments) 
    ? commentsData.comments 
    : [];
  // Get the most recent non-employee comment (the return comment)
  const returnComment = comments
    .filter((c) => c.authorRole !== "EMPLOYEE")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || comments[0];

  return (
    <TableRow className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10">
      <TableCell>
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          {leaveTypeLabel[leave.type] ?? leave.type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</div>
          <div className="text-xs text-muted-foreground md:hidden">{leave.workingDays} days</div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{leave.workingDays}</TableCell>
      <TableCell>
        {returnComment ? (
          <div className="text-sm">
            <div className="font-medium">{returnComment.authorName}</div>
            <div className="text-xs text-muted-foreground">{returnComment.authorRole}</div>
            <div className="text-xs text-muted-foreground">{formatDate(returnComment.createdAt)}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell max-w-xs">
        {returnComment ? (
          <div className="text-sm text-muted-foreground line-clamp-2" title={returnComment.comment}>
            {returnComment.comment}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link href={`/leaves/${leave.id}`}>
              <Edit className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
          <Button asChild size="sm" variant="default" className="h-7 text-xs">
            <Link href={`/leaves/${leave.id}/edit`}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Edit & Resubmit
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

