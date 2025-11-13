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
import { motion } from "framer-motion";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  ExportButton,
} from "@/components/dashboards/shared";
import { ChartContainer, TrendChart, TypePie } from "@/components/shared/LeaveCharts";
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-data-error/20 bg-data-error/5 p-6 text-center glass-card"
      >
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-data-error" />
        <p className="text-sm text-data-error font-medium">
          Failed to load dashboard statistics
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Please try refreshing the page
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Primary KPIs */}
      <ResponsiveDashboardGrid
        columns="2:2:4:4"
        gap="md"
        animate={true}
        staggerChildren={0.1}
        delayChildren={0.1}
      >
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <>
            <RoleKPICard
              title="Employees on Leave"
              value={stats?.employeesOnLeave || 0}
              subtitle="Currently absent"
              icon={Users}
              role="HR_ADMIN"
              animate={true}
            />
            <RoleKPICard
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              subtitle="Awaiting action"
              icon={Clock}
              role="HR_ADMIN"
              animate={true}
              trend={stats && stats.pendingRequests > 15 ? {
                value: stats.pendingRequests,
                label: "needs attention",
                direction: "up"
              } : undefined}
            />
            <RoleKPICard
              title="Avg Approval Time"
              value={`${stats?.avgApprovalTime?.toFixed(1) || 0}d`}
              subtitle="Processing speed"
              icon={TrendingUp}
              role="HR_ADMIN"
              animate={true}
              trend={stats && stats.avgApprovalTime > 3 ? {
                value: Math.round((stats.avgApprovalTime - 3) * 10),
                label: "vs 3d target",
                direction: "down"
              } : stats && stats.avgApprovalTime > 0 ? {
                value: Math.round((3 - stats.avgApprovalTime) * 10),
                label: "below target",
                direction: "up"
              } : undefined}
            />
            <RoleKPICard
              title="Total Leaves (YTD)"
              value={stats?.totalLeavesThisYear || 0}
              subtitle="This year"
              icon={Calendar}
              role="HR_ADMIN"
              animate={true}
            />
          </>
        )}
      </ResponsiveDashboardGrid>

      {/* Performance Metrics */}
      <ResponsiveDashboardGrid
        columns="1:1:3:3"
        gap="md"
        animate={true}
        staggerChildren={0.1}
        delayChildren={0.2}
      >
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <Card className="glass-card rounded-2xl border-border hover:shadow-lg transition-all duration-300">
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
                      <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        {stats?.dailyProgress || 0}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={stats?.dailyProgress || 0}
                    className="h-2 bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950"
                    style={{
                      // @ts-ignore
                      "--progress-background": "linear-gradient(to right, #3b82f6, #7c3aed)"
                    }}
                  />
                  {stats && stats.dailyProgress >= 100 && (
                    <p className="text-xs text-data-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Target achieved!
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <RoleKPICard
              title="Team Utilization"
              value={`${stats?.teamUtilization || 0}%`}
              subtitle="Workforce availability"
              icon={Activity}
              role="HR_ADMIN"
              animate={true}
              trend={
                stats && stats.teamUtilization
                  ? {
                      value: stats.teamUtilization >= 85 ? 2 : 3,
                      label: "vs target",
                      direction: stats.teamUtilization >= 85 ? "up" : "down"
                    }
                  : undefined
              }
            />

            <RoleKPICard
              title="Compliance Score"
              value={`${stats?.complianceScore || 0}%`}
              subtitle="Policy adherence"
              icon={CheckCircle2}
              role="HR_ADMIN"
              animate={true}
              trend={
                stats && stats.complianceScore
                  ? {
                      value: stats.complianceScore >= 90 ? 1 : 2,
                      label: "this month",
                      direction: stats.complianceScore >= 90 ? "up" : "down"
                    }
                  : undefined
              }
            />
          </>
        )}
      </ResponsiveDashboardGrid>

      {/* Pending Requests Table - Full Width */}
      <motion.div variants={itemVariants}>
        <Suspense fallback={<DashboardCardSkeleton />}>
          <PendingLeaveRequestsTable />
        </Suspense>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charts - Left Side (8 columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          {/* Monthly Trend Chart */}
          <ChartContainer
            title="Request Trend"
            subtitle="Last 6 months submission pattern"
            loading={isLoading}
            empty={!isLoading && (!stats?.monthlyTrend || stats.monthlyTrend.length === 0)}
            height={350}
            className="hover:shadow-xl transition-all duration-300"
          >
            <TrendChart
              data={stats?.monthlyTrend?.map((item) => ({
                month: item.month,
                leaves: item.count,
              })) || []}
              height={350}
              dataKey="leaves"
            />
          </ChartContainer>
        </motion.div>

        {/* Sidebar - Right Side (4 columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Quick Stats Summary */}
          <Card className="glass-card rounded-2xl border-border hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                    <span className="text-muted-foreground">Processed Today</span>
                    <span className="font-semibold text-foreground">{stats?.processedToday || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-foreground">{stats?.pendingRequests || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                    <span className="text-muted-foreground">On Leave</span>
                    <span className="font-semibold text-foreground">{stats?.employeesOnLeave || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                    <span className="text-muted-foreground">Avg Processing</span>
                    <span className="font-semibold text-foreground">
                      {stats?.avgApprovalTime?.toFixed(1) || 0} days
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                    <span className="text-muted-foreground">Encashment Queue</span>
                    <span className="font-semibold text-foreground">{stats?.encashmentPending || 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Leave Type Distribution */}
          <ChartContainer
            title="Leave Type Distribution"
            subtitle="Current year breakdown"
            loading={isLoading}
            empty={!isLoading && (!stats?.leaveTypeBreakdown || stats.leaveTypeBreakdown.length === 0)}
            height={300}
            className="hover:shadow-xl transition-all duration-300"
          >
            <TypePie
              data={stats?.leaveTypeBreakdown?.map((item) => ({
                name: item.type,
                value: item.count,
              })) || []}
              height={300}
            />
          </ChartContainer>
        </motion.div>
      </div>

      {/* Cancellation Requests - Full Width */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card rounded-2xl hover:shadow-lg transition-all duration-300">
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
      </motion.div>
    </motion.div>
  );
}
