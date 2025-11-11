"use client";

import { Users, Calendar, TrendingUp, Clock } from "lucide-react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";

// Lib utilities
import { formatDate } from "@/lib";


type TeamOverviewData = {
  totalEmployees: number;
  onLeaveToday: number;
  topLeaveType: string;
  avgApprovalTime: number;
  upcomingLeaves: Array<{
    id: number;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
  }>;
};

export function DeptHeadTeamOverview() {
  const { data, isLoading, error } = useSWR<TeamOverviewData>(
    "/api/manager/team-overview",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active team data. Employees may not be assigned to your
            department.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-data-info" />
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
            <p className="text-2xl font-bold">{data.totalEmployees}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-data-warning" />
              <p className="text-xs text-muted-foreground">On Leave Today</p>
            </div>
            <p className="text-2xl font-bold">{data.onLeaveToday}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-data-success" />
              <p className="text-xs text-muted-foreground">Top Leave Type</p>
            </div>
            <p className="text-lg font-semibold">
              {data.topLeaveType || "N/A"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-card-summary" />
              <p className="text-xs text-muted-foreground">Avg Approval Time</p>
            </div>
            <p className="text-lg font-semibold">
              {data.avgApprovalTime.toFixed(1)} days
            </p>
          </div>
        </div>

        {/* Upcoming Leaves */}
        {data.upcomingLeaves && data.upcomingLeaves.length > 0 && (
          <div className="pt-4 border-t border-muted/60">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Upcoming Leaves
            </p>
            <div className="space-y-2">
              {data.upcomingLeaves.slice(0, 3).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{leave.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {formatDate(leave.startDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      → {formatDate(leave.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
