"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Activity,
  Target,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import {
  KPICard,
  KPICardSkeleton,
  KPIGrid,
  AnalyticsLineChart,
  AnalyticsPieChart,
  ExportButton,
} from "@/components/dashboards/shared";
import { PendingLeaveRequestsTable } from "./sections/PendingApprovals";
import { CancellationRequestsPanel } from "./sections/CancellationRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface HRAdminStats {
  // Core KPIs
  employeesOnLeave: number;
  pendingRequests: number;
  avgApprovalTime: number;
  encashmentPending: number;

  // Volume metrics
  totalLeavesThisYear: number;
  processedToday: number;
  dailyTarget: number;
  dailyProgress: number;

  // Performance metrics
  teamUtilization: number;
  complianceScore: number;

  // Analytics data
  leaveTypeBreakdown: Array<{
    type: string;
    count: number;
    totalDays: number;
  }>;

  // Trend data
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
}

export function HRAdminDashboardClient() {
  const { data: stats, isLoading, error } = useSWR<HRAdminStats>(
    "/api/dashboard/hr-admin/stats",
    apiFetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-data-error/20 bg-data-error/5 p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-data-error" />
        <p className="text-sm text-data-error font-medium">
          Failed to load dashboard statistics
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <KPIGrid>
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <KPICard
              title="Employees on Leave"
              value={stats?.employeesOnLeave || 0}
              subtitle="Currently absent"
              icon={Users}
              variant="info"
            />
            <KPICard
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              subtitle="Awaiting action"
              icon={Clock}
              variant={stats && stats.pendingRequests > 15 ? "warning" : "default"}
            />
            <KPICard
              title="Avg Approval Time"
              value={`${stats?.avgApprovalTime?.toFixed(1) || 0}d`}
              subtitle="Processing speed"
              icon={TrendingUp}
              variant={stats && stats.avgApprovalTime > 3 ? "warning" : "success"}
            />
            <KPICard
              title="Total Leaves (YTD)"
              value={stats?.totalLeavesThisYear || 0}
              subtitle="This year"
              icon={Calendar}
              variant="default"
            />
          </>
        )}
      </KPIGrid>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Daily Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">
                      {stats?.processedToday || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {stats?.dailyTarget || 10} target
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-data-info">
                      {stats?.dailyProgress || 0}%
                    </p>
                  </div>
                </div>
                <Progress value={stats?.dailyProgress || 0} className="h-2" />
                {stats && stats.dailyProgress >= 100 && (
                  <p className="text-xs text-data-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Target achieved!
                  </p>
                )}
              </CardContent>
            </Card>

            <KPICard
              title="Team Utilization"
              value={`${stats?.teamUtilization || 0}%`}
              subtitle="Workforce availability"
              icon={Activity}
              variant={
                stats && stats.teamUtilization < 80
                  ? "warning"
                  : stats && stats.teamUtilization >= 90
                  ? "success"
                  : "default"
              }
              trend={
                stats && stats.teamUtilization
                  ? {
                      value: stats.teamUtilization >= 85 ? 2 : -3,
                      label: "vs target",
                    }
                  : undefined
              }
            />

            <KPICard
              title="Compliance Score"
              value={`${stats?.complianceScore || 0}%`}
              subtitle="Policy adherence"
              icon={CheckCircle2}
              variant={stats && stats.complianceScore >= 90 ? "success" : "warning"}
              trend={
                stats && stats.complianceScore
                  ? { value: stats.complianceScore >= 90 ? 1 : -2, label: "this month" }
                  : undefined
              }
            />
          </>
        )}
      </div>

      {/* Pending Requests Table - Full Width */}
      <Suspense fallback={<DashboardCardSkeleton />}>
        <PendingLeaveRequestsTable />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charts - Left Side (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Trend Chart */}
          {!isLoading && stats && stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
            <AnalyticsLineChart
              title="Request Trend"
              subtitle="Last 6 months submission pattern"
              data={stats.monthlyTrend.map((item) => ({
                name: item.month,
                requests: item.count,
              }))}
              dataKeys={[{ key: "requests", name: "Requests", color: "#3b82f6" }]}
              xAxisKey="name"
            />
          )}
        </div>

        {/* Sidebar - Right Side (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Stats Summary */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                  <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                  <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Processed Today</span>
                    <span className="font-semibold">{stats?.processedToday || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold">{stats?.pendingRequests || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">On Leave</span>
                    <span className="font-semibold">{stats?.employeesOnLeave || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Avg Processing</span>
                    <span className="font-semibold">
                      {stats?.avgApprovalTime?.toFixed(1) || 0} days
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Encashment Queue</span>
                    <span className="font-semibold">{stats?.encashmentPending || 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Leave Type Distribution */}
          {!isLoading && stats && stats.leaveTypeBreakdown && stats.leaveTypeBreakdown.length > 0 && (
            <AnalyticsPieChart
              title="Leave Type Distribution"
              subtitle="Current year breakdown"
              data={stats.leaveTypeBreakdown.map((item) => ({
                name: item.type,
                value: item.count,
              }))}
              showPercentage={true}
            />
          )}
        </div>
      </div>

      {/* Cancellation Requests - Full Width */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cancellation Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DashboardCardSkeleton />}>
            <CancellationRequestsPanel />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
