"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadgeSimple } from "./StatusBadgeSimple";
import { getChainFor, type LeaveType } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-state";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"

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

interface SortedTimelineProps {
  leaves: LeaveRequest[];
  isLoading: boolean;
}

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

function getDaysUntilBadge(days: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (days < 0) {
    return { text: "Past", variant: "outline" };
  }
  if (days < 3) {
    return { text: `Starts in ${days}d`, variant: "destructive" };
  }
  if (days <= 7) {
    return { text: `Starts in ${days}d`, variant: "secondary" };
  }
  return { text: `Starts in ${days}d`, variant: "default" };
}

export function SortedTimeline({ leaves, isLoading }: SortedTimelineProps) {
  const router = useRouter();
  const { openDrawer } = useUIStore();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past">("upcoming");

  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const sortedLeaves = useMemo(() => {
    let filtered = leaves.filter((leave) => {
      // Filter by type
      if (typeFilter !== "all" && leave.type !== typeFilter) {
        return false;
      }
      // Filter by status
      if (statusFilter !== "all" && leave.status !== statusFilter) {
        return false;
      }
      // Filter by time (upcoming vs past)
      const startDate = new Date(leave.startDate);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (timeFilter === "upcoming") {
        return startDate >= today;
      } else {
        return startDate < today;
      }
    });

    // Sort by startDate ascending (nearest first for upcoming, most recent first for past)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return timeFilter === "upcoming" ? dateA - dateB : dateB - dateA;
    });
  }, [leaves, typeFilter, statusFilter, timeFilter]);

  const leaveTypes = useMemo(() => {
    const types = new Set(leaves.map((l) => l.type));
    return Array.from(types).sort();
  }, [leaves]);

  const statuses = useMemo(() => {
    const statusSet = new Set(leaves.map((l) => l.status));
    return Array.from(statusSet).sort();
  }, [leaves]);

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

  if (sortedLeaves.length === 0) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4" />
              Active Timeline
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No leaves match your filters
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Active Timeline
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 h-7 px-2 text-xs"
            onClick={() => router.push("/leaves")}
          >
            View All
            <ChevronRight className="ml-1 size-3" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Time filter tabs */}
          <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
            <button
              onClick={() => setTimeFilter("upcoming")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                timeFilter === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeFilter("past")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                timeFilter === "past"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              Past
            </button>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {leaveTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ul className="space-y-2 max-h-[400px] overflow-y-auto">
          {sortedLeaves.slice(0, 5).map((leave) => {
            const startDate = new Date(leave.startDate);
            const daysDiff = differenceInCalendarDays(startDate, today);
            const badge = getDaysUntilBadge(daysDiff);

            return (
              <li
                key={leave.id}
                className="solid-card cursor-pointer transition-all hover:scale-[1.01] p-3"
                onClick={() => openDrawer(leave.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDrawer(leave.id);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {leave.type}
                      </p>
                      <StatusBadgeSimple status={leave.status} />
                      <Badge variant={badge.variant} className="text-xs shrink-0">
                        {badge.text}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)} ({leave.workingDays}d)
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {sortedLeaves.length > 5 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/leaves")}
            >
              View {sortedLeaves.length - 5} more
              <ChevronRight className="ml-1 size-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
