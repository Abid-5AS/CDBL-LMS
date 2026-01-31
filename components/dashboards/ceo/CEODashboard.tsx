"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
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
  BarChart3
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Shared Patterns
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import { ResponsiveDashboardGrid, DashboardSection } from "../shared/ResponsiveDashboardGrid";
import { KPIGridSkeleton } from "@/components/shared/skeletons";
import { Role } from "@/lib/enums";
import { useUser } from "@/lib";

// Reusing shared analytics charts if they are generic enough, otherwise we might need to inline or adapt
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
} from "@/components/dashboards/shared";

interface CEOStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  utilizationRate: number;
  pendingApprovals: number;
  avgApprovalTime: number;
  complianceScore: number;
  criticalRequests: number;
  totalLeaveDays: number;
  estimatedCost: number;
  avgCostPerDay: number;
  thisYear: { requests: number; days: number };
  lastYear: { requests: number; days: number };
  yoyGrowth: number;
  leaveTypes: Array<{ type: string; count: number; days: number }>;
  departments: Array<{ name: string; employees: number }>;
  monthlyTrend: Array<{ month: string; requests: number; days: number }>;
  insights: Array<{ type: string; priority: string; message: string }>;
  meta?: {
    mocked?: {
      avgCostPerDay?: boolean;
      estimatedCost?: boolean;
      insights?: boolean;
      systemHealth?: boolean;
    };
  };
}

