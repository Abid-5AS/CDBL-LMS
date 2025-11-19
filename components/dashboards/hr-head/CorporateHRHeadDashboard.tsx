"use client";

import * as React from "react";
import { Suspense, useMemo } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
  Clock,
  Users,
  RotateCcw,
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, METRIC_LABELS } from "@/constants/dashboard-labels";
import { formatDate } from "@/lib/utils";

// Corporate components
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography } from "@/lib/ui/density-modes";

// Shared chart components (with corporate styling)
import { AnalyticsBarChart } from "@/components/dashboards/shared/AnalyticsChart";

// Existing components (preserved)
import {
  PendingApprovals as PendingLeaveRequestsTable,
  CancellationRequests as CancellationRequestsPanel,
  ReturnedRequests as ReturnedRequestsPanel,
} from "@/components/dashboards";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";

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

  // Department performance analytics
  departmentPerformance: Array<{
    name: string;
    employees: number;
    pending: number;
    onLeave: number;
    avgApprovalTime: number;
  }>;

  // Escalated cases
  escalatedCases: Array<{
    id: number;
    leaveId: number;
    employeeName: string;
    department: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    workingDays: number;
    reason: string;
    submittedAt: Date;
  }>;
}

/**
 * Corporate HR Head Dashboard
 *
 * Design Philosophy: "Compact" density mode
 * - HR operational role needs data-heavy views
 * - Clean, professional design without gradients
 * - Focus on approval workflows and organizational metrics
 *
 * Features Preserved:
 * ✅ 7 KPI Cards (Pending, On Leave, Returned, Upcoming, Monthly, New Hires, Compliance)
 * ✅ All tooltips with detailed explanations
 * ✅ Department Performance Analytics (2 charts)
 * ✅ Pending Approvals Table
 * ✅ Department Headcount Chart
 * ✅ Insights Panel (organization snapshot)
 * ✅ Alerts Panel (dynamic alerts)
 * ✅ Activity Panel (recent approvals)
 * ✅ Escalated Cases Table
 * ✅ Returned Requests Panel
 * ✅ Cancellation Requests Panel
 *
 * What Changed:
 * ❌ No rounded-2xl (now rounded-md)
 * ❌ No glassmorphism effects
 * ✅ Corporate MetricCard components
 * ✅ Solid white cards with slate borders
 * ✅ Compact density (p-4 cards, smaller text)
 */
