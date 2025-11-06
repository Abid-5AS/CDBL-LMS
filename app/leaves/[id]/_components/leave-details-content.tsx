"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle, RotateCcw, Edit, Calendar, FileText, User, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveRequest, LeaveComment, Approval } from "@prisma/client";

type LeaveDetailsContentProps = {
  leave: LeaveRequest & {
    requester: {
      id: number;
      name: string;
      email: string;
    };
    comments: LeaveComment[];
    approvals: Array<Approval & {
      approver: {
        name: string | null;
        role: string;
      };
    }>;
  };
  comments: Array<{
    id: number;
    comment: string;
    authorRole: string;
    authorName: string;
    createdAt: string;
  }>;
  currentUserId: number;
};

export function LeaveDetailsContent({ leave, comments, currentUserId }: LeaveDetailsContentProps) {
  const isRequester = leave.requesterId === currentUserId;
  const isReturned = leave.status === "RETURNED";
  
  // Get the most recent return comment (non-employee comment)
  const returnComment = comments
    .filter((c) => c.authorRole !== "EMPLOYEE")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/leaves/my">My Leaves</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leave Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Returned Banner */}
        {isReturned && returnComment && (
          <Card className="mb-6 rounded-2xl border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
                    <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                      Request Returned for Modification
                    </h3>
                    {isRequester && (
                      <Button asChild size="sm" variant="default">
                        <Link href={`/leaves/${leave.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit & Resubmit
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg bg-white dark:bg-card border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                      Returned by {returnComment.authorName} ({returnComment.authorRole})
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      {returnComment.comment}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      On {formatDate(returnComment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left Column: Leave Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leave Request Details</span>
                  <StatusBadge status={leave.status} />
                </CardTitle>
                <CardDescription>Request #{leave.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Leave Type</p>
                    <Badge variant="outline" className="text-base">
                      {leaveTypeLabel[leave.type] ?? leave.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                    <p className="text-base font-medium">{leave.workingDays} working days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">End Date</p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {leave.reason}
                  </p>
                </div>

                {leave.certificateUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Certificate</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={leave.certificateUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Certificate
                      </a>
                    </Button>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Employee</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{leave.requester.name}</span>
                    <span className="text-xs text-muted-foreground">({leave.requester.email})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            {leave.approvals.length > 0 && (
              <Card className="rounded-2xl border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Approval Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leave.approvals.map((approval, index) => (
                      <div key={approval.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            approval.decision === "APPROVED" ? "bg-green-500" :
                            approval.decision === "REJECTED" ? "bg-red-500" :
                            approval.decision === "FORWARDED" ? "bg-blue-500" :
                            "bg-gray-400"
                          }`} />
                          {index < leave.approvals.length - 1 && (
                            <div className="w-0.5 h-8 bg-muted ml-1" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Step {approval.step}: {approval.approver?.name || "Unknown"} ({approval.approver?.role})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {approval.decision === "APPROVED" && "✓ Approved"}
                            {approval.decision === "REJECTED" && "✗ Rejected"}
                            {approval.decision === "FORWARDED" && `→ Forwarded to ${approval.toRole || "Next Approver"}`}
                            {approval.decision === "PENDING" && "⏳ Pending"}
                          </p>
                          {approval.comment && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{approval.comment}"
                            </p>
                          )}
                          {approval.decidedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(approval.decidedAt.toISOString())}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            {comments.length > 0 && (
              <Card className="rounded-2xl border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">
                            {comment.authorName} ({comment.authorRole})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Actions & Metadata */}
          <div className="space-y-6">
            {/* Actions Card */}
            {isRequester && isReturned && (
              <Card className="rounded-2xl border-muted shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/leaves/${leave.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit & Resubmit
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Make necessary changes and resubmit your request for approval.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Metadata Card */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle>Request Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(leave.createdAt.toISOString())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(leave.updatedAt.toISOString())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Policy Version</p>
                  <p className="font-medium">{leave.policyVersion}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}




