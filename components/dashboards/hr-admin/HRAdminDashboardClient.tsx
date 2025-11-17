"use client";

import { Suspense, lazy, memo, useEffect, useState } from "react";
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
  DashboardSection,
} from "@/components/dashboards/shared";
import {
  ChartContainer,
} from "@/components/shared/LeaveCharts";
import { PendingLeaveRequestsTable } from "./sections/PendingApprovals";
import { CancellationRequestsPanel } from "./sections/CancellationRequests";

// Lazy load chart components to improve initial page load
const LazyTypePie = lazy(() =>
  import("@/components/shared/LeaveCharts").then((mod) => ({
    default: mod.TypePie,
  }))
);
const LazyTrendChart = lazy(() =>
  import("@/components/shared/LeaveCharts").then((mod) => ({
    default: mod.TrendChart,
  }))
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export interface HRAdminStats {
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

type HRAdminDashboardClientProps = {
  initialStats?: HRAdminStats | null;
  initialKpis?: HRAdminStats | null;
};

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
    },
  },
};

function HRAdminDashboardClientImpl({
  initialStats,
  initialKpis,
}: HRAdminDashboardClientProps) {
  // Track hydration state to prevent hydration mismatches from animations
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch KPIs first for instant rendering
  const {
    data: kpiData,
    isLoading: isKPILoading,
  } = useSWR<HRAdminStats>("/api/dashboard/hr-admin/kpis", apiFetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    fallbackData: initialKpis ?? undefined,
  });

  // Fetch full displayStats in background (includes charts/analytics)
  const {
    data: stats,
    isLoading: isStatsLoading,
    error,
  } = useSWR<HRAdminStats>("/api/dashboard/hr-admin/stats", apiFetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    fallbackData: initialStats ?? undefined,
  });

  // Use KPI data if available, fall back to full stats
  const displayStats = stats || kpiData || initialStats || initialKpis || null;
  const isLoading = isKPILoading && !kpiData;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card border border-data-error/30 bg-data-error/5 p-6 text-center"
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
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isHydrated ? "visible" : "hidden"}
        className="space-y-4"
      >
        {/* Primary KPIs */}
        <DashboardSection
          title="Key Performance Metrics"
          description="Essential leave management KPIs for your organization"
          isLoading={false}
          animate={true}
        >
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
                  <div
                    key={i}
                    className="neo-card relative flex h-full min-h-[170px] flex-col px-5 py-5 sm:px-6 sm:py-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-3 w-28 bg-muted/40 animate-pulse rounded" />
                        <div className="h-9 w-24 bg-muted/40 animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" />
                      </div>
                      <div className="h-12 w-12 bg-muted/40 animate-pulse rounded-2xl" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <RoleKPICard
                  title="Employees on Leave"
                  value={displayStats?.employeesOnLeave || 0}
                  subtitle="Currently absent"
                  icon={Users}
                  role="HR_ADMIN"
                  animate={true}
                />
                <div className="relative">
                  <RoleKPICard
                    title="Pending Requests"
                    value={displayStats?.pendingRequests || 0}
                    subtitle="Awaiting action"
                    icon={Clock}
                    role="HR_ADMIN"
                    animate={true}
                    trend={
                      displayStats && displayStats.pendingRequests > 15
                        ? {
                            value: displayStats.pendingRequests,
                            label: "needs attention",
                            direction: "up",
                          }
                        : undefined
                    }
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about pending requests"
                        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Leave requests awaiting YOUR action. This shows only
                        requests in your personal approval queue, not
                        organization-wide pending requests.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <RoleKPICard
                    title="Avg Approval Time"
                    value={`${displayStats?.avgApprovalTime?.toFixed(1) || 0}d`}
                    subtitle="Processing speed"
                    icon={TrendingUp}
                    role="HR_ADMIN"
                    animate={true}
                    trend={
                      displayStats && displayStats.avgApprovalTime > 3
                        ? {
                            value: Math.round((displayStats.avgApprovalTime - 3) * 10),
                            label: "vs 3d target",
                            direction: "down",
                          }
                        : displayStats && displayStats.avgApprovalTime > 0
                        ? {
                            value: Math.round((3 - displayStats.avgApprovalTime) * 10),
                            label: "below target",
                            direction: "up",
                          }
                        : undefined
                    }
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about average approval time"
                        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Organization-wide average time (in days) from leave
                        request submission to final approval/rejection across all
                        approvers. Target is ≤3 days for optimal processing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <RoleKPICard
                  title="Total Leaves (YTD)"
                  value={displayStats?.totalLeavesThisYear || 0}
                  subtitle="This year"
                  icon={Calendar}
                  role="HR_ADMIN"
                  animate={true}
                />
              </>
            )}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Performance Metrics */}
        <DashboardSection
          title="Performance & Compliance"
          description="Daily metrics, team utilization, and compliance tracking"
          isLoading={false}
          animate={true}
        >
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
                  <div
                    key={i}
                    className="surface-card rounded-2xl h-full min-h-[170px] flex flex-col p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-24 bg-muted/40 animate-pulse rounded" />
                        <div className="h-8 w-20 bg-muted/40 animate-pulse rounded" />
                        <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" />
                      </div>
                      <div className="h-12 w-12 bg-muted/40 animate-pulse rounded-xl" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <motion.div variants={itemVariants} className="h-full">
                  <Card className="surface-card rounded-2xl hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Daily Processing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {displayStats?.processedToday || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            of {displayStats?.dailyTarget || 10} target
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {displayStats?.dailyProgress || 0}%
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={displayStats?.dailyProgress || 0}
                        className="h-2 bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950"
                        style={{
                          // @ts-ignore
                          "--progress-background":
                            "linear-gradient(to right, #3b82f6, #7c3aed)",
                        }}
                      />
                      {displayStats && displayStats.dailyProgress >= 100 && (
                        <p className="text-xs text-data-success flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Target achieved!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="relative h-full">
                  <RoleKPICard
                    title="Team Utilization"
                    value={`${displayStats?.teamUtilization || 0}%`}
                    subtitle="Workforce availability"
                    icon={Activity}
                    role="HR_ADMIN"
                    animate={true}
                    trend={
                      displayStats && displayStats.teamUtilization
                        ? {
                            value: displayStats.teamUtilization >= 85 ? 2 : 3,
                            label: "vs target",
                            direction:
                              displayStats.teamUtilization >= 85 ? "up" : "down",
                          }
                        : undefined
                    }
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about team utilization"
                        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors z-10"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Percentage of workforce currently available (not on
                        leave). Calculated as 100% minus the average leave
                        utilization ratio. Target: ≥85%.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="relative h-full">
                  <RoleKPICard
                    title="Compliance Score"
                    value={`${displayStats?.complianceScore || 0}%`}
                    subtitle="Policy adherence"
                    icon={CheckCircle2}
                    role="HR_ADMIN"
                    animate={true}
                    trend={
                      displayStats && displayStats.complianceScore
                        ? {
                            value: displayStats.complianceScore >= 90 ? 1 : 2,
                            label: "this month",
                            direction:
                              displayStats.complianceScore >= 90 ? "up" : "down",
                          }
                        : undefined
                    }
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about compliance score"
                        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors z-10"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Measures adherence to leave policies, including proper
                        documentation, approval workflow compliance, and policy
                        violations. Target: ≥90%.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Pending Requests Table - Full Width */}
        <DashboardSection
          title="Pending Leave Requests"
          description="Review and manage pending leave requests"
          isLoading={isLoading}
        >
          <motion.div variants={itemVariants}>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <PendingLeaveRequestsTable />
            </Suspense>
          </motion.div>
        </DashboardSection>

        {/* Analytics Section - Full Width Grid */}
        <DashboardSection
          title="Analytics Overview"
          description="Request trends and leave type distribution"
          isLoading={false}
          animate={true}
        >
          <ResponsiveDashboardGrid columns="1:1:2:3" gap="md" animate={true}>
            {/* Quick Stats Summary */}
            <motion.div variants={itemVariants}>
              <Card className="surface-card rounded-2xl hover:shadow-lg transition-all duration-300 h-full">
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
                        <span className="text-muted-foreground">
                          Processed Today
                        </span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.processedToday || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.pendingRequests || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">On Leave</span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.employeesOnLeave || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">
                          Avg Processing
                        </span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.avgApprovalTime?.toFixed(1) || 0} days
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">
                          Encashment Queue
                        </span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.encashmentPending || 0}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Leave Type Distribution */}
            <motion.div variants={itemVariants}>
              <ChartContainer
                title="Leave Type Distribution"
                subtitle="Current year breakdown"
                loading={isLoading}
                empty={
                  !isLoading &&
                  (!displayStats?.leaveTypeBreakdown ||
                    displayStats.leaveTypeBreakdown.length === 0)
                }
                height={400}
                className="hover:shadow-xl transition-all duration-300 h-full"
              >
                <Suspense fallback={<div className="h-[360px] bg-muted/20 animate-pulse rounded" />}>
                  <LazyTypePie
                    data={
                      displayStats?.leaveTypeBreakdown?.map((item) => ({
                        name: item.type,
                        value: item.count,
                      })) || []
                    }
                    height={360}
                  />
                </Suspense>
              </ChartContainer>
            </motion.div>

            {/* Request Trend Chart */}
            {!isLoading &&
              displayStats?.monthlyTrend &&
              displayStats.monthlyTrend.length > 0 && (
                <motion.div variants={itemVariants}>
                  <ChartContainer
                    title="Request Trend"
                    subtitle="Last 6 months submission pattern"
                    loading={isLoading}
                    empty={
                      !isLoading &&
                      (!displayStats?.monthlyTrend || displayStats.monthlyTrend.length === 0)
                    }
                    height={400}
                    className="hover:shadow-xl transition-all duration-300 h-full"
                  >
                    <Suspense fallback={<div className="h-[360px] bg-muted/20 animate-pulse rounded" />}>
                      <LazyTrendChart
                        data={displayStats.monthlyTrend.map((item) => ({
                          month: item.month,
                          leaves: item.count,
                        }))}
                        height={360}
                        dataKey="leaves"
                      />
                    </Suspense>
                  </ChartContainer>
                </motion.div>
              )}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Cancellation Requests - Full Width */}
        <motion.div variants={itemVariants}>
          <Card className="surface-card rounded-2xl hover:shadow-lg transition-all duration-300">
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
    </TooltipProvider>
  );
}

// Memoize to prevent unnecessary re-renders from parent component changes
export const HRAdminDashboardClient = memo(HRAdminDashboardClientImpl);