export function CorporateHRHeadDashboard() {
  const { data: stats, isLoading, error } = useSWR<HRHeadStats>(
    "/api/dashboard/hr-head/stats",
    apiFetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const density = "compact"; // HR Head uses compact density
  const densityClasses = getDensityClasses(density);
  const typography = getTypography(density);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-600" />
        <p className="text-sm text-red-700 font-medium">
          Failed to load dashboard statistics
        </p>
        <p className="text-xs text-red-600 mt-1">
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
        tone: "info",
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: "Healthy pipeline",
        detail: "Approvals are on track.",
        tone: "info",
      });
    }

    return alerts;
  }, [stats]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* Corporate Header */}
        <div className="mb-4">
          <h1 className={cn(typography.pageTitle, "mb-1")}>
            HR Head Dashboard
          </h1>
          <p className={cn(typography.label, "!normal-case")}>
            Leave management operations and organizational oversight
          </p>
        </div>

        {/* Main Content */}
        <div className={densityClasses.section}>
          {/* Section 1: Top KPI Cards (4 cards) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>HR Operations Overview</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Key metrics for leave management and HR operations
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-4">
                      <div className="h-16 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Pending Approvals */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.PENDING_APPROVALS}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about your approval queue"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            Calculation: Counts approvals where you are the approver and decision is still PENDING.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.pending || 0}
                  subtitle="Awaiting your decision"
                  icon={Clock}
                  density={density}
                  trend={
                    stats && stats.pending > 10
                      ? {
                          value: `+${stats.pending - 10}`,
                          direction: "up",
                        }
                      : undefined
                  }
                  onClick={() =>
                    document
                      .getElementById("pending-approvals")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                />

                {/* KPI 2: On Leave Today */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>On Leave</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about employees on leave"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            Calculation: Counts approved leaves where today falls between start and end date.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.onLeave || 0}
                  subtitle={`Out of ${stats?.totalEmployees || 0} employees`}
                  icon={Users}
                  density={density}
                />

                {/* KPI 3: Returned Requests */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.SENT_BACK}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about returned requests"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            Target: Keep below 10% of total submissions for efficient processing.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.returned || 0}
                  subtitle="Require employee action"
                  icon={RotateCcw}
                  density={density}
                  trend={
                    stats && stats.returned > 0
                      ? {
                          value: `${stats.returned}`,
                          direction: "neutral",
                        }
                      : undefined
                  }
                />

                {/* KPI 4: Upcoming Leaves */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>Upcoming Leaves</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about upcoming leaves"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            Use this to coordinate with department heads about upcoming absences.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.upcoming || 0}
                  subtitle={`Next 7 days (${
                    stats?.totalEmployees
                      ? Math.round(((stats?.upcoming || 0) / stats.totalEmployees) * 100)
                      : 0
                  }%)`}
                  icon={Calendar}
                  density={density}
                  onClick={() => (window.location.href = "/calendar")}
                />
              </div>
            )}
          </section>

          {/* Section 2: Department Performance Analytics */}
          {!isLoading &&
            stats &&
            stats.departmentPerformance &&
            stats.departmentPerformance.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className={typography.sectionTitle}>
                    Department Performance Analytics
                  </h2>
                  <p className={cn(typography.label, "!normal-case mt-1")}>
                    Pending requests and approval times by department
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <CorporateAnalyticsBarChart
                    title="Pending by Department"
                    subtitle="Current pending requests per department"
                    data={stats.departmentPerformance.map((dept) => ({
                      name: dept.name,
                      pending: dept.pending,
                    }))}
                    dataKeys={[{ key: "pending", name: "Pending", color: "#f59e0b" }]}
                    xAxisKey="name"
                  />
                  <CorporateAnalyticsBarChart
                    title="Approval Time by Department"
                    subtitle="Average approval time in days"
                    data={stats.departmentPerformance.map((dept) => ({
                      name: dept.name,
                      avgTime: dept.avgApprovalTime,
                    }))}
                    dataKeys={[{ key: "avgTime", name: "Avg Days", color: "#3b82f6" }]}
                    xAxisKey="name"
                  />
                </div>
              </section>
            )}

          {/* Section 3: Performance & Compliance (3 KPIs) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Performance & Compliance</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Monthly metrics, compliance tracking, and new hires
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-4">
                      <div className="h-16 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* KPI 5: This Month */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>This Month</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about monthly requests"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            Use this to forecast HR workload and resource planning.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.monthlyRequests || 0}
                  subtitle="Total requests submitted"
                  icon={Activity}
                  density={density}
                />

                {/* KPI 6: New Hires */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>New Hires</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about new hires"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
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
                          <p className="text-xs text-slate-500">
                            New employees typically need leave policy training within first week.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.newHires || 0}
                  subtitle="Joined this month"
                  icon={Users}
                  density={density}
                  trend={
                    stats && stats.newHires > 0
                      ? {
                          value: `${stats.newHires}`,
                          direction: "up",
                        }
                      : undefined
                  }
                />

                {/* KPI 7: Policy Compliance */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>Policy Compliance</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about policy compliance"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">What this shows:</p>
                          <p className="text-sm mb-2">
                            Percentage of leave requests processed within the target timeframe (≤3 days from submission to decision).
                          </p>
                          <p className="text-sm font-semibold mb-1">Why it matters:</p>
                          <p className="text-sm mb-2">
                            High compliance (≥90%) indicates efficient processing. Low scores suggest bottlenecks or delays that frustrate employees.
                          </p>
                          <p className="text-xs text-slate-500">
                            Calculation: (Requests decided within 3 days / Total processed this month) × 100%
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={`${stats?.complianceScore || 0}%`}
                  subtitle="On-time processing rate"
                  icon={CheckCircle2}
                  density={density}
                  trend={
                    stats && stats.complianceScore >= 90
                      ? {
                          value: `+${stats.complianceScore - 90}%`,
                          direction: "up",
                        }
                      : stats && stats.complianceScore > 0
                      ? {
                          value: `-${90 - stats.complianceScore}%`,
                          direction: "down",
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </section>

          {/* Section 4: Approvals & Analytics */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Approvals & Analytics</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Pending approvals, department performance, and organization metrics
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              {/* Left Column: Pending Approvals + Department Chart */}
              <div className="space-y-4">
                <Card className="border-slate-200 shadow-sm rounded-md" id="pending-approvals">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className={typography.cardTitle}>Pending Approvals</CardTitle>
                        <p className={cn(typography.label, "!normal-case mt-1")}>
                          Awaiting HR head action
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<DashboardCardSkeleton />}>
                      <PendingLeaveRequestsTable />
                    </Suspense>
                  </CardContent>
                </Card>

                {!isLoading && stats && stats.departments && stats.departments.length > 0 && (
                  <CorporateAnalyticsBarChart
                    title="Department Headcount"
                    subtitle="Employees by department"
                    data={stats.departments.map((dept) => ({
                      name: dept.name,
                      employees: dept.employees,
                    }))}
                    dataKeys={[{ key: "employees", name: "Employees", color: "#3b82f6" }]}
                    xAxisKey="name"
                  />
                )}
              </div>

              {/* Right Column: Insights, Alerts, Activity */}
              <div className="shrink-0 space-y-4">
                <InsightsPanel items={insightItems} isLoading={isLoading} density={density} />
                <AlertsPanel alerts={alertItems} isLoading={isLoading} density={density} />
                <ActivityPanel
                  activities={stats?.recentActivity || []}
                  isLoading={isLoading}
                  density={density}
                />
              </div>
            </div>
          </section>

          {/* Section 5: Escalated Cases Table */}
          {!isLoading && stats && stats.escalatedCases && stats.escalatedCases.length > 0 && (
            <section>
              <div className="mb-3">
                <h2 className={typography.sectionTitle}>Escalated Cases</h2>
                <p className={cn(typography.label, "!normal-case mt-1")}>
                  Requests requiring HR Head approval
                </p>
              </div>

              <Card className="border-slate-200 shadow-sm rounded-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-700">Employee</th>
                          <th className="text-left p-3 font-medium text-slate-700">Department</th>
                          <th className="text-left p-3 font-medium text-slate-700">Type</th>
                          <th className="text-left p-3 font-medium text-slate-700">Dates</th>
                          <th className="text-left p-3 font-medium text-slate-700">Days</th>
                          <th className="text-left p-3 font-medium text-slate-700">Reason</th>
                          <th className="text-left p-3 font-medium text-slate-700">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.escalatedCases.map((escalation) => (
                          <tr
                            key={escalation.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3">
                              <a
                                href={`/leaves/${escalation.leaveId}`}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {escalation.employeeName}
                              </a>
                            </td>
                            <td className="p-3 text-slate-500">{escalation.department}</td>
                            <td className="p-3 font-medium">{escalation.leaveType}</td>
                            <td className="p-3 text-slate-500 text-xs">
                              {formatDate(escalation.startDate.toString())} →{" "}
                              {formatDate(escalation.endDate.toString())}
                            </td>
                            <td className="p-3">{escalation.workingDays}</td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">
                              {escalation.reason}
                            </td>
                            <td className="p-3 text-slate-500 text-xs">
                              {formatDate(escalation.submittedAt.toString())}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Section 6: Additional Requests (Returned & Cancelled) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Additional Requests</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Returned and cancelled leave requests
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Suspense fallback={<DashboardCardSkeleton />}>
                <Card className="border-slate-200 shadow-sm rounded-md">
                  <CardHeader>
                    <CardTitle className={typography.cardTitle}>
                      {METRIC_LABELS.SENT_BACK}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReturnedRequestsPanel />
                  </CardContent>
                </Card>
              </Suspense>

              <Suspense fallback={<DashboardCardSkeleton />}>
                <Card className="border-slate-200 shadow-sm rounded-md">
                  <CardHeader>
                    <CardTitle className={typography.cardTitle}>
                      {METRIC_LABELS.CANCELLED_REQUESTS}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CancellationRequestsPanel />
                  </CardContent>
                </Card>
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Corporate Insights Panel
 */
function InsightsPanel({
  items,
  isLoading,
  density = "compact",
}: {
  items: Array<{ label: string; value: string | number; helper: string }>;
  isLoading?: boolean;
  density?: "comfortable" | "compact";
}) {
  const typography = getTypography(density);

  return (
    <Card className="border-slate-200 shadow-sm rounded-md">
      <CardHeader>
        <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
          <TrendingUp className="h-4 w-4" />
          Organization Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-md bg-slate-100 animate-pulse" />
            ))
          : items.map((item) => (
              <div key={item.label} className="rounded-md border border-slate-200 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500">{item.helper}</p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

/**
 * Corporate Alerts Panel
 */
function AlertsPanel({
  alerts,
  isLoading,
  density = "compact",
}: {
  alerts: Array<{ title: string; detail: string; tone: "info" | "warning" | "critical" }>;
  isLoading?: boolean;
  density?: "comfortable" | "compact";
}) {
  const typography = getTypography(density);

  const toneClasses: Record<"info" | "warning" | "critical", string> = {
    info: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    critical: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-md">
      <CardHeader>
        <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
          <Clock className="h-4 w-4" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-md bg-slate-100 animate-pulse" />
            ))
          : alerts.map((alert, idx) => (
              <div
                key={`${alert.title}-${idx}`}
                className={`rounded-md border px-3 py-2 text-sm ${toneClasses[alert.tone]}`}
              >
                <p className="font-semibold">{alert.title}</p>
                <p className="text-xs opacity-80">{alert.detail}</p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

/**
 * Corporate Activity Panel
 */
function ActivityPanel({
  activities,
  isLoading,
  density = "compact",
}: {
  activities: HRHeadStats["recentActivity"];
  isLoading?: boolean;
  density?: "comfortable" | "compact";
}) {
  const typography = getTypography(density);

  return (
    <Card className="border-slate-200 shadow-sm rounded-md">
      <CardHeader>
        <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 w-full bg-slate-100 animate-pulse rounded" />
            <div className="h-16 w-full bg-slate-100 animate-pulse rounded" />
            <div className="h-16 w-full bg-slate-100 animate-pulse rounded" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="rounded-md border border-slate-200 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.approver}</p>
                    <p className="text-xs text-slate-500">
                      {activity.action === "APPROVED" ? "Approved" : "Rejected"}{" "}
                      {activity.employee}&rsquo;s {activity.leaveType}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(activity.decidedAt?.toString() || new Date().toString())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-6">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Corporate-styled chart wrapper
 */
function CorporateAnalyticsBarChart(props: any) {
  return <AnalyticsBarChart {...props} className="border-slate-200 shadow-sm rounded-md" />;
}
