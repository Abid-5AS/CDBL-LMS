"use client";

import * as React from "react";
import { LeaveTimeline, type LeaveTimelineItem } from "@/components/dashboards/shared/LeaveTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { LeaveRow } from "@/hooks/useLeaveRequests";
import { cn } from "@/lib/utils";
import type { DensityMode } from "@/lib/ui/density-modes";
import { getTypography, cardPadding } from "@/lib/ui/density-modes";
import { StatusBadge } from "@/components/corporate/StatusBadge";

type CorporateActiveRequestTrackerProps = {
  leaves: LeaveRow[];
  isLoading: boolean;
  density?: DensityMode;
};

/**
 * Corporate Active Request Tracker
 *
 * Shows the most recent PENDING/SUBMITTED/FORWARDED request
 * with approval chain visualization
 *
 * Design: Clean white card with colored left border (blue)
 * No gradients, solid backgrounds
 */
export function CorporateActiveRequestTracker({
  leaves,
  isLoading,
  density = "comfortable",
}: CorporateActiveRequestTrackerProps) {
  const typography = getTypography(density);

  // Find the most recent active request
  const activeRequest = React.useMemo(() => {
    if (!leaves) return null;
    return leaves.find((leave) =>
      ["PENDING", "SUBMITTED", "FORWARDED"].includes(leave.status)
    );
  }, [leaves]);

  if (isLoading) {
    return (
      <Card className={cn(
        "border-border shadow-sm mb-6 rounded-md",
        cardPadding(density)
      )}>
        <CardHeader className="pb-2">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted/50 animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!activeRequest) {
    return null; // No active requests
  }

  // Map LeaveRow to LeaveTimelineItem
  const timelineItem: LeaveTimelineItem = {
    id: activeRequest.id,
    type: activeRequest.type,
    status: activeRequest.status as any,
    startDate: activeRequest.startDate,
    endDate: activeRequest.endDate,
    days: activeRequest.workingDays,
    reason: activeRequest.reason,
    createdAt: activeRequest.createdAt,
    updatedAt: activeRequest.updatedAt,
    approvalChain: activeRequest.approvals?.map((approval, index) => ({
      step: approval.step || index + 1,
      role: approval.toRole || "Approver",
      status: (approval.decision === "APPROVED" ? "approved" : approval.decision === "REJECTED" ? "rejected" : "pending") as any,
      approver: approval.approver?.name || undefined,
      timestamp: approval.decidedAt || undefined,
    })) || [],
  };

  return (
    <div className="mb-6">
      <Card className={cn(
        "border-l-4 border-l-blue-500 border-border shadow-sm rounded-md",
        "bg-card"
      )}>
        <CardHeader className={cn("pb-3", cardPadding(density))}>
          <CardTitle className={cn(
            typography.cardTitle,
            "flex items-center gap-2 text-foreground"
          )}>
            <Activity className="h-5 w-5 text-blue-600" />
            Active Request Tracking
          </CardTitle>
          <p className={cn(typography.label, "!normal-case !text-muted-foreground mt-1")}>
            Your request is currently being reviewed
          </p>
        </CardHeader>
        <CardContent className={cardPadding(density)}>
          {/* Request Summary */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={cn(typography.body, "font-medium text-foreground")}>
                {activeRequest.type} Leave
              </p>
              <p className={cn(typography.label, "!normal-case !text-muted-foreground")}>
                {new Date(activeRequest.startDate).toLocaleDateString()} - {new Date(activeRequest.endDate).toLocaleDateString()}
                {" • "}
                {activeRequest.workingDays} days
              </p>
            </div>
            <StatusBadge status={activeRequest.status as any} density={density} />
          </div>

          {/* Approval Chain Timeline */}
          <LeaveTimeline
            leaves={[timelineItem]}
            orientation="horizontal"
            interactive={false}
            showApprovalChain={true}
            className="border-0 shadow-none bg-transparent p-0"
            title=""
          />

          {/* Approval Steps Summary */}
          {activeRequest.approvals && activeRequest.approvals.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeRequest.approvals.map((approval, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-md border",
                    approval.decision === "APPROVED" && "border-emerald-500/20 bg-emerald-500/10",
                    approval.decision === "PENDING" && "border-amber-500/20 bg-amber-500/10",
                    approval.decision === "REJECTED" && "border-red-500/20 bg-red-500/10",
                    approval.decision === "FORWARDED" && "border-blue-500/20 bg-blue-500/10"
                  )}
                >
                  {approval.decision === "APPROVED" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  )}
                  {approval.decision === "PENDING" && (
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  )}
                  {approval.decision === "REJECTED" && (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  {approval.decision === "FORWARDED" && (
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {approval.toRole?.replace("_", " ")}
                    </p>
                    {approval.approver?.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {approval.approver.name}
                      </p>
                    )}
                    {approval.decidedAt && (
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(approval.decidedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
