"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  Target,
  AlertCircle,
  Briefcase,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
  ExportButton,
} from "@/components/dashboards/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
    avgDuration: number;
  }>;

  departments: Array<{
    department: string;
    onLeave: number;
    utilization: number;
  }>;

  monthlyTrend: Array<{
    month: string;
    requests: number;
    days: number;
  }>;

  // AI Insights
  insights: Array<{
    type: "info" | "warning" | "success";
    message: string;
  }>;

  // System health
  systemHealth: {
    apiStatus: "healthy" | "degraded" | "down";
    dbStatus: "healthy" | "degraded" | "down";
    uptime: number;
  };
}

export function CEODashboardClient() {
  const { data: stats, isLoading, error } = useSWR<CEOStats>(
    "/api/dashboard/ceo/stats",
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
          Failed to load executive dashboard
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Executive KPIs */}
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
              title="Total Workforce"
              value={stats?.totalEmployees || 0}
              subtitle={`${stats?.activeEmployees || 0} active`}
              icon={Users}
              role="CEO"
            />
            <RoleKPICard
              title="On Leave Today"
              value={stats?.onLeaveToday || 0}
              subtitle={`${stats?.utilizationRate || 0}% available`}
              icon={Activity}
              role="CEO"
              trend={
                stats && stats.utilizationRate
                  ? {
                      value: stats.utilizationRate >= 90 ? 3 : 2,
                      label: "vs target",
                      direction: stats.utilizationRate >= 90 ? "up" : "down"
                    }
                  : undefined
              }
            />
            <RoleKPICard
              title="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              subtitle={`${stats?.avgApprovalTime?.toFixed(1) || 0}d avg time`}
              icon={Clock}
              role="CEO"
              trend={stats && stats.pendingApprovals > 20 ? {
                value: stats.pendingApprovals - 20,
                label: "above normal",
                direction: "up"
              } : undefined}
            />
            <RoleKPICard
              title="Compliance Score"
              value={`${stats?.complianceScore || 0}%`}
              subtitle="Policy adherence"
              icon={Shield}
              role="CEO"
              trend={
                stats && stats.complianceScore
                  ? {
                      value: stats.complianceScore >= 90 ? 2 : 1,
                      label: "this quarter",
                      direction: stats.complianceScore >= 90 ? "up" : "down"
                    }
                  : undefined
              }
            />
          </>
        )}
      </ResponsiveDashboardGrid>

      {/* Financial & YoY Metrics */}
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
            {/* Financial Impact Card */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">
                    ${((stats?.estimatedCost || 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Est. leave cost (YTD)
                  </p>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Leave Days</span>
                  <span className="font-semibold">{stats?.totalLeaveDays || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Avg Cost/Day</span>
                  <span className="font-semibold">
                    ${stats && stats.totalLeaveDays > 0
                      ? ((stats.estimatedCost / stats.totalLeaveDays)).toFixed(0)
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Year-over-Year Comparison */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Year-over-Year Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">
                      {stats?.yoyGrowth > 0 ? "+" : ""}{stats?.yoyGrowth || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      vs last year
                    </p>
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
                    {stats && stats.yoyGrowth > 10 ? "High" : stats && stats.yoyGrowth > 5 ? "Moderate" : "Normal"}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Year</span>
                    <span className="font-semibold">{stats?.thisYear?.requests || 0} requests</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Year</span>
                    <span className="font-semibold">{stats?.lastYear?.requests || 0} requests</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health Card */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-data-success">
                    {stats?.systemHealth?.uptime || 99.9}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uptime (30 days)
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">API Status</span>
                    <Badge
                      variant={stats?.systemHealth?.apiStatus === "healthy" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {stats?.systemHealth?.apiStatus || "healthy"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Database</span>
                    <Badge
                      variant={stats?.systemHealth?.dbStatus === "healthy" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {stats?.systemHealth?.dbStatus || "healthy"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Charts (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Trend Chart */}
          {!isLoading && stats && stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
            <AnalyticsLineChart
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

          {/* Department Performance */}
          {!isLoading && stats && stats.departments && stats.departments.length > 0 && (
            <AnalyticsBarChart
              title="Department Utilization"
              subtitle="Workforce availability by department"
              data={stats.departments.map((dept) => ({
                name: dept.department,
                utilization: dept.utilization,
                onLeave: dept.onLeave,
              }))}
              dataKeys={[
                { key: "utilization", name: "Utilization %", color: "hsl(var(--chart-1))" },
              ]}
              xAxisKey="name"
            />
          )}

          {/* Leave Type Distribution */}
          {!isLoading && stats && stats.leaveTypes && stats.leaveTypes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnalyticsPieChart
                title="Leave Type Distribution"
                subtitle="By request count"
                data={stats.leaveTypes.map((item) => ({
                  name: item.type,
                  value: item.count,
                }))}
                showPercentage={true}
              />

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Leave Type Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.leaveTypes.slice(0, 5).map((type, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{type.type}</span>
                          <span className="text-sm text-muted-foreground">
                            {type.count} requests
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Avg duration: {type.avgDuration.toFixed(1)} days</span>
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

        {/* Right Column - Insights & Quick Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI-Powered Insights */}
          {!isLoading && stats && stats.insights && stats.insights.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-data-info" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      insight.type === "warning"
                        ? "border-data-warning/20 bg-data-warning/5"
                        : insight.type === "success"
                        ? "border-data-success/20 bg-data-success/5"
                        : "border-data-info/20 bg-data-info/5"
                    )}
                  >
                    <div className="flex gap-2">
                      {insight.type === "warning" && (
                        <AlertCircle className="h-4 w-4 text-data-warning flex-shrink-0 mt-0.5" />
                      )}
                      {insight.type === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-data-success flex-shrink-0 mt-0.5" />
                      )}
                      {insight.type === "info" && (
                        <Sparkles className="h-4 w-4 text-data-info flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-xs leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Executive Summary
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
                    <span className="text-muted-foreground">Workforce Size</span>
                    <span className="font-semibold">{stats?.totalEmployees || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Utilization Rate</span>
                    <span className="font-semibold">{stats?.utilizationRate || 0}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Avg Approval Time</span>
                    <span className="font-semibold">
                      {stats?.avgApprovalTime?.toFixed(1) || 0} days
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Critical Requests</span>
                    <span className="font-semibold text-data-error">
                      {stats?.criticalRequests || 0}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">YTD Leave Days</span>
                    <span className="font-semibold">{stats?.totalLeaveDays || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Est. Cost</span>
                    <span className="font-semibold">
                      ${((stats?.estimatedCost || 0) / 1000).toFixed(1)}K
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/admin"
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Open Admin Console
              </a>
              {!isLoading && stats && (
                <ExportButton
                  data={[
                    {
                      metric: "Total Employees",
                      value: stats.totalEmployees,
                    },
                    {
                      metric: "On Leave Today",
                      value: stats.onLeaveToday,
                    },
                    {
                      metric: "Utilization Rate",
                      value: `${stats.utilizationRate}%`,
                    },
                    {
                      metric: "Pending Approvals",
                      value: stats.pendingApprovals,
                    },
                    {
                      metric: "Compliance Score",
                      value: `${stats.complianceScore}%`,
                    },
                    {
                      metric: "YoY Growth",
                      value: `${stats.yoyGrowth}%`,
                    },
                    {
                      metric: "Total Leave Days (YTD)",
                      value: stats.totalLeaveDays,
                    },
                    {
                      metric: "Estimated Cost",
                      value: `$${stats.estimatedCost}`,
                    },
                  ]}
                  filename="executive-summary"
                  title="Executive Dashboard Summary"
                  formats={["csv", "pdf"]}
                  size="sm"
                  className="w-full"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
