"use client";

import { Suspense, useMemo } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { Clock, Users, RotateCcw, Calendar, Activity, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  DashboardSection,
  AnalyticsBarChart,
  ExportButton,
} from "@/components/dashboards/shared";
import {
  KPIGridSkeleton
} from "@/components/shared/skeletons";
import {
  PendingApprovals as PendingLeaveRequestsTable,
  CancellationRequests as CancellationRequestsPanel,
  ReturnedRequests as ReturnedRequestsPanel,
} from "@/components/dashboards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { formatDate } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

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

  const insightItems = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Total employees",
        value: stats.totalEmployees ?? 0,
        helper: "Across all departments",
      },
      {
        label: "Processed this month",
        value: stats.processedThisMonth ?? 0,
        helper: "Requests cleared",
      },
      {
        label: "Avg casual leave",
        value: `${stats.avgCasualDays ?? 0} days`,
        helper: "Per employee",
      },
      {
        label: "New hires",
        value: stats.newHires ?? 0,
        helper: "Need onboarding",
      },
    ];
  }, [stats]);

  const alertItems = useMemo(() => {
    if (!stats)
      return [
        {
          title: "Awaiting data",
          detail: "Metrics will appear once stats load.",
          tone: "info" as const,
        },
      ];

    const alerts: Array<{
      title: string;
      detail: string;
      tone: "info" | "warning" | "critical";
    }> = [];

    if (stats.pending > 25) {
      alerts.push({
        title: "Approval backlog rising",
        detail: `${stats.pending} requests awaiting HR head decisions`,
        tone: "warning",
      });
    }

    if (stats.returned > 5) {
      alerts.push({
        title: "High return rate",
        detail: `${stats.returned} requests need employee fixes`,
        tone: "critical",
      });
    }

    if (stats.complianceScore < 90) {
      alerts.push({
        title: "Compliance below target",
        detail: `Score is ${stats.complianceScore}% (target 95%)`,
        tone: "warning",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: "Healthy pipeline",
        detail: "Approvals and compliance look good.",
        tone: "info",
      });
    }

    return alerts;
  }, [stats]);

  return (
    <TooltipProvider>
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
                title={
                  <div className="flex items-center gap-2">
                    <span>Your Approval Queue</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about your approval queue"
                          className="hover:opacity-70 transition-opacity"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">What this shows:</p>
                        <p className="text-sm mb-2">
                          Leave requests awaiting YOUR approval as HR Head. This is your personal work queue.
                        </p>
                        <p className="text-sm font-semibold mb-1">Why it matters:</p>
                        <p className="text-sm mb-2">
                          Employees are waiting for you to review and approve/reject their leave requests. This is the same data shown in the "Pending Approvals" table below.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Calculation: Counts approvals where you are the approver and decision is still PENDING.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                }
                value={stats?.pending || 0}
                subtitle="Awaiting your decision"
                icon={Clock}
                role="HR_HEAD"
                trend={stats && stats.pending > 10 ? {
                  value: stats.pending - 10,
                  label: "above normal",
                  direction: "up"
                } : undefined}
                onClick={() => document.getElementById("pending-approvals")?.scrollIntoView({ behavior: "smooth" })}
                clickLabel="Jump to approval queue"
              />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>On Leave Today</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about employees on leave"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Number of employees currently on approved leave today across the entire organization.
                      </p>
                      <p className="text-sm font-semibold mb-1">Why it matters:</p>
                      <p className="text-sm mb-2">
                        Helps you monitor workforce availability. High numbers may indicate capacity issues or seasonal patterns.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Calculation: Counts approved leaves where today falls between start and end date.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={stats?.onLeave || 0}
              subtitle={`Out of ${stats?.totalEmployees || 0} employees`}
              icon={Users}
              role="HR_HEAD"
            />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>Returned for Modification</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about returned requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Leave requests sent back to employees by you or other approvers for corrections or additional information.
                      </p>
                      <p className="text-sm font-semibold mb-1">What to do:</p>
                      <p className="text-sm mb-2">
                        Monitor this metric. High numbers may indicate unclear policies, poor communication, or training gaps.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: Keep below 10% of total submissions for efficient processing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
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
              title={
                <div className="flex items-center gap-2">
                  <span>Upcoming Leaves</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about upcoming leaves"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Approved leave requests scheduled to start in the next 7 days across all departments.
                      </p>
                      <p className="text-sm font-semibold mb-1">Why it matters:</p>
                      <p className="text-sm mb-2">
                        Helps you forecast workforce availability and identify potential capacity constraints.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Use this to coordinate with department heads about upcoming absences.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={stats?.upcoming || 0}
              subtitle={`Next 7 days (${stats?.totalEmployees ? Math.round(((stats?.upcoming || 0) / stats.totalEmployees) * 100) : 0}% of workforce)`}
              icon={Calendar}
              role="HR_HEAD"
              onClick={() => window.location.href = "/calendar"}
              clickLabel="View leave calendar"
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
              title={
                <div className="flex items-center gap-2">
                  <span>This Month</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about monthly requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Total number of leave requests submitted organization-wide this month, regardless of status.
                      </p>
                      <p className="text-sm font-semibold mb-1">Why it matters:</p>
                      <p className="text-sm mb-2">
                        Tracks overall leave request volume. Spikes may indicate seasonal patterns, organizational changes, or upcoming holidays.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Use this to forecast HR workload and resource planning.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={stats?.monthlyRequests || 0}
              subtitle="Total requests submitted"
              icon={Activity}
              role="HR_HEAD"
            />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>New Hires</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about new hires"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Number of new employees who joined the organization this month.
                      </p>
                      <p className="text-sm font-semibold mb-1">Action required:</p>
                      <p className="text-sm mb-2">
                        Ensure new hires are onboarded to the leave system, understand leave policies, and have their balances properly initialized.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        New employees typically need leave policy training within first week.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
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
                      value: stats.complianceScore >= 95 ? 5 : -5,
                      label: "vs target",
                      direction: stats.complianceScore >= 95 ? "up" : "down",
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
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-4 sm:space-y-6">
            <Card className="surface-card" id="pending-approvals">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Pending Approvals</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Awaiting HR head action
                    </p>
                  </div>
                  {!isLoading && stats && stats.pending > 0 && (
                    <ExportButton
                      data={[]}
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

            {!isLoading &&
              stats &&
              stats.departments &&
              stats.departments.length > 0 && (
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

          <div className="shrink-0 space-y-4 sm:space-y-6">
            <InsightsPanel items={insightItems} isLoading={isLoading} />
            <AlertsPanel alerts={alertItems} isLoading={isLoading} />
            <ActivityPanel activities={stats?.recentActivity || []} isLoading={isLoading} />
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
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">Returned for Modification</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnedRequestsPanel />
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<DashboardCardSkeleton />}>
          <Card className="surface-card">
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
    </TooltipProvider>
  );
}

function InsightsPanel({
  items,
  isLoading,
}: {
  items: Array<{ label: string; value: string | number; helper: string }>;
  isLoading?: boolean;
}) {
  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Organization Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))
          : items.map((item) => (
              <div key={item.label} className="rounded-xl border border-border/60 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.helper}</p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

function AlertsPanel({
  alerts,
  isLoading,
}: {
  alerts: Array<{ title: string; detail: string; tone: "info" | "warning" | "critical" }>;
  isLoading?: boolean;
}) {
  const toneClasses: Record<"info" | "warning" | "critical", string> = {
    info: "border-emerald-200/60 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-200/60 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    critical: "border-red-200/60 bg-red-500/5 text-red-600 dark:text-red-400",
  };

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))
          : alerts.map((alert, idx) => (
              <div
                key={`${alert.title}-${idx}`}
                className={`rounded-xl border px-3 py-2 text-sm ${toneClasses[alert.tone]}`}
              >
                <p className="font-semibold">{alert.title}</p>
                <p className="text-xs opacity-80">{alert.detail}</p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

function ActivityPanel({
  activities,
  isLoading,
}: {
  activities: HRHeadStats["recentActivity"];
  isLoading?: boolean;
}) {
  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 w-full bg-muted animate-pulse rounded" />
            <div className="h-16 w-full bg-muted animate-pulse rounded" />
            <div className="h-16 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="rounded-xl border border-border/60 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.approver}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action === "APPROVED" ? "Approved" : "Rejected"}{" "}
                      {activity.employee}&rsquo;s {activity.leaveType}
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
  );
}
