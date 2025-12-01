"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LeaveTimeline, type LeaveTimelineItem } from "@/components/dashboards/shared/LeaveTimeline";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Activity } from "lucide-react";
import type { LeaveRow } from "@/hooks/useLeaveRequests";

type ActiveRequestTrackerProps = {
  leaves: LeaveRow[];
  isLoading: boolean;
};

import { useRouter } from "next/navigation";

export function ActiveRequestTracker({ leaves, isLoading }: ActiveRequestTrackerProps) {
  const router = useRouter();
  // Find the most recent active request
  const activeRequest = React.useMemo(() => {
    if (!leaves) return null;
    return leaves.find((leave) => 
      ["PENDING", "SUBMITTED", "FORWARDED"].includes(leave.status)
    );
  }, [leaves]);

  // Find next approved leave
  const nextApprovedLeave = React.useMemo(() => {
    if (!leaves) return null;
    const now = new Date();
    const approved = leaves.filter(l => 
      l.status === 'APPROVED' && new Date(l.startDate) > now
    );
    return approved.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [leaves]);

  const displayLeave = activeRequest || nextApprovedLeave;
  const isApproved = !activeRequest && !!nextApprovedLeave;

  if (isLoading) {
    return (
      <GlassCard variant="hover" className="mb-6">
        <GlassCardHeader className="pb-2">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </GlassCardHeader>
        <GlassCardContent>
          <div className="h-24 bg-muted/50 animate-pulse rounded-lg" />
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (!displayLeave) {
    return null;
  }

  // Map LeaveRow to LeaveTimelineItem
  const timelineItem: LeaveTimelineItem = {
    id: displayLeave.id,
    type: displayLeave.type,
    status: displayLeave.status as any,
    startDate: displayLeave.startDate,
    endDate: displayLeave.endDate,
    days: displayLeave.workingDays,
    reason: displayLeave.reason,
    createdAt: displayLeave.createdAt,
    updatedAt: displayLeave.updatedAt,
    approvalChain: displayLeave.approvals?.map((approval, index) => ({
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
      <GlassCard 
        variant="hover" 
        className={`${isApproved 
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
          : "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10"
        } cursor-pointer`}
        onClick={() => router.push("/leaves")}
      >
        <GlassCardHeader className="pb-2">
          <GlassCardTitle className={isApproved 
            ? "text-lg font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400"
            : "text-lg font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400"
          }>
            <Activity className="h-5 w-5" />
            {isApproved ? "Upcoming Leave" : "Active Request Tracking"}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <LeaveTimeline
            leaves={[timelineItem]}
            orientation="horizontal"
            interactive={false}
            showApprovalChain={!isApproved}
            className="border-0 shadow-none bg-transparent"
            title=""
          />
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
