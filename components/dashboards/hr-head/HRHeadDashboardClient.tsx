"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { Clock, Users, RotateCcw, Calendar, Activity, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  DashboardSection,
  AnalyticsBarChart,
  ExportButton,
} from "@/components/dashboards/shared";
import {
  PendingApprovals as PendingLeaveRequestsTable,
  CancellationRequests as CancellationRequestsPanel,
  ReturnedRequests as ReturnedRequestsPanel,
} from "@/components/dashboards";

// Skeleton components for loading states
function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

function KPIGridSkeleton() {
  return (
    <ResponsiveDashboardGrid columns="1:1:3:3" gap="md">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </ResponsiveDashboardGrid>
  );
}
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
      <DashboardSection
        title="HR Operations Overview"
        description="Key metrics for leave management and HR operations"
        isLoading={isLoading}
        loadingFallback={<KPIGridSkeleton />}
      >
        <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
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
        </ResponsiveDashboardGrid>
      </DashboardSection>

      {/* Secondary Metrics */}
      <DashboardSection
        title="Performance & Compliance"
        description="Monthly metrics, new hires, and policy compliance"
        isLoading={isLoading}
        loadingFallback={<KPIGridSkeleton />}
      >
        <ResponsiveDashboardGrid columns="1:1:3:3" gap="md">
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
        </ResponsiveDashboardGrid>
      </DashboardSection>

      {/* Approvals & Analytics */}
      <DashboardSection
        title="Approvals & Analytics"
        description="Pending approvals, department performance, and organization metrics"
        isLoading={isLoading}
      >
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
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
          {!isLoading && stats && stats.departments && stats.departments.length > 0 && (
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

        {/* Sidebar */}
        <div className="xl:w-80 shrink-0 space-y-4 sm:space-y-6">
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
      </DashboardSection>

      {/* Bottom Section - Full Width */}
      <DashboardSection
        title="Additional Requests"
        description="Returned and cancelled leave requests"
        isLoading={isLoading}
      >
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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
      </DashboardSection>
    </div>
  );
}
