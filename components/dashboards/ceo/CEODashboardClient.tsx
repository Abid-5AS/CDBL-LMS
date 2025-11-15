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
  DashboardSection,
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
  ExportButton,
} from "@/components/dashboards/shared";
import { DashboardGridSkeleton } from "@/components/shared/skeletons";
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
      <DashboardSection
        title="Executive Overview"
        description="Key organizational and performance metrics at a glance"
        isLoading={false}
        loadingFallback={<DashboardGridSkeleton cards={4} />}
      >
        {isLoading ? (
          <DashboardGridSkeleton cards={4} />
        ) : (
          <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
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
          </ResponsiveDashboardGrid>
        )}
      </DashboardSection>

      {/* Analytics & Insights - MOVED UP (Priority for strategic decision making) */}
      <DashboardSection
        title="Analytics & Trends"
        description="Visual insights, department performance, and leave patterns"
        isLoading={isLoading}
      >
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        {/* Main Charts Section */}
        {!isLoading && stats && (stats.monthlyTrend?.length > 0 || stats.departments?.length > 0 || stats.leaveTypes?.length > 0) && (
          <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
            {/* Monthly Trend Chart */}
            {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
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
            {stats.departments && stats.departments.length > 0 && (
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
            {stats.leaveTypes && stats.leaveTypes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
        )}

        {/* Sidebar - Insights & Quick Stats */}
        <div className="xl:w-80 shrink-0 space-y-4 sm:space-y-6">
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
                      "p-3 rounded-lg border text-sm",
                      insight.type === "warning" &&
                        "bg-data-warning/10 border-data-warning/30 text-data-warning",
                      insight.type === "success" &&
                        "bg-data-success/10 border-data-success/30 text-data-success",
                      insight.type === "info" &&
                        "bg-data-info/10 border-data-info/30 text-data-info"
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
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold">
                    ${((stats.estimatedCost || 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">Estimated YTD cost</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leave Days</span>
                    <span className="font-medium">{stats.totalLeaveDays || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">YoY Growth</span>
                    <span className={cn("font-medium", stats.yoyGrowth > 10 && "text-data-warning")}>
                      {(stats.yoyGrowth ?? 0) > 0 ? "+" : ""}{stats.yoyGrowth ?? 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health Monitor */}
          {!isLoading && stats?.systemHealth && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-lg font-bold text-data-success">
                    {stats.systemHealth.uptime || 99.9}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API</span>
                  <Badge
                    variant={stats.systemHealth.apiStatus === "healthy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stats.systemHealth.apiStatus || "healthy"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <Badge
                    variant={stats.systemHealth.dbStatus === "healthy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stats.systemHealth.dbStatus || "healthy"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </DashboardSection>

      {/* Financial & Strategic Metrics - MOVED DOWN (Detail view after trends) */}
      <DashboardSection
        title="Financial & Strategic Details"
        description="Detailed financial analysis and year-over-year comparisons"
        isLoading={false}
        loadingFallback={<DashboardGridSkeleton cards={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />}
      >
        {isLoading ? (
          <DashboardGridSkeleton cards={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
        ) : (
          <ResponsiveDashboardGrid columns="1:2:3:3" gap="md">
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
                      {(stats?.yoyGrowth ?? 0) > 0 ? "+" : ""}{stats?.yoyGrowth ?? 0}%
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
          </ResponsiveDashboardGrid>
        )}
      </DashboardSection>
    </div>
  );
}
