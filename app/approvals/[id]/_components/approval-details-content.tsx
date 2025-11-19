"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  AlertCircle,
  Calendar,
  FileText,
  User,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Forward,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveRequest, Approval, Balance, LeaveType } from "@prisma/client";
import { ApprovalActionCard } from "./approval-action-card";
import { EmployeeStatsCard } from "./employee-stats-card";
import { PolicyComplianceCheck } from "./policy-compliance-check";
import { TeamImpactCard } from "./team-impact-card";

type ApprovalDetailsContentProps = {
  leave: LeaveRequest & {
    requester: {
      id: number;
      name: string;
      email: string;
      role: string;
      department: string | null;
    };
    comments: any[];
    approvals: Array<
      Approval & {
        approver: {
          id: number;
          name: string | null;
          role: string;
        } | null;
      }
    >;
  };
  balances: Balance[];
  leaveHistory: Array<{
    id: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: LeaveStatus;
    createdAt: Date;
  }>;
  overlappingLeaves: Array<{
    id: number;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    status: LeaveStatus;
    requester: {
      name: string;
      email: string;
      department: string | null;
    };
  }>;
  comments: Array<{
    id: number;
    comment: string;
    authorRole: string;
    authorName: string;
    createdAt: string;
  }>;
  currentUserId: number;
  currentUserRole: string;
  canTakeAction: boolean;
};

export function ApprovalDetailsContent({
  leave,
  balances,
  leaveHistory,
  overlappingLeaves,
  comments,
  currentUserId,
  currentUserRole,
  canTakeAction,
}: ApprovalDetailsContentProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumbs */}
        <BreadcrumbList className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/approvals">Approvals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Approval Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Leave Approval Request
              </h1>
              <p className="text-muted-foreground mt-1">
                Request #{leave.id} from {leave.requester.name}
              </p>
            </div>
            <StatusBadge status={leave.status} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Left Column: Employee Context & Actions */}
          <div className="space-y-6">
            {/* Approval Actions Card - Most Prominent */}
            {canTakeAction && (
              <ApprovalActionCard
                leaveId={leave.id}
                leaveType={leave.type}
                currentUserRole={currentUserRole}
              />
            )}

            {/* Employee Stats Card */}
            <EmployeeStatsCard
              employee={leave.requester}
              balances={balances}
              leaveHistory={leaveHistory}
            />

            {/* Policy Compliance Check */}
            <PolicyComplianceCheck
              leaveType={leave.type}
              workingDays={leave.workingDays}
              startDate={leave.startDate}
              endDate={leave.endDate}
              balances={balances}
            />

            {/* Team Impact */}
            {overlappingLeaves.length > 0 && (
              <TeamImpactCard overlappingLeaves={overlappingLeaves} />
            )}
          </div>

          {/* Right Column: Request Details & History */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Request Details
                </CardTitle>
                <CardDescription>
                  Submitted on {formatDate(leave.createdAt.toISOString())}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Leave Type
                    </p>
                    <Badge variant="outline" className="text-base">
                      {leaveTypeLabel[leave.type] ?? leave.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Duration
                    </p>
                    <p className="text-base font-medium">
                      {leave.workingDays} working days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Start Date
                    </p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      End Date
                    </p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Reason
                  </p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {leave.reason}
                  </p>
                </div>

                {leave.certificateUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Medical Certificate
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={leave.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Certificate
                      </a>
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Employee
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {leave.requester.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {leave.requester.email}
                    </p>
                    <div className="flex items-center gap-2 ml-6">
                      <Badge variant="secondary" className="text-xs">
                        {leave.requester.role}
                      </Badge>
                      {leave.requester.department && (
                        <Badge variant="outline" className="text-xs">
                          {leave.requester.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Approval Timeline
                </CardTitle>
                <CardDescription>
                  {leave.approvals.filter((a) => a.decision !== "PENDING")
                    .length}{" "}
                  of {leave.approvals.length} steps completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leave.approvals.map((approval, index) => (
                    <div key={approval.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            approval.decision === "APPROVED"
                              ? "bg-green-100 dark:bg-green-950"
                              : approval.decision === "REJECTED"
                              ? "bg-red-100 dark:bg-red-950"
                              : approval.decision === "FORWARDED"
                              ? "bg-blue-100 dark:bg-blue-950"
                              : approval.decision === "RETURNED"
                              ? "bg-yellow-100 dark:bg-yellow-950"
                              : "bg-muted"
                          }`}
                        >
                          {approval.decision === "APPROVED" && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                          {approval.decision === "REJECTED" && (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          {approval.decision === "FORWARDED" && (
                            <Forward className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                          {approval.decision === "RETURNED" && (
                            <RotateCcw className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                          {approval.decision === "PENDING" && (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        {index < leave.approvals.length - 1 && (
                          <div className="w-0.5 h-8 bg-muted ml-5 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold">
                            Step {approval.step}: {approval.approver?.name || "Unassigned"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {approval.approver?.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {approval.decision === "APPROVED" &&
                            "✓ Approved"}
                          {approval.decision === "REJECTED" &&
                            "✗ Rejected"}
                          {approval.decision === "FORWARDED" &&
                            `→ Forwarded to ${approval.toRole || "Next Approver"}`}
                          {approval.decision === "RETURNED" &&
                            "⟲ Returned for modification"}
                          {approval.decision === "PENDING" && (
                            <span className="flex items-center gap-1">
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                              Pending review
                            </span>
                          )}
                        </p>
                        {approval.comment && (
                          <p className="text-sm text-foreground mt-2 bg-muted/50 rounded-md p-2 italic">
                            "{approval.comment}"
                          </p>
                        )}
                        {approval.decidedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(approval.decidedAt.toISOString())}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            {comments.length > 0 && (
              <Card className="rounded-2xl border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Discussion ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-l-2 border-muted pl-4 py-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">
                            {comment.authorName}{" "}
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {comment.authorRole}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-foreground">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
