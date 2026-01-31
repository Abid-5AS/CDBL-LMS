/**
 * Timeline Adapters
 * Convert various data formats to TimelineItem[] for SharedTimeline
 */

import type { TimelineItem } from "./SharedTimeline";


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

// Approval Timeline Adapter - Refactored for Dynamic Chains
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
      subtitle: "Request sent for approval",
    });
  }

  // Sort approvals by step to ensure correct order
  const sortedApprovals = [...approvals].sort((a, b) => (a.step || 0) - (b.step || 0));

  sortedApprovals.forEach((approval, index) => {
    // Infer role/title handling
    // Since we don't have the static chain, we rely on the approval record or fallback
    // In the new Snapshot system, typically we know the role.
    // For now, we will use a generic "Approver" label if we can't determine it,
    // or try to extract it if passed in 'toRole' of previous step?

    // Actually, looking at the UI, we want to show "Approved by Dept Head".
    // If 'approver' is an object { name, role? }, we might have it.
    // Let's assume for now we use the valid approver name if available.

    const approverName =
      typeof approval.approver === "string"
        ? approval.approver
        : approval.approver?.name || "Approver";

    let timelineStatus: TimelineItem["status"];
    let title: string;
    let subtitle: string | undefined;

    if (approval.decision === "APPROVED") {
      timelineStatus = "APPROVED";
      title = `Approved by ${approverName}`;
      subtitle = approval.comment || undefined;
    } else if (approval.decision === "REJECTED") {
      timelineStatus = "REJECTED";
      title = `Rejected by ${approverName}`;
      subtitle = approval.comment || undefined;
    } else if (approval.decision === "FORWARDED") {
      timelineStatus = "FORWARDED";
      const nextRole = approval.toRole;
      title = nextRole
        ? `Forwarded to ${formatRoleLabel(nextRole)}`
        : "Forwarded";
      subtitle = approval.comment || undefined;
    } else {
      timelineStatus = "PENDING";
      // Pending items usually don't have an approver name yet if it's a role queue
      // But in snapshot, they have an assigned approverId (if found).
      // We can genericize the title.
      title = `Awaiting review`;
      if (approverName !== "Approver") {
        title += ` by ${approverName}`;
      }
    }

    items.push({
      id: `approval-${approval.step || index}`,
      at: approval.decidedAt || createdAt || new Date().toISOString(),
      actor: approverName, // Use name here
      status: timelineStatus,
      title,
      subtitle,
      meta: approverName ? { approverName } : undefined,
    });
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

// Sorted Timeline Adapter - for employee leave history sorted by date
export function SortedTimelineAdapter(
  leaves: LeaveRequest[],
  referenceDate?: Date
): TimelineItem[] {
  const today = referenceDate || new Date();
  today.setHours(0, 0, 0, 0);

  const sortedLeaves = [...leaves].sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  return sortedLeaves.map((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const isUpcoming = startDate >= today;

    return {
      id: `sorted-${leave.id}`,
      at: leave.updatedAt || leave.startDate,
      status: leave.status as TimelineItem["status"],
      title: `${leave.type} Leave`,
      subtitle: `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${leave.workingDays} days)`,
      meta: {
        workingDays: leave.workingDays,
        isUpcoming: isUpcoming ? 1 : 0,
      },
    };
  });
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