export function CEODashboard() {
  const user = useUser();
  const router = useRouter();

  const { data: stats, isLoading } = useSWR<CEOStats>(
    "/api/dashboard/ceo/stats",
    apiFetcher,
    { refreshInterval: 60000 }
  );

  const mocked = stats?.meta?.mocked ?? {};
  const hasMockedData = Object.values(mocked).some(Boolean);

  // Fallback/Safety
  const safeStats = useMemo(() => stats || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    utilizationRate: 0,
    pendingApprovals: 0,
    avgApprovalTime: 0,
    complianceScore: 100,
    criticalRequests: 0,
    totalLeaveDays: 0,
    estimatedCost: 0,
    avgCostPerDay: 0,
    thisYear: { requests: 0, days: 0 },
    lastYear: { requests: 0, days: 0 },
    yoyGrowth: 0,
    leaveTypes: [],
    departments: [],
    monthlyTrend: [],
    insights: []
  }, [stats]);

  return (
    <RoleBasedDashboard
      role={Role.CEO}
      title="Executive Overview"
      description="Strategic insights and organization-wide leave metrics"
      animate={true}
      backgroundVariant="transparent"
    >
      {hasMockedData && (
        <div className="fixed bottom-4 right-4 z-50">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            Mock data
          </Badge>
        </div>
      )}
      <div className="space-y-8">
        {/* KPI Grid */}
        <DashboardSection
          title="Key Metrics"
          description="Performance indicators"
          loadingFallback={<KPIGridSkeleton />}
        >
          <ResponsiveDashboardGrid columns="1:2:4:4" gap="md">
            {/* 1. Workforce Availability */}
            <RoleKPICard
              title="Availability"
              value={`${safeStats.utilizationRate}%`}
              subtitle={`${safeStats.onLeaveToday} on leave today`}
              icon={Activity}
              role={Role.CEO}
              tooltip="Percentage of active workforce available today"
              trend={{
                value: safeStats.utilizationRate >= 90 ? 2 : -2,
                direction: safeStats.utilizationRate >= 90 ? "up" : "down",
                label: "vs target"
              }}
            />

            {/* 2. Total Workforce */}
            <RoleKPICard
              title="Total Workforce"
              value={safeStats.totalEmployees}
              subtitle={`${safeStats.activeEmployees} active accounts`}
              icon={Users}
              role={Role.CEO}
              color="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            {/* 3. Pending Approvals */}
            <RoleKPICard
              title="Pending Approvals"
              value={safeStats.pendingApprovals}
              subtitle={`${safeStats.avgApprovalTime.toFixed(1)}d avg time`}
              icon={Clock}
              role={Role.CEO}
              variant={safeStats.pendingApprovals > 5 ? "highlight" : "default"}
              onClick={() => router.push("/approvals")}
              clickLabel="View pending approvals"
            />

            {/* 4. Compliance */}
            <RoleKPICard
              title="Compliance"
              value={`${safeStats.complianceScore}%`}
              subtitle="Policy adherence"
              icon={Shield}
              role={Role.CEO}
              color={safeStats.complianceScore >= 95 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}
              bgColor={safeStats.complianceScore >= 95 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50"}
            />
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Main Content Details */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column: Charts and Analysis (8 cols) */}
          <div className="xl:col-span-8 space-y-6">

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Leave Request Trends
                </CardTitle>
                <CardDescription>12-month historical view of request volume</CardDescription>
              </CardHeader>
              <CardContent>
                {safeStats.monthlyTrend.length > 0 ? (
                  <AnalyticsLineChart
                    data={safeStats.monthlyTrend.map(item => ({
                      name: item.month,
                      requests: item.requests,
                      days: item.days,
                    }))}
                    dataKeys={[
                      { key: "requests", name: "Requests", color: "hsl(var(--primary))" },
                      { key: "days", name: "Total Days", color: "hsl(var(--muted-foreground))" },
                    ]}
                    xAxisKey="name"
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Scorecard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Department Scorecard</CardTitle>
                <CardDescription>Headcount and utilization by department</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Headcount</TableHead>
                      <TableHead>On Leave (Est)</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeStats.departments.map((dept, index) => {
                      const estimatedOnLeave = Math.round(
                        (safeStats.onLeaveToday / safeStats.totalEmployees) * dept.employees
                      ) || 0;
                      const utilization = dept.employees > 0
                        ? Math.round(((dept.employees - estimatedOnLeave) / dept.employees) * 100)
                        : 100;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.employees}</TableCell>
                          <TableCell>{estimatedOnLeave}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="w-20 h-2" />
                              <span className={utilization < 85 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                {utilization}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {safeStats.departments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No department data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Insights & Financials (4 cols) */}
          <div className="xl:col-span-4 space-y-6">

            {/* Strategic Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  Strategic Alerts
                </CardTitle>
                {mocked.insights && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
                    Mock
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {safeStats.insights.length > 0 ? (
                  safeStats.insights.map((insight, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border text-sm ${insight.priority === 'high'
                      ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-200'
                      : 'bg-muted/50 border-border text-foreground'
                      }`}>
                      {insight.message}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No active alerts at this time.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Financial Impact
                </CardTitle>
                <CardDescription>Estimated leave costs YTD</CardDescription>
                {(mocked.avgCostPerDay || mocked.estimatedCost) && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
                    Mock
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-3xl font-bold tracking-tight text-foreground">
                    ${(safeStats.estimatedCost / 1000).toFixed(1)}K
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on avg daily rate
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Leave Days</span>
                    <span className="font-semibold">{safeStats.totalLeaveDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avg Cost/Day</span>
                    <span className="font-semibold">
                      ${safeStats.totalLeaveDays > 0 ? (safeStats.estimatedCost / safeStats.totalLeaveDays).toFixed(0) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* YoY Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Year-over-Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold tracking-tight">
                      {safeStats.yoyGrowth > 0 ? "+" : ""}{safeStats.yoyGrowth}%
                    </div>
                    <p className="text-xs text-muted-foreground">vs last year</p>
                  </div>
                  <Badge variant={safeStats.yoyGrowth > 10 ? "destructive" : "secondary"}>
                    {safeStats.yoyGrowth > 10 ? "High Growth" : "Normal"}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Current Year</span>
                    <span className="font-medium text-foreground">{safeStats.thisYear.requests} reqs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Year</span>
                    <span className="font-medium text-foreground">{safeStats.lastYear.requests} reqs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </RoleBasedDashboard>
  );
}
