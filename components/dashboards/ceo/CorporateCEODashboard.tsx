"use client";

import * as React from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  AlertCircle,
  Shield,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { METRIC_LABELS } from "@/constants/dashboard-labels";

// Corporate components
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography } from "@/lib/ui/density-modes";

// Shared chart components (reusable with corporate styling)
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
} from "@/components/dashboards/shared";

interface CEOStats {
  // Organization metrics
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  utilizationRate: number;

  // Performance metrics
  pendingApprovals: number;
  avgApprovalTime: number;
  complianceScore: number;
  criticalRequests: number;

  // Financial metrics
  totalLeaveDays: number;
  estimatedCost: number;
  avgCostPerDay: number;

  // Year-over-year comparison
  thisYear: {
    requests: number;
    days: number;
  };
  lastYear: {
    requests: number;
    days: number;
  };
  yoyGrowth: number;

  // Analytics
  leaveTypes: Array<{
    type: string;
    count: number;
    days: number;
  }>;

  departments: Array<{
    name: string;
    employees: number;
  }>;

  monthlyTrend: Array<{
    month: string;
    requests: number;
    days: number;
  }>;

  // Strategic Alerts
  insights: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
}

/**
 * Corporate CEO Dashboard
 *
 * Design Philosophy: "Comfortable" density mode
 * - Executive-level view with strategic insights
 * - Clean, professional design without gradients
 * - Focus on high-level metrics and trends
 *
 * Features Preserved:
 * ✅ 4 Executive KPI Cards (Workforce, Utilization, Approvals, Compliance)
 * ✅ All tooltips with strategic insights
 * ✅ Monthly Leave Trend Chart
 * ✅ Department Headcount Chart
 * ✅ Leave Type Distribution (Pie Chart + Details)
 * ✅ Strategic Alerts panel
 * ✅ Financial Summary card
 * ✅ Department Scorecard table
 * ✅ Year-over-Year comparison cards
 *
 * What Changed:
 * ❌ No rounded-2xl (now rounded-md)
 * ❌ No glassmorphism effects
 * ✅ Corporate MetricCard components
 * ✅ Solid white cards with slate borders
 * ✅ Comfortable density (p-6 cards, larger text)
 */
