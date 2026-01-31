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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import { leaveTypeLabel } from "@/lib/ui/ui";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LeaveRequest, Approval, Balance } from "@/src/generated/prisma/client";
import { LeaveType, LeaveStatus } from "@/lib/enums";
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
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left Column: Main Request Info & Actions */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Approval Actions Card - Most Prominent */}
            {canTakeAction && (
              <ApprovalActionCard
                leaveId={leave.id}
                leaveType={leave.type as unknown as LeaveType}
                currentUserRole={currentUserRole}
                requesterRole={leave.requester.role}
              />
            )}

            {/* Basic Information */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  Request Details
                </CardTitle>
                <CardDescription>
                  Submitted on {formatDate(leave.createdAt.toISOString())}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Leave Type
                    </p>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {leaveTypeLabel[leave.type] ?? leave.type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Duration
                    </p>
                    <p className="text-base font-semibold">
                      {leave.workingDays} working days
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(leave.startDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      End Date
                    </p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Reason
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 border border-border rounded-lg p-4">
                    {leave.reason}
                  </div>
                </div>

                {leave.certificateUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Attachments
                    </p>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a
                        href={leave.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4" />
                        Medical Certificate
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            <Card className="rounded-2xl border-muted shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  Approval Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-4 border-l border-border space-y-8 py-2">
                  {leave.approvals.map((approval, index) => (
                    <div key={approval.id} className="relative">
                      {/* Timeline Node */}
                      <div
                        className={`absolute -left-[25px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background ${approval.decision === "APPROVED"
                          ? "border-green-500 text-green-500"
                          : approval.decision === "REJECTED"
                            ? "border-red-500 text-red-500"
                            : approval.decision === "FORWARDED"
                              ? "border-blue-500 text-blue-500"
                              : (approval.decision as string) === "RETURNED"
                                ? "border-amber-500 text-amber-500"
                                : "border-muted-foreground text-muted-foreground"
                          }`}
                      >
                        {approval.decision === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                        {approval.decision === "REJECTED" && <XCircle className="h-3 w-3" />}
                        {approval.decision === "FORWARDED" && <Forward className="h-3 w-3" />}
                        {(approval.decision as string) === "RETURNED" && <RotateCcw className="h-3 w-3" />}
                        {approval.decision === "PENDING" && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">Step {approval.step}:</span>
                          <span className="text-sm">{approval.approver?.name || "Unassigned"}</span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            {approval.approver?.role}
                          </Badge>
                          {approval.decidedAt && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(approval.decidedAt.toISOString())}
                            </span>
                          )}
                        </div>

                        <div className="text-sm">
                          {approval.decision === "APPROVED" && <span className="text-green-600 font-medium">Approved</span>}
                          {approval.decision === "REJECTED" && <span className="text-red-600 font-medium">Rejected</span>}
                          {approval.decision === "FORWARDED" && <span className="text-blue-600 font-medium">Forwarded to {approval.toRole || "Next"}</span>}
                          {(approval.decision as string) === "RETURNED" && <span className="text-amber-600 font-medium">Returned</span>}
                          {approval.decision === "PENDING" && <span className="text-muted-foreground italic">Pending review...</span>}
                        </div>

                        {approval.comment && (
                          <div className="mt-2 text-sm bg-muted/50 p-2 rounded-md border border-border text-muted-foreground italic">
                            "{approval.comment}"
                          </div>
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
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5 text-primary" />
                    Discussion ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {comment.authorName.charAt(0)}
                          </span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              {comment.authorName}
                              <span className="text-xs font-normal text-muted-foreground ml-2">({comment.authorRole})</span>
                            </p>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Context Tabs */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Employee Identity Card - Always Visible */}
            <Card className="rounded-2xl border-none shadow-none bg-transparent p-0">
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{leave.requester.name}</h3>
                  <p className="text-sm text-muted-foreground">{leave.requester.role} • {leave.requester.department || "No Dept"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{leave.requester.email}</p>
                </div>
              </div>
            </Card>

            {/* Tabbed Context Area */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="policy">Policy</TabsTrigger>
                <TabsTrigger value="impact" className={overlappingLeaves.length > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
                  Impact {overlappingLeaves.length > 0 && `(${overlappingLeaves.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0 space-y-4">
                <EmployeeStatsCard
                  employee={leave.requester}
                  balances={balances}
                  leaveHistory={leaveHistory}
                />
              </TabsContent>

              <TabsContent value="policy" className="mt-0 space-y-4">
                <PolicyComplianceCheck
                  leaveType={leave.type as unknown as LeaveType}
                  workingDays={leave.workingDays}
                  startDate={leave.startDate}
                  endDate={leave.endDate}
                  balances={balances}
                />
              </TabsContent>

              <TabsContent value="impact" className="mt-0 space-y-4">
                {overlappingLeaves.length > 0 ? (
                  <TeamImpactCard overlappingLeaves={overlappingLeaves} />
                ) : (
                  <Card className="rounded-xl border-dashed">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No other team members are on leave during this period.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>

  );
}
