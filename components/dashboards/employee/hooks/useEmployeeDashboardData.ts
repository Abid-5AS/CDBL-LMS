/**
 * Custom hook for processing employee dashboard data
 */

import * as React from "react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import {
  getCurrentApprovalStage,
  getDaysWaiting,
  normalizeBalanceData,
} from "../utils/employee-utils";

type LeaveRequest = {
  id: number;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  createdAt?: string;
  updatedAt: string;
  approvals?: any[];
  [key: string]: any;
};

type ActionItem = {
  type: "returned" | "certificate" | "cancelable" | "expiring";
  title: string;
  description: string;
  action: string;
  actionLink: string;
  variant: "destructive" | "warning" | "info";
  data?: any;
};

const UNDER_REVIEW_STATUSES = new Set<LeaveRequest["status"]>([
  "SUBMITTED",
  "PENDING",
  "CANCELLATION_REQUESTED",
  "RECALLED",
]);

const ACTION_REQUIRED_STATUSES = new Set<LeaveRequest["status"]>([
  "RETURNED",
]);

export function useEmployeeDashboardData(
  leaves: LeaveRequest[] | undefined,
  balanceData: Record<string, unknown> | undefined
) {
  return React.useMemo(() => {
    const underReviewLeaves =
      leaves?.filter((l) => UNDER_REVIEW_STATUSES.has(l.status)) || [];
    const actionRequiredLeaves =
      leaves?.filter((l) => ACTION_REQUIRED_STATUSES.has(l.status)) || [];
    const approvedLeaves = leaves?.filter((l) => l.status === "APPROVED") || [];

    // Calculate pending request details
    const underReviewDetails =
      underReviewLeaves.length > 0
        ? {
            oldestRequest: underReviewLeaves.reduce((oldest, current) =>
              new Date(current.createdAt || current.updatedAt) <
              new Date(oldest.createdAt || oldest.updatedAt)
                ? current
                : oldest
            ),
            averageWaitDays: Math.round(
              underReviewLeaves.reduce(
                (sum, leave) =>
                  sum + getDaysWaiting(leave.createdAt || leave.updatedAt),
                0
              ) / underReviewLeaves.length
            ),
          }
        : null;

    const pendingStageInfo = underReviewDetails
      ? getCurrentApprovalStage(underReviewDetails.oldestRequest.approvals)
      : null;

    const normalizedBalanceData = normalizeBalanceData(balanceData);

    const totalBalance = Object.values(normalizedBalanceData).reduce(
      (sum, val) => sum + val,
      0
    );

    const usedThisYear =
      leaves
        ?.filter((l) => l.status === "APPROVED")
        .reduce((sum, l) => sum + (l.workingDays || 0), 0) || 0;

    // Process recent leaves with proper formatting
    const recentLeaves =
      leaves?.slice(0, 3).map((leave) => ({
        ...leave,
        typeLabel: leaveTypeLabel[leave.type] || leave.type,
        formattedDates: `${formatDate(leave.startDate)} - ${formatDate(
          leave.endDate
        )}`,
      })) || [];

    // Find next scheduled leave (approved leave with start date in future)
    const now = new Date();
    const upcomingApprovedLeaves = approvedLeaves
      .filter((l) => new Date(l.startDate) > now)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

    const nextScheduledLeave = upcomingApprovedLeaves[0] || null;
    const daysUntilNextLeave = nextScheduledLeave
      ? Math.ceil(
          (new Date(nextScheduledLeave.startDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Calculate action items for Action Center
    const actionItems: ActionItem[] = [];

    // 1. Returned requests
    actionRequiredLeaves.forEach((leave) => {
      actionItems.push({
        type: "returned",
        title: `${leaveTypeLabel[leave.type] || leave.type} Leave - Returned`,
        description: `${formatDate(leave.startDate)} - ${formatDate(
          leave.endDate
        )} (${leave.workingDays} days)`,
        action: "Edit & Resubmit",
        actionLink: `/leaves/${leave.id}/edit`,
        variant: "destructive",
        data: leave,
      });
    });

    // 2. Medical leave requiring certificate (approved medical leave > 3 days without certificate uploaded)
    const medicalLeavesNeedingCert = approvedLeaves.filter(
      (l) =>
        l.type === "MEDICAL" && l.workingDays > 3 && new Date(l.endDate) < now
    );
    medicalLeavesNeedingCert.forEach((leave) => {
      actionItems.push({
        type: "certificate",
        title: "Medical Certificate Required",
        description: `${formatDate(leave.startDate)} - ${formatDate(
          leave.endDate
        )} (${leave.workingDays} days)`,
        action: "Upload Certificate",
        actionLink: `/leaves/${leave.id}`,
        variant: "warning",
        data: leave,
      });
    });

    // 3. Upcoming leaves that can be cancelled (within cancellation window)
    const cancelableLeaves = upcomingApprovedLeaves
      .filter((l) => l.id !== nextScheduledLeave?.id)
      .filter((l) => {
        const daysUntil = Math.ceil(
          (new Date(l.startDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 14 && daysUntil > 0; // Show if within 2 weeks
      })
      .slice(0, 2); // Limit to 2

    cancelableLeaves.forEach((leave) => {
      const daysUntil = Math.ceil(
        (new Date(leave.startDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      actionItems.push({
        type: "cancelable",
        title: `Upcoming ${leaveTypeLabel[leave.type] || leave.type} Leave`,
        description: `Starts ${
          daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`
        } - ${formatDate(leave.startDate)} (${leave.workingDays} days)`,
        action: "Cancel if needed",
        actionLink: `/leaves?filter=approved`,
        variant: "info",
        data: leave,
      });
    });

    // 4. Casual leave expiring soon (year-end)
    const currentMonth = now.getMonth();
    const isYearEnd = currentMonth >= 10; // November or December
    const casualBalance = normalizedBalanceData.CASUAL || 0;
    if (isYearEnd && casualBalance > 0) {
      actionItems.push({
        type: "expiring",
        title: "Casual Leave Expiring",
        description: `${casualBalance} days will expire on Dec 31`,
        action: "Apply Now",
        actionLink: "/leaves/apply",
        variant: "warning",
      });
    }

    return {
      underReviewCount: underReviewLeaves.length,
      needsAttentionCount: actionRequiredLeaves.length,
      returnedCount: actionRequiredLeaves.length,
      approvedCount: approvedLeaves.length,
      totalBalance,
      usedThisYear,
      balanceData: normalizedBalanceData,
      recentLeaves,
      nextScheduledLeave,
      daysUntilNextLeave,
      actionItems,
      pendingStageInfo,
      pendingAverageWait: underReviewDetails?.averageWaitDays || 0,
    };
  }, [leaves, balanceData]);
}