export function CorporateCEODashboard() {
  const { data: stats, isLoading, error } = useSWR<CEOStats>(
    "/api/dashboard/ceo/stats",
    apiFetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const density = "comfortable"; // CEO uses comfortable density
  const densityClasses = getDensityClasses(density);
  const typography = getTypography(density);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-600" />
        <p className="text-sm text-red-700 font-medium">
          Failed to load executive dashboard
        </p>
        <p className="text-xs text-red-600 mt-1">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  // Helper to map API insight types to UI styles
  const getInsightStyle = (type: string, priority: string) => {
    if (priority === "high")
      return "bg-amber-50 border-amber-200 text-amber-700";
    if (type === "efficiency" || type === "success")
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    return "bg-blue-50 border-blue-200 text-blue-700";
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Corporate Header */}
        <div className="mb-6">
          <h1 className={cn(typography.pageTitle, "mb-1")}>
            Executive Dashboard
          </h1>
          <p className={cn(typography.label, "!normal-case")}>
            Strategic overview and organizational insights
          </p>
        </div>

        {/* Main Content */}
        <div className={densityClasses.section}>
          {/* Section 1: Executive KPIs (4 Cards) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Executive Overview</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Key organizational and performance metrics at a glance
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-6">
                      <div className="h-20 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Total Workforce */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.TOTAL_WORKFORCE}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about total workforce"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">What this shows:</p>
                          <p className="text-sm mb-2">
                            Total number of employees across the entire organization, including all departments and roles.
                          </p>
                          <p className="text-sm font-semibold mb-1">Strategic insight:</p>
                          <p className="text-sm mb-2">
                            Core organizational capacity metric. Track growth trends and plan for scaling HR resources accordingly.
                          </p>
                          <p className="text-xs text-slate-500">
                            "Active" count excludes system/admin accounts.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.totalEmployees || 0}
                  subtitle={`${stats?.activeEmployees || 0} active`}
                  icon={Users}
                  density={density}
                />

                {/* KPI 2: Workforce Availability */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.WORKFORCE_AVAILABILITY}</span>
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
                            Number of employees on approved leave today, with workforce utilization percentage.
                          </p>
                          <p className="text-sm font-semibold mb-1">Strategic impact:</p>
                          <p className="text-sm mb-2">
                            Low utilization (below 85%) may indicate operational risks, seasonal patterns, or organizational issues requiring attention.
                          </p>
                          <p className="text-xs text-slate-500">
                            Target: Maintain 90%+ utilization for optimal operations.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={`${stats?.utilizationRate || 0}%`}
                  subtitle={`${stats?.onLeaveToday || 0} on leave`}
                  icon={Activity}
                  density={density}
                  trend={
                    stats && stats.utilizationRate
                      ? {
                          value: stats.utilizationRate >= 90 ? "+3%" : "-2%",
                          direction: stats.utilizationRate >= 90 ? "up" : "down",
                        }
                      : undefined
                  }
                />

                {/* KPI 3: Pending Approvals */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.PENDING_APPROVALS}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about pending approvals"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">What this shows:</p>
                          <p className="text-sm mb-2">
                            Leave requests awaiting YOUR approval as CEO, typically escalated cases requiring executive decision.
                          </p>
                          <p className="text-sm font-semibold mb-1">Why this matters:</p>
                          <p className="text-sm mb-2">
                            High backlog indicates bottleneck at executive level. Avg approval time tracks organizational efficiency.
                          </p>
                          <p className="text-xs text-slate-500">
                            Target: Process within 2-3 days to avoid employee frustration.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={stats?.pendingApprovals || 0}
                  subtitle={`${stats?.avgApprovalTime?.toFixed(1) || 0}d avg time`}
                  icon={Clock}
                  density={density}
                  trend={
                    stats && stats.pendingApprovals > 20
                      ? {
                          value: `+${stats.pendingApprovals - 20}`,
                          direction: "up",
                        }
                      : undefined
                  }
                />

                {/* KPI 4: Compliance Score */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>Compliance Score</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about compliance score"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">What this shows:</p>
                          <p className="text-sm mb-2">
                            Percentage of leave requests processed within policy guidelines and SLA targets.
                          </p>
                          <p className="text-sm font-semibold mb-1">Executive concern:</p>
                          <p className="text-sm mb-2">
                            Low scores (below 90%) indicate process inefficiencies, policy violations, or training gaps that need executive intervention.
                          </p>
                          <p className="text-xs text-slate-500">
                            Target: Maintain 95%+ for regulatory compliance and employee satisfaction.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={`${stats?.complianceScore || 0}%`}
                  subtitle="Policy adherence"
                  icon={Shield}
                  density={density}
                  trend={
                    stats && stats.complianceScore
                      ? {
                          value: stats.complianceScore >= 90 ? "+2%" : "+1%",
                          direction: stats.complianceScore >= 90 ? "up" : "down",
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </section>

          {/* Section 2: Analytics & Trends */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Analytics & Trends</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Visual insights, department performance, and leave patterns
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
              {/* Main Charts Section (Left - 2/3 width) */}
              {!isLoading && stats && (
                <div className="flex-1 space-y-6 min-w-0">
                  {/* Monthly Trend Chart */}
                  {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
                    <CorporateAnalyticsLineChart
                      title="Leave Request Trend"
                      subtitle="12-month historical view"
                      data={stats.monthlyTrend.map((item) => ({
                        name: item.month,
                        requests: item.requests,
                        days: item.days,
                      }))}
                      dataKeys={[
                        { key: "requests", name: "Requests", color: "hsl(var(--chart-1))" },
                        { key: "days", name: "Total Days", color: "hsl(var(--chart-2))" },
                      ]}
                      xAxisKey="name"
                    />
                  )}

                  {/* Department Headcount */}
                  {stats.departments && stats.departments.length > 0 && (
                    <CorporateAnalyticsBarChart
                      title="Department Headcount"
                      subtitle="Total employees by department"
                      data={stats.departments.map((dept) => ({
                        name: dept.name,
                        employees: dept.employees,
                      }))}
                      dataKeys={[
                        { key: "employees", name: "Employees", color: "hsl(var(--chart-1))" },
                      ]}
                      xAxisKey="name"
                    />
                  )}

                  {/* Leave Type Distribution */}
                  {stats.leaveTypes && stats.leaveTypes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <CorporateAnalyticsPieChart
                        title="Leave Type Distribution"
                        subtitle="By request count"
                        data={stats.leaveTypes.map((item) => ({
                          name: item.type,
                          value: item.count,
                        }))}
                        showPercentage={true}
                      />

                      <Card className="border-slate-200 shadow-sm rounded-md">
                        <CardHeader>
                          <CardTitle className={typography.cardTitle}>Leave Type Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {stats.leaveTypes.slice(0, 5).map((type, index) => (
                              <div key={index}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium">{type.type}</span>
                                  <span className="text-sm text-slate-500">
                                    {type.count} requests
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                  <span>Avg duration: {(type.days / (type.count || 1)).toFixed(1)} days</span>
                                </div>
                                {index < stats.leaveTypes.length - 1 && <Separator className="mt-3" />}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Sidebar - Insights & Quick Stats (Right - 1/3 width) */}
              <div className="xl:w-80 shrink-0 space-y-6">
                {/* Strategic Alerts */}
                {!isLoading && stats && stats.insights && stats.insights.length > 0 && (
                  <Card className="border-slate-200 shadow-sm rounded-md">
                    <CardHeader>
                      <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        Strategic Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats.insights.map((insight, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-3 rounded-md border text-sm",
                            getInsightStyle(insight.type, insight.priority)
                          )}
                        >
                          {insight.message}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Financial Summary */}
                {!isLoading && stats && (
                  <Card className="border-slate-200 shadow-sm rounded-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
                          <DollarSign className="h-4 w-4" />
                          Financial Summary
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="Cost methodology information"
                              className="hover:opacity-70 transition-opacity"
                            >
                              <Info className="h-4 w-4 text-slate-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm font-semibold mb-1">Methodology:</p>
                            <p className="text-sm mb-2">
                              Leave cost is estimated using average employee daily rate multiplied by total approved leave days YTD.
                            </p>
                            <p className="text-sm font-semibold mb-1">Calculation:</p>
                            <p className="text-sm mb-2">
                              Cost = (Total Leave Days × Avg Daily Rate). Daily rate assumes standard salary distribution across workforce.
                            </p>
                            <p className="text-xs text-slate-500">
                              This is an estimate. Actual cost may vary based on employee salaries and benefits.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={typography.kpiNumber}>
                          ${((stats.estimatedCost || 0) / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-slate-500">Estimated YTD cost</p>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Leave Days</span>
                          <span className="font-medium">{stats.totalLeaveDays || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">YoY Growth</span>
                          <span
                            className={cn(
                              "font-medium",
                              stats.yoyGrowth > 10 && "text-amber-600"
                            )}
                          >
                            {(stats.yoyGrowth ?? 0) > 0 ? "+" : ""}
                            {stats.yoyGrowth ?? 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Department Scorecard */}
          {!isLoading && stats && stats.departments && stats.departments.length > 0 && (
            <section>
              <div className="mb-3">
                <h2 className={typography.sectionTitle}>Department Scorecard</h2>
                <p className={cn(typography.label, "!normal-case mt-1")}>
                  Performance metrics by department
                </p>
              </div>

              <Card className="border-slate-200 shadow-sm rounded-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-700">Department</th>
                          <th className="text-left p-3 font-medium text-slate-700">Headcount</th>
                          <th className="text-left p-3 font-medium text-slate-700">On Leave</th>
                          <th className="text-left p-3 font-medium text-slate-700">Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.departments.map((dept, index) => {
                          const estimatedOnLeave = Math.round(
                            (stats.onLeaveToday / stats.totalEmployees) * dept.employees
                          );
                          const utilization =
                            dept.employees > 0
                              ? Math.round(((dept.employees - estimatedOnLeave) / dept.employees) * 100)
                              : 100;

                          return (
                            <tr
                              key={index}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-3 font-medium">{dept.name}</td>
                              <td className="p-3 text-slate-500">{dept.employees}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span>{estimatedOnLeave}</span>
                                  <span className="text-xs text-slate-400">
                                    ({((estimatedOnLeave / dept.employees) * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-full max-w-[100px]">
                                    <Progress value={utilization} className="h-2" />
                                  </div>
                                  <span
                                    className={cn(
                                      "text-xs font-medium",
                                      utilization >= 90
                                        ? "text-emerald-600"
                                        : utilization >= 85
                                        ? "text-amber-600"
                                        : "text-red-600"
                                    )}
                                  >
                                    {utilization}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                    <p>
                      Note: On Leave and Utilization are estimated based on organization-wide averages. For accurate department-specific data, contact HR.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Section 4: Financial & Strategic Details */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Financial & Strategic Details</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Detailed financial analysis and year-over-year comparisons
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-6">
                      <div className="h-32 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Financial Impact Card */}
                <Card className="border-slate-200 shadow-sm rounded-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={typography.kpiNumber}>
                        ${((stats?.estimatedCost || 0) / 1000).toFixed(1)}K
                      </p>
                      <p className="text-sm text-slate-500">Est. leave cost (YTD)</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Total Leave Days</span>
                      <span className="font-semibold">{stats?.totalLeaveDays || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Avg Cost/Day</span>
                      <span className="font-semibold">
                        $
                        {stats && stats.totalLeaveDays > 0
                          ? (stats.estimatedCost / stats.totalLeaveDays).toFixed(0)
                          : 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Year-over-Year Comparison */}
                <Card className="border-slate-200 shadow-sm rounded-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Year-over-Year Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={typography.kpiNumber}>
                          {(stats?.yoyGrowth ?? 0) > 0 ? "+" : ""}
                          {stats?.yoyGrowth ?? 0}%
                        </p>
                        <p className="text-sm text-slate-500">vs last year</p>
                      </div>
                      <Badge
                        variant={
                          stats && stats.yoyGrowth > 10
                            ? "destructive"
                            : stats && stats.yoyGrowth > 5
                            ? "secondary"
                            : "default"
                        }
                      >
                        {stats && stats.yoyGrowth > 10
                          ? "High"
                          : stats && stats.yoyGrowth > 5
                          ? "Moderate"
                          : "Normal"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">This Year</span>
                        <span className="font-semibold">
                          {stats?.thisYear?.requests || 0} requests
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Year</span>
                        <span className="font-semibold">
                          {stats?.lastYear?.requests || 0} requests
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Corporate-styled chart wrappers
 * These wrap the existing chart components with corporate styling
 */

// Corporate Line Chart (rounded-2xl → rounded-md)
function CorporateAnalyticsLineChart(props: any) {
  return <AnalyticsLineChart {...props} className="border-slate-200 shadow-sm rounded-md" />;
}

// Corporate Bar Chart (rounded-2xl → rounded-md)
function CorporateAnalyticsBarChart(props: any) {
  return <AnalyticsBarChart {...props} className="border-slate-200 shadow-sm rounded-md" />;
}

// Corporate Pie Chart (rounded-2xl → rounded-md)
function CorporateAnalyticsPieChart(props: any) {
  return <AnalyticsPieChart {...props} className="border-slate-200 shadow-sm rounded-md" />;
}
