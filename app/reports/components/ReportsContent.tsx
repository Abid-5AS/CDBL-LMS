"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveTrendChartData } from "@/components/dashboard/LeaveTrendChartData";
import { LeaveTypePieChartData } from "@/components/dashboard/LeaveTypePieChartData";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { BarChart3, Calendar, Users, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatCard({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: typeof BarChart3; trend?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

export function ReportsContent() {
  const { data: approvalsData } = useSWR("/api/approvals", fetcher);
  const { data: leavesData } = useSWR("/api/leaves?mine=1", fetcher);

  const pendingCount = Array.isArray(approvalsData?.items) ? approvalsData.items.length : 0;
  const myLeavesCount = Array.isArray(leavesData?.items) ? leavesData.items.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          icon={BarChart3}
          trend="Requires action"
        />
        <StatCard
          title="My Leave Requests"
          value={myLeavesCount}
          icon={Calendar}
          trend="All time"
        />
        <StatCard
          title="Approved This Month"
          value="—"
          icon={TrendingUp}
          trend="Coming soon"
        />
        <StatCard
          title="Total Employees"
          value="—"
          icon={Users}
          trend="Coming soon"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-auto min-h-[300px]">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
              <LeaveTrendChartData />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="h-auto min-h-[300px]">
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
              <LeaveTypePieChartData />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Detailed reporting and export functionality will be available in a future update. For now, you can view analytics on the dashboard.
          </p>
          <div className="flex gap-2">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline" disabled>
              Export as CSV
            </button>
            <span className="text-muted-foreground">•</span>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline" disabled>
              Export as PDF
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

