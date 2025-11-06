/**
 * Timeline Adapters
 * Convert various data formats to TimelineItem[] for SharedTimeline
 */

import type { TimelineItem } from "./SharedTimeline";
import { APPROVAL_CHAIN } from "@/lib/workflow";

// Approval Timeline Adapter
type ApprovalRecord = {
  step?: number;
  approver?: string | { name: string | null } | null;
  decision: string;
  comment?: string | null;
  decidedAt?: string | null;
  toRole?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  HR_ADMIN: "HR Admin",
  DEPT_HEAD: "Dept Head",
  HR_HEAD: "HR Head",
  CEO: "CEO",
};

function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role.replace(/_/g, " ");
}

export function ApprovalTimelineAdapter(
  approvals: ApprovalRecord[],
  createdAt?: string,
  status?: string
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Always start with "Submitted" stage
  if (createdAt) {
    items.push({
      id: "submitted",
      at: createdAt,
      actor: "You",
      status: "FORWARDED",
      title: "Request submitted",
      subtitle: "Request sent to HR Admin",
    });
  }

  // Create a map of step -> approval for quick lookup
  const approvalMap = new Map<number, ApprovalRecord>();
  approvals.forEach((approval) => {
    if (approval.step) {
      approvalMap.set(approval.step, approval);
    }
  });

  // Process each step in the approval chain
  APPROVAL_CHAIN.forEach((role, index) => {
    const step = index + 1; // Steps are 1-indexed
    const approval = approvalMap.get(step);

    if (approval) {
      // Approval record exists
      let timelineStatus: TimelineItem["status"];
      let title: string;
      let subtitle: string | undefined;

      if (approval.decision === "APPROVED") {
        timelineStatus = "APPROVED";
        title = `Approved by ${formatRoleLabel(role)}`;
        subtitle = approval.comment || undefined;
      } else if (approval.decision === "REJECTED") {
        timelineStatus = "REJECTED";
        title = `Rejected by ${formatRoleLabel(role)}`;
        subtitle = approval.comment || undefined;
      } else if (approval.decision === "FORWARDED") {
        timelineStatus = "FORWARDED";
        const nextRole = approval.toRole || APPROVAL_CHAIN[index + 1];
        title = nextRole
          ? `Forwarded to ${formatRoleLabel(nextRole)}`
          : "Forwarded";
        subtitle = approval.comment || undefined;
      } else {
        timelineStatus = "PENDING";
        title = `Awaiting review by ${formatRoleLabel(role)}`;
      }

      const approverName =
        typeof approval.approver === "string"
          ? approval.approver
          : approval.approver?.name || undefined;

      items.push({
        id: `approval-${step}`,
        at: approval.decidedAt || createdAt || new Date().toISOString(),
        actor: formatRoleLabel(role),
        status: timelineStatus,
        title,
        subtitle,
        meta: approverName ? { approverName } : undefined,
      });
    } else {
      // No approval record yet - check if it should be pending
      const hasAnyLaterApproval = APPROVAL_CHAIN.slice(index + 1).some(
        (laterRole) => {
          const laterStep = APPROVAL_CHAIN.indexOf(laterRole) + 1;
          return approvalMap.has(laterStep);
        }
      );

      // Find the highest completed step
      const completedSteps = Array.from(approvalMap.keys()).sort((a, b) => b - a);
      const highestStep = completedSteps.length > 0 ? completedSteps[0] : 0;

      // Show as pending if:
      // 1. There's a later approval (stage was skipped somehow), OR
      // 2. This step is the next one after the highest completed step, OR
      // 3. No approvals exist yet and this is the first step (HR_ADMIN), OR
      // 4. Status is not final (APPROVED/REJECTED/CANCELLED)
      const shouldShowAsPending =
        hasAnyLaterApproval ||
        step === highestStep + 1 ||
        (highestStep === 0 && step === 1) ||
        (status !== "APPROVED" &&
          status !== "REJECTED" &&
          status !== "CANCELLED" &&
          highestStep < step);

      if (shouldShowAsPending) {
        items.push({
          id: `pending-${step}`,
          at: createdAt || new Date().toISOString(),
          actor: formatRoleLabel(role),
          status: "PENDING",
          title: `Awaiting review by ${formatRoleLabel(role)}`,
        });
      }
    }
  });

  return items;
}

