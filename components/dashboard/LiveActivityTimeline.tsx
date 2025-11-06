"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Calendar,
  Check,
  ChevronRight,
  AlertOctagon,
  RefreshCcw,
  Archive,
  Hourglass,
  BadgeAlert,
  Shield,
  Briefcase,
  UserCheck,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { getChainFor, type LeaveType } from "@/lib/workflow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"
  | "DRAFT";

type ApprovalRecord = {
  step: number;
  decision: "PENDING" | "FORWARDED" | "APPROVED" | "REJECTED" | "RETURNED";
  approver?: { name: string | null } | null;
  toRole?: string | null;
};

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
  updatedAt: string;
  approvals: ApprovalRecord[];
};

/**
 * Role display configuration
 */
const ROLE_DISPLAY: Record<string, { name: string; icon: typeof User }> = {
  HR_ADMIN: { name: "HR Admin", icon: Shield },
  DEPT_HEAD: { name: "Dept. Head", icon: Briefcase },
  HR_HEAD: { name: "HR Head", icon: UserCheck },
  CEO: { name: "CEO", icon: User },
  DEFAULT: { name: "Approver", icon: User },
};

/**
 * Active statuses that should appear in the Live Activity Timeline
 * These are requests that need attention or are currently active
 */
const ACTIVE_STATUSES = new Set<LeaveStatus>([
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "RETURNED",
  "CANCELLATION_REQUESTED",
  "RECALLED",
]);

/**
 * Calculates the difference in calendar days between two dates
 */
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

/**
 * ApprovalChainTracker Component
 * Renders the approval chain visualization showing current progress
 */
function ApprovalChainTracker({ leave }: { leave: LeaveRequest }) {
  // Get the correct chain for this leave type
  const chain = getChainFor(leave.type as LeaveType);

  // Count completed steps (FORWARDED approvals)
  const completedSteps = leave.approvals.filter(
    (a) => a.decision === "FORWARDED"
  ).length;

  // Determine active step
  let activeStep = -1;
  if (leave.status === "SUBMITTED" || leave.status === "PENDING") {
    activeStep = completedSteps;
  } else if (leave.status === "APPROVED") {
    activeStep = chain.length; // All steps complete
  }

  return (
    <div className="flex items-center px-1 pt-1">
      {chain.map((role, index) => {
        const { name, icon: Icon } =
          ROLE_DISPLAY[role] || ROLE_DISPLAY.DEFAULT;

        let stepStatus: "COMPLETED" | "ACTIVE" | "PENDING" = "PENDING";
        if (leave.status === "APPROVED") {
          stepStatus = "COMPLETED";
        } else if (index < activeStep) {
          stepStatus = "COMPLETED";
        } else if (index === activeStep) {
          stepStatus = "ACTIVE";
        }

        const isLastStep = index === chain.length - 1;

        return (
          <React.Fragment key={role}>
            {/* Checkpoint Icon and Label - COMPACT */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "size-5 rounded-full flex items-center justify-center border",
                  stepStatus === "COMPLETED" &&
                    "bg-green-600 border-green-600 text-white",
                  stepStatus === "ACTIVE" &&
                    "bg-blue-600 border-blue-600 text-white animate-pulse",
                  stepStatus === "PENDING" &&
                    "bg-gray-100 border-gray-300 text-gray-400"
                )}
              >
                {stepStatus === "COMPLETED" ? (
                  <Check className="size-3" />
                ) : (
                  <Icon className="size-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[12px] leading-tight mt-0.5",
                  stepStatus === "ACTIVE" && "font-bold text-blue-600",
                  stepStatus === "COMPLETED" && "font-medium text-gray-700",
                  stepStatus === "PENDING" && "text-gray-400"
                )}
              >
                {name}
              </span>
            </div>

            {/* Connector Line - COMPACT */}
            {!isLastStep && (
              <div className="flex-1 h-0.5 mx-1 bg-gray-200 rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    (stepStatus === "COMPLETED" || stepStatus === "ACTIVE") &&
                      "bg-blue-600"
                  )}
                  style={{
                    width:
                      stepStatus === "COMPLETED"
                        ? "100%"
                        : stepStatus === "ACTIVE"
                        ? "50%"
                        : "0%",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * LiveActivityTimeline Component
 * 
 * Shows active leave requests with approval chain tracking.
 * 
 * Difference from RequestsTable:
 * - RequestsTable: Shows recent requests (any status) in list format
 * - LiveActivityTimeline: Shows only ACTIVE requests with approval tracking visualization
 */
export function LiveActivityTimeline({
  leaves,
  isLoading,
}: {
  leaves: LeaveRequest[];
  isLoading: boolean;
}) {
  const router = useRouter();
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const activeLeaves = useMemo(() => {
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return leaves
      .filter((leave) => {
        const isActiveStatus = ACTIVE_STATUSES.has(leave.status);
        const endDate = new Date(leave.endDate);
        endDate.setHours(0, 0, 0, 0);
        const isCurrent = endDate >= todayStart;
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
      .slice(0, 3); // Show top 3
  }, [leaves, today]);

  /**
   * Renders a single live activity card - COMPACT VERSION
   */
  const renderTimelineItem = (leave: LeaveRequest) => {
    const startDate = new Date(leave.startDate);
    const daysDiff = differenceInCalendarDays(startDate, today);

    let timeText = "";
    let timeTextClass = "text-blue-600";

    if (leave.status === "RETURNED") {
      timeText = "Action Required: Returned for modification.";
      timeTextClass = "text-yellow-700 font-bold";
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

    // Show tracker for pending/submitted/approved requests
    const showTracker =
      leave.status === "SUBMITTED" ||
      leave.status === "PENDING" ||
      leave.status === "APPROVED";

    return (
      <li
        key={leave.id}
        className="solid-card cursor-pointer transition-all hover:scale-[1.01] h-[120px] flex flex-col"
        onClick={() => router.push(`/leaves?id=${leave.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/leaves?id=${leave.id}`);
          }
        }}
      >
        {/* Header: Type and Status - COMPACT */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {leave.type} Leave
          </p>
          <StatusBadge status={leave.status} />
        </div>

        {/* Content: Dates, Time, Status in single row - COMPACT */}
        <div className="flex-1 px-3 py-2 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {leave.workingDays}d
            </p>
          </div>

          {/* Single row: time text + duration */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={cn("text-xs font-medium", timeTextClass)}>
              {timeText}
            </p>
          </div>

          {/* Approval Chain Tracker - COMPACT */}
          {showTracker && (
            <div className="mt-1">
              <ApprovalChainTracker leave={leave} />
            </div>
          )}
        </div>
      </li>
    );
  };

  if (isLoading) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (activeLeaves.length === 0) {
    return null; // Don't show empty card
  }

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Timeline</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 h-7 px-2 text-xs"
            onClick={() => router.push("/leaves?status=pending")}
          >
            View All
            <ChevronRight className="ml-1 size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ul className="space-y-1.5 md:space-y-2">{activeLeaves.map(renderTimelineItem)}</ul>
      </CardContent>
    </Card>
  );
}

