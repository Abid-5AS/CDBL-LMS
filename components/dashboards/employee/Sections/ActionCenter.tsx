"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Edit3, Send, Plus, X, ArrowLeft, FileX } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import useSWR from "swr";
import { LeaveStatus } from "@prisma/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

type LeaveStatusType =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"

type LeaveRow = {
  id: number;
  type: string;
  status: LeaveStatusType;
  workingDays?: number;
  endDate?: string;
  fitnessCertificateUrl?: string | null;
};

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

interface ActionCenterCardProps {
  leaves: LeaveRow[];
  isLoading: boolean;
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
  const returnApproval = Array.isArray(leave.approvals)
    ? leave.approvals
        .filter((a) => a.decision === "FORWARDED" && a.comment && a.decidedAt)
        .sort((a, b) => {
          const dateA = a.decidedAt ? new Date(a.decidedAt).getTime() : 0;
          const dateB = b.decidedAt ? new Date(b.decidedAt).getTime() : 0;
          return dateB - dateA;
        })[0]
    : null;

  const returnComment = returnApproval
    ? null
    : Array.isArray(leave.comments)
    ? leave.comments
        .filter((c) => c.authorRole !== "EMPLOYEE" && ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(c.authorRole))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const { data: commentsData, isLoading: commentsLoading } = useSWR<{ items?: LeaveComment[] }>(
    !returnApproval && !returnComment ? `/api/leaves/${leave.id}/comments` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const fetchedComments = Array.isArray(commentsData?.items) ? commentsData.items : [];
  const finalReturnComment = returnComment || 
    (fetchedComments.length > 0
      ? fetchedComments
          .filter((c) => c.authorRole !== "EMPLOYEE" && ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"].includes(c.authorRole))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null);

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

export function ActionCenterCard({ leaves, isLoading }: ActionCenterCardProps) {
  const router = useRouter();

  // Fetch returned leaves
  const { data: leavesData, isLoading: leavesLoading, mutate } = useSWR<{ items: ReturnedLeave[] }>(
    "/api/leaves?mine=1&status=RETURNED",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const returnedLeaves = Array.isArray(leavesData?.items) ? leavesData.items : [];

  // Quick actions logic (extracted from QuickActions component)
  const { hasPending, hasApprovedOwn, hasMedicalOver7Days, pendingId, approvedOwnId, medicalOver7Id } = useMemo(() => {
    const pending = leaves.find(
      (l) => l.status === "PENDING" || l.status === "SUBMITTED"
    );
    const approvedOwn = leaves.find((l) => l.status === "APPROVED");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const medicalOver7 = leaves.find((l) => {
      if (l.status !== "APPROVED" || l.type !== "MEDICAL" || (l.workingDays ?? 0) <= 7) {
        return false;
      }
      if (!l.endDate) return false;
      const endDate = new Date(l.endDate);
      endDate.setHours(0, 0, 0, 0);
      const hasEnded = endDate < today;
      const missingFitnessCert = !l.fitnessCertificateUrl;
      return hasEnded && missingFitnessCert;
    });

    return {
      hasPending: !!pending,
      hasApprovedOwn: !!approvedOwn,
      hasMedicalOver7Days: !!medicalOver7,
      pendingId: pending?.id,
      approvedOwnId: approvedOwn?.id,
      medicalOver7Id: medicalOver7?.id,
    };
  }, [leaves]);

  const isLoadingData = isLoading || leavesLoading;
  const hasReturnedRequests = returnedLeaves.length > 0;

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <CardTitle className="text-lg font-semibold">Action Center</CardTitle>
            {hasReturnedRequests && (
              <Badge variant="destructive" className="ml-2">
                {returnedLeaves.length}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => router.push("/leaves/apply")}
              size="sm"
              className="h-8 px-3 text-xs"
            >
              <Plus className="mr-1.5 size-3.5" />
              Apply Leave
            </Button>
            {hasPending && pendingId && (
              <Button
                onClick={() => router.push(`/leaves?id=${pendingId}`)}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <X className="mr-1.5 size-3.5" />
                Cancel Pending
              </Button>
            )}
            {hasMedicalOver7Days && medicalOver7Id && (
              <Button
                onClick={() => router.push(`/leaves?id=${medicalOver7Id}`)}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Return to Duty
              </Button>
            )}
            {hasApprovedOwn && approvedOwnId && (
              <Button
                onClick={() => router.push(`/leaves?id=${approvedOwnId}`)}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <FileX className="mr-1.5 size-3.5" />
                Request Cancellation
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingData ? (
          <Skeleton className="h-32 w-full" />
        ) : hasReturnedRequests ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-3 mb-3">
              <AlertCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No action required
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All your leave requests are up to date
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

