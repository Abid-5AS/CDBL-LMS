"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Edit3, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import useSWR from "swr";
import { LeaveStatus } from "@prisma/client";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Approval = {
  step: number;
  decision: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED";
  comment: string | null;
  decidedAt: string | null;
  approver?: {
    name: string | null;
    role?: string | null;
  } | null;
};

type LeaveComment = {
  id: number;
  comment: string;
  authorRole: string;
  authorId: number;
  authorName?: string;
  createdAt: string;
};

type ReturnedLeave = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  updatedAt: string;
  approvals?: Approval[];
  comments?: LeaveComment[];
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
    <Card className="bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/70 rounded-xl shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          Action Required: Returned Requests
        </CardTitle>
        <CardDescription>
          {returnedLeaves.length} request{returnedLeaves.length !== 1 ? "s" : ""} need{returnedLeaves.length === 1 ? "s" : ""} your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b border-neutral-200/70 dark:border-neutral-800/70">
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</TableHead>
                <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Dates</TableHead>
                <TableHead className="hidden md:table-cell text-xs font-medium text-neutral-700 dark:text-neutral-300">Days</TableHead>
                <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Returned By</TableHead>
                <TableHead className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Comment</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-medium text-neutral-700 dark:text-neutral-300">Updated</TableHead>
                <TableHead className="text-right text-xs font-medium text-neutral-700 dark:text-neutral-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnedLeaves.map((leave, index) => (
                <ReturnedRequestRow 
                  key={leave.id} 
                  leave={leave} 
                  onResubmit={mutate}
                  index={index}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReturnedRequestRow({ 
  leave, 
  onResubmit, 
  index 
}: { 
  leave: ReturnedLeave; 
  onResubmit: () => void;
  index: number;
}) {
  // Extract return information from approvals or comments already in the leave data
  // When a leave is returned, an approval is created with decision="FORWARDED" and toRole=null
  // Also a LeaveComment is created with the return reason
  
  // Try to get return info from approvals first (most reliable)
  const returnApproval = Array.isArray(leave.approvals)
    ? leave.approvals
        .filter((a) => a.decision === "FORWARDED" && a.comment && a.decidedAt)
        .sort((a, b) => {
          const dateA = a.decidedAt ? new Date(a.decidedAt).getTime() : 0;
          const dateB = b.decidedAt ? new Date(b.decidedAt).getTime() : 0;
          return dateB - dateA;
        })[0]
    : null;

  // Fallback to comments if no approval found
  const returnComment = returnApproval
    ? null // Use approval data
    : Array.isArray(leave.comments)
    ? leave.comments
        .filter((c) => c.authorRole !== "EMPLOYEE" && ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(c.authorRole))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // If we still don't have data, fetch it separately (fallback)
  const { data: commentsData, isLoading: commentsLoading } = useSWR<{ items?: LeaveComment[] }>(
    !returnApproval && !returnComment ? `/api/leaves/${leave.id}/comments` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Final fallback: use fetched comments if available
  const fetchedComments = Array.isArray(commentsData?.items) ? commentsData.items : [];
  const finalReturnComment = returnComment || 
    (fetchedComments.length > 0
      ? fetchedComments
          .filter((c) => c.authorRole !== "EMPLOYEE" && ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(c.authorRole))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null);

  // Determine return info - prefer approval data, then comment data
  const returnInfo = returnApproval
    ? {
        authorName: returnApproval.approver?.name || "Unknown",
        authorRole: returnApproval.approver?.role || "Approver",
        comment: returnApproval.comment || "",
        createdAt: returnApproval.decidedAt || "",
      }
    : finalReturnComment
    ? {
        authorName: finalReturnComment.authorName || "Unknown",
        authorRole: finalReturnComment.authorRole,
        comment: finalReturnComment.comment,
        createdAt: finalReturnComment.createdAt,
      }
    : null;

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = returnInfo ? getInitials(returnInfo.authorName) : "?";

  return (
    <TableRow 
      className={cn(
        "hover:bg-muted/40 transition-colors",
        index % 2 === 0 && "bg-white dark:bg-neutral-900/50"
      )}
    >
      <TableCell className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
        {leaveTypeLabel[leave.type] ?? leave.type}
      </TableCell>
      <TableCell className="text-sm text-gray-600 dark:text-slate-300">
        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-slate-300">
        {leave.workingDays}
      </TableCell>
      <TableCell>
        {commentsLoading && !returnInfo ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : returnInfo ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {returnInfo.authorName}
              </div>
              <div className="text-xs text-muted-foreground">{returnInfo.authorRole}</div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-[160px]">
        {commentsLoading && !returnInfo ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : returnInfo?.comment ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground truncate cursor-help">
                {returnInfo.comment}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{returnInfo.comment}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">
        {formatDate(leave.updatedAt)}
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <Button 
            asChild
            variant="outline" 
            size="sm" 
            className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
          >
            <Link href={`/leaves/${leave.id}/edit`}>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button 
            asChild
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Link href={`/leaves/${leave.id}/edit`}>
              <Send className="w-4 h-4 mr-1" />
              Resubmit
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

