"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { Clock, Users, RotateCcw, Calendar, Activity, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  AnalyticsBarChart,
  ExportButton,
} from "@/components/dashboards/shared";
import {
  PendingApprovals as PendingLeaveRequestsTable,
  CancellationRequests as CancellationRequestsPanel,
  ReturnedRequests as ReturnedRequestsPanel,
} from "@/components/dashboards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { formatDate } from "@/lib/utils";

interface HRHeadStats {
  // Core KPIs
  pending: number;
  onLeave: number;
  returned: number;
  upcoming: number;

  // Monthly metrics
  monthlyRequests: number;
  newHires: number;
  avgCasualDays: number;

  // Organization metrics
  totalEmployees: number;
  processedThisMonth: number;
  complianceScore: number;

  // Recent activity
  recentActivity: Array<{
    id: number;
    action: string;
    approver: string;
    approverRole: string;
    employee: string;
    leaveType: string;
    decidedAt: Date;
  }>;

  // Department breakdown
  departments: Array<{
    name: string;
    employees: number;
  }>;
}

export function HRHeadDashboardClient() {
  const { data: stats, isLoading, error } = useSWR<HRHeadStats>(
    "/api/dashboard/hr-head/stats",
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
      {/* Top KPI Cards */}
      <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <RoleKPICard
              title="Pending Requests"
              value={stats?.pending || 0}
              subtitle="Awaiting approval"
              icon={Clock}
              role="HR_HEAD"
              trend={stats && stats.pending > 10 ? {
                value: stats.pending - 10,
                label: "above normal",
                direction: "up"
              } : undefined}
            />
            <RoleKPICard
              title="On Leave Today"
              value={stats?.onLeave || 0}
              subtitle={`Out of ${stats?.totalEmployees || 0} employees`}
              icon={Users}
              role="HR_HEAD"
            />
            <RoleKPICard
              title="Returned for Modification"
              value={stats?.returned || 0}
              subtitle="Require employee action"
              icon={RotateCcw}
              role="HR_HEAD"
              trend={stats && stats.returned > 0 ? {
                value: stats.returned,
                label: "needs attention",
                direction: "down"
              } : undefined}
            />
            <RoleKPICard
              title="Upcoming Leaves"
              value={stats?.upcoming || 0}
              subtitle="Next 7 days"
              icon={Calendar}
              role="HR_HEAD"
            />
          </>
        )}
      </ResponsiveDashboardGrid>

      {/* Secondary Metrics */}
      <ResponsiveDashboardGrid columns="1:1:3:3" gap="md">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <RoleKPICard
              title="This Month"
              value={stats?.monthlyRequests || 0}
              subtitle="Total requests submitted"
              icon={Activity}
              role="HR_HEAD"
            />
            <RoleKPICard
              title="New Hires"
              value={stats?.newHires || 0}
              subtitle="Joined this month"
              icon={Users}
              role="HR_HEAD"
              trend={stats && stats.newHires > 0 ? {
                value: stats.newHires,
                label: "this month",
                direction: "up"
              } : undefined}
            />
            <RoleKPICard
              title="Policy Compliance"
              value={`${stats?.complianceScore || 0}%`}
              subtitle="Meeting SLA targets"
              icon={CheckCircle2}
              role="HR_HEAD"
              trend={
                stats && stats.complianceScore
                  ? {
                      value: stats.complianceScore >= 90 ? 2 : 5,
                      label: "vs last month",
                      direction: stats.complianceScore >= 90 ? "up" : "down"
                    }
                  : undefined
              }
            />
          </>
        )}
      </ResponsiveDashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pending Requests Table */}
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
                {!isLoading && stats && stats.pending > 0 && (
                  <ExportButton
                    data={[]} // Would need to fetch full data
                    filename="pending-requests"
                    title="Pending Requests"
                    formats={["csv", "pdf"]}
                    size="sm"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<DashboardCardSkeleton />}>
                <PendingLeaveRequestsTable />
              </Suspense>
            </CardContent>
          </Card>

          {/* Department Analytics */}
          {!isLoading && stats && stats.departments.length > 0 && (
            <AnalyticsBarChart
              title="Department Distribution"
              subtitle="Employees by department"
              data={stats.departments.map((dept) => ({
                name: dept.name,
                employees: dept.employees,
              }))}
              dataKeys={[
                { key: "employees", name: "Employees", color: "#3b82f6" },
              ]}
              xAxisKey="name"
            />
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organization Stats */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Organization Metrics
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
                    <span className="text-muted-foreground">Total Employees</span>
                    <span className="font-semibold">{stats?.totalEmployees || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Processed This Month</span>
                    <span className="font-semibold">{stats?.processedThisMonth || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Avg. Casual Leave</span>
                    <span className="font-semibold">{stats?.avgCasualDays || 0} days</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">New Hires</span>
                    <span className="font-semibold">{stats?.newHires || 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-16 w-full bg-muted/50 animate-pulse rounded" />
                  <div className="h-16 w-full bg-muted/50 animate-pulse rounded" />
                  <div className="h-16 w-full bg-muted/50 animate-pulse rounded" />
                </div>
              ) : stats && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {activity.approver}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.action === "APPROVED" ? "✓ Approved" : "✗ Rejected"}{" "}
                            {activity.employee}'s {activity.leaveType}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(activity.decidedAt?.toString() || new Date().toString())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Full Width */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Returned for Modification</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnedRequestsPanel />
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Cancellation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <CancellationRequestsPanel />
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </div>
  );
}