// Active Requests Timeline Adapter
type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  updatedAt?: string;
};

export function ActiveRequestsTimelineAdapter(
  leaves: LeaveRequest[]
): TimelineItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeaves = leaves
    .filter((leave) => {
      const isPendingOrApproved =
        leave.status === "PENDING" ||
        leave.status === "APPROVED" ||
        leave.status === "SUBMITTED";
      const endDate = new Date(leave.endDate);
      endDate.setHours(0, 0, 0, 0);
      const isRecentOrUpcoming = endDate >= today;
      return isPendingOrApproved && isRecentOrUpcoming;
    })
    .map((leave) => {
      const startDate = new Date(leave.startDate);
      const isUpcoming = startDate >= today;
      const daysUntil = isUpcoming
        ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: `leave-${leave.id}`,
        at: leave.updatedAt || leave.startDate,
        status: leave.status as TimelineItem["status"],
        title: `${leave.type} Leave`,
        subtitle: `${new Date(leave.startDate).toLocaleDateString()} → ${new Date(leave.endDate).toLocaleDateString()}`,
        meta: {
          daysUntil: daysUntil ?? -1,
          workingDays: leave.workingDays,
        },
      };
    });

  return activeLeaves;
}

// Live Activity Timeline Adapter
type LiveActivityLeave = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  updatedAt: string;
};

const ACTIVE_STATUSES = new Set([
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "RETURNED",
  "CANCELLATION_REQUESTED",
  "RECALLED",
]);

function differenceInCalendarDays(dateLeft: Date, dateRight: Date): number {
  const _dateLeft = new Date(
    dateLeft.getFullYear(),
    dateLeft.getMonth(),
    dateLeft.getDate()
  );
  const _dateRight = new Date(
    dateRight.getFullYear(),
    dateRight.getMonth(),
    dateRight.getDate()
  );
  const D_PER_MS = 1000 * 60 * 60 * 24;
  return Math.round((_dateLeft.getTime() - _dateRight.getTime()) / D_PER_MS);
}

export function LiveActivityTimelineAdapter(
  leaves: LiveActivityLeave[]
): TimelineItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeaves = leaves
    .filter((leave) => {
      const isActiveStatus = ACTIVE_STATUSES.has(leave.status);
      const endDate = new Date(leave.endDate);
      endDate.setHours(0, 0, 0, 0);
      const isCurrent = endDate >= today;
      return isActiveStatus && isCurrent;
    })
    .sort((a, b) => {
      // Priority sorting: action-required items first
      const priority: Record<string, number> = {
        RETURNED: 2,
        RECALLED: 3,
        PENDING: 4,
        SUBMITTED: 4,
        CANCELLATION_REQUESTED: 5,
        APPROVED: 6,
      };
      const priorityA = priority[a.status] || 99;
      const priorityB = priority[b.status] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      // Then by most recently updated
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    })
    .map((leave) => {
      const startDate = new Date(leave.startDate);
      const daysDiff = differenceInCalendarDays(startDate, today);

      let timeText = "";
      if (leave.status === "RETURNED") {
        timeText = "Action Required: Returned for modification.";
      } else if (daysDiff > 1) {
        timeText = `Starts in ${daysDiff} days`;
      } else if (daysDiff === 1) {
        timeText = "Starts tomorrow";
      } else if (daysDiff === 0) {
        timeText = "Starts today";
      } else if (daysDiff < 0) {
        const endDate = new Date(leave.endDate);
        const daysLeft = differenceInCalendarDays(endDate, today);
        if (daysLeft >= 0) {
          timeText = `Ends in ${daysLeft + 1} day(s)`;
        } else {
          timeText = "Ended";
        }
      }

      return {
        id: `activity-${leave.id}`,
        at: leave.updatedAt,
        status: leave.status as TimelineItem["status"],
        title: `${leave.type} Leave`,
        subtitle: timeText,
        meta: {
          daysUntil: daysDiff,
          workingDays: leave.workingDays,
        },
      };
    });

  return activeLeaves;
}

