"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui";
import { ChevronRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SharedTimeline } from "@/components/shared/SharedTimeline";
import { SortedTimelineAdapter } from "@/components/shared/timeline-adapters";
import { getChainFor } from "@/lib/workflow";
import { type LeaveType } from "@prisma/client";
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
  | "RECALLED";

type ApprovalRecord = {
  step?: number;
  decision: string;
  approver?: { name: string | null } | null;
  toRole?: string | null;
  comment?: string | null;
  decidedAt?: string | null;
};

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
  updatedAt: string;
  approvals?: ApprovalRecord[];
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

function getDaysUntilBadge(days: number): {
  text: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
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
          <div className="text-center text-text-secondary dark:text-text-secondary">
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
            className="text-data-info font-semibold hover:bg-data-info dark:hover:bg-data-info/30 h-7 px-2 text-xs"
            onClick={() => router.push("/leaves")}
          >
            View All
            <ChevronRight className="ml-1 size-3" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Time filter tabs */}
          <div className="flex gap-1 rounded-lg border border-border-strong dark:border-border-strong p-1">
            <button
              onClick={() => setTimeFilter("upcoming")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                timeFilter === "upcoming"
                  ? "bg-data-info text-text-inverted"
                  : "text-text-secondary dark:text-text-secondary hover:bg-bg-secondary dark:hover:bg-bg-secondary"
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeFilter("past")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                timeFilter === "past"
                  ? "bg-data-info text-text-inverted"
                  : "text-text-secondary dark:text-text-secondary hover:bg-bg-secondary dark:hover:bg-bg-secondary"
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
        <div className="max-h-[400px] overflow-y-auto">
          <SharedTimeline
            items={SortedTimelineAdapter(sortedLeaves, today)}
            variant="requests"
            dense
            limit={5}
            onItemClick={(item) => {
              const leaveId = parseInt(item.id.replace("sorted-", ""));
              if (leaveId) {
                openDrawer(leaveId);
              }
            }}
          />
        </div>
        {sortedLeaves.length > 5 && (
          <div className="mt-3 pt-3 border-t border-border-strong dark:border-border-strong text-center">
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
