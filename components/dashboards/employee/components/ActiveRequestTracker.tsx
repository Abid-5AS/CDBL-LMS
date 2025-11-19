"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LeaveTimeline, type LeaveTimelineItem } from "@/components/dashboards/shared/LeaveTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { LeaveRow } from "@/hooks/useLeaveRequests";

type ActiveRequestTrackerProps = {
  leaves: LeaveRow[];
  isLoading: boolean;
};

export function ActiveRequestTracker({ leaves, isLoading }: ActiveRequestTrackerProps) {
  // Find the most recent active request
  const activeRequest = React.useMemo(() => {
    if (!leaves) return null;
    return leaves.find((leave) => 
      ["PENDING", "SUBMITTED", "FORWARDED"].includes(leave.status)
    );
  }, [leaves]);

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm mb-6">
        <CardHeader className="pb-2">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted/50 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!activeRequest) {
    return null;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Activity className="h-5 w-5" />
            Active Request Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveTimeline
            leaves={[timelineItem]}
            orientation="horizontal"
            interactive={false}
            showApprovalChain={true}
            className="border-0 shadow-none bg-transparent"
            title=""
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
