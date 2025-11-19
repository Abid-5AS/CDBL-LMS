"use client";

import { Suspense, lazy, memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoleBasedDashboard } from "@/components/dashboards/shared";
import { ChartContainer } from "@/components/shared/LeaveCharts";
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
import { DashboardCardSkeleton } from "@/components/shared/skeletons";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const router = useRouter();
  // Track hydration state to prevent hydration mismatches from animations
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);

    // Cleanup function - not strictly necessary for this useEffect but good practice
    return () => {
      // No specific cleanup needed for this component
      // The state will be handled by React's unmounting process
    };
  }, []);

  // Fetch KPIs first for instant rendering
  const { data: kpiData, isLoading: isKPILoading } = useSWR<HRAdminStats>(
    "/api/dashboard/hr-admin/kpis",
    apiFetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      fallbackData: initialKpis ?? undefined,
    }
  );

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
        className="border border-data-error/30 bg-data-error/5 p-6 text-center rounded-lg"
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
      <RoleBasedDashboard
        role="HR_ADMIN"
        animate={true}
        backgroundVariant="transparent"
        compactHeader={true}
        title="HR Operations"
        description="Manage leave approvals and organizational oversight"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isHydrated ? "visible" : "hidden"}
          className="space-y-6"
        >
          {/* YOUR WORKLOAD - Personal Metrics */}
          <motion.section variants={itemVariants}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Your Workload</h3>
              <p className="text-sm text-muted-foreground">
                Your personal approval queue and processing metrics
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isLoading ? (
                <>
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="border-border/60 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="h-3 w-28 bg-muted/40 animate-pulse rounded" />
                            <div className="h-9 w-24 bg-muted/40 animate-pulse rounded" />
                            <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" />
                          </div>
                          <div className="h-12 w-12 bg-muted/40 animate-pulse rounded-2xl" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Your Approval Queue
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.pendingRequests || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Awaiting your action
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
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
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Leave requests awaiting YOUR action. This is your
                          personal work queue.
                        </p>
                        <p className="text-sm font-semibold mb-1">What to do:</p>
                        <p className="text-sm">
                          Review each request and Forward to DEPT_HEAD, Return
                          for modification, or Reject if invalid.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>

                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Avg Approval Time
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.avgApprovalTime?.toFixed(1) || 0}d
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Processing speed
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
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
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm mb-2">
                          Organization-wide average time from submission to final
                          decision. Shows overall system efficiency.
                        </p>
                        <p className="text-sm font-semibold mb-1">
                          Why it matters:
                        </p>
                        <p className="text-sm">
                          Target is ≤3 days. Longer times indicate bottlenecks in
                          the approval chain.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>
                </>
              )}
            </div>
          </motion.section>

          {/* ORGANIZATION METRICS */}
          <motion.section variants={itemVariants}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Organization Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Company-wide performance, utilization, and compliance tracking
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="border-border/60 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="h-4 w-24 bg-muted/40 animate-pulse rounded" />
                            <div className="h-8 w-20 bg-muted/40 animate-pulse rounded" />
                            <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" />
                          </div>
                          <div className="h-12 w-12 bg-muted/40 animate-pulse rounded-xl" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Employees on Leave
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.employeesOnLeave || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Currently absent
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-violet-600" />
                        </div>
                      </div>
                    </CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about employees on leave"
                          className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm">
                          Number of employees who have approved leave today across
                          the entire organization. Helps track workforce
                          availability.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>

                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Total Leaves (YTD)
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.totalLeavesThisYear || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Approved this year
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about total leaves"
                          className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm">
                          Total number of approved leave requests this year
                          organization-wide. Tracks overall leave volume.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>

                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Daily Processing
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                aria-label="Information about daily processing"
                                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-sm font-semibold mb-1">
                                What this shows:
                              </p>
                              <p className="text-sm">
                                Organization-wide count of leave requests approved
                                or rejected today. Tracks daily processing momentum.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                          <div>
                            <p className="text-2xl font-bold text-foreground">
                              {displayStats?.processedToday || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              of {displayStats?.dailyTarget || 10} target
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                              {displayStats?.dailyProgress || 0}%
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={displayStats?.dailyProgress || 0}
                          className="h-2 bg-muted"
                        />
                        {displayStats && displayStats.dailyProgress >= 100 && (
                          <p className="text-xs text-data-success flex items-center gap-1 mt-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Target achieved!
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Team Utilization
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.teamUtilization || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Workforce availability
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                          <Activity className="h-6 w-6 text-cyan-600" />
                        </div>
                      </div>
                    </CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about team utilization"
                          className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm">
                          Percentage of employees available for work today (not on
                          approved leave). Real-time workforce capacity indicator.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>

                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Compliance Score
                          </p>
                          <p className="text-3xl font-bold">
                            {displayStats?.complianceScore || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Policy adherence
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Information about compliance score"
                          className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm font-semibold mb-1">
                          What this shows:
                        </p>
                        <p className="text-sm">
                          Measures how well the organization follows leave policies
                          - proper documentation, timely processing, and workflow
                          adherence.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>
                </>
              )}
            </div>
          </motion.section>

          {/* Pending Requests Table */}
          <motion.section variants={itemVariants} id="pending-approvals">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Pending Leave Requests</h3>
              <p className="text-sm text-muted-foreground">
                Review and manage pending leave requests
              </p>
            </div>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <PendingLeaveRequestsTable />
            </Suspense>
          </motion.section>

          {/* Analytics Section */}
          <motion.section variants={itemVariants}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Analytics Overview</h3>
              <p className="text-sm text-muted-foreground">
                Request trends and leave type distribution
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Quick Stats Summary */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-blue-600" />
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
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.pendingRequests || 0}
                        </span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">On Leave</span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.employeesOnLeave || 0}
                        </span>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex justify-between items-center text-sm group hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <span className="text-muted-foreground">
                          Avg Processing
                        </span>
                        <span className="font-semibold text-foreground">
                          {displayStats?.avgApprovalTime?.toFixed(1) || 0} days
                        </span>
                      </div>
                      <Separator className="bg-border/50" />
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

              {/* Leave Type Distribution */}
              <div className="lg:col-span-2">
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
                  className="border-border/60 shadow-sm"
                >
                  <Suspense
                    fallback={
                      <div className="h-[360px] bg-muted/20 animate-pulse rounded" />
                    }
                  >
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
              </div>

              {/* Request Trend Chart */}
              {!isLoading &&
                displayStats?.monthlyTrend &&
                displayStats.monthlyTrend.length > 0 && (
                  <div className="lg:col-span-3">
                    <ChartContainer
                      title="Request Trend"
                      subtitle="Last 6 months submission pattern"
                      loading={isLoading}
                      empty={
                        !isLoading &&
                        (!displayStats?.monthlyTrend ||
                          displayStats.monthlyTrend.length === 0)
                      }
                      height={400}
                      className="border-border/60 shadow-sm"
                    >
                      <Suspense
                        fallback={
                          <div className="h-[360px] bg-muted/20 animate-pulse rounded" />
                        }
                      >
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
                  </div>
                )}
            </div>
          </motion.section>

          {/* Cancellation Requests */}
          <motion.section variants={itemVariants}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Cancellation Requests</h3>
              <p className="text-sm text-muted-foreground">
                Review and process cancellation requests
              </p>
            </div>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <Suspense fallback={<DashboardCardSkeleton />}>
                  <CancellationRequestsPanel />
                </Suspense>
              </CardContent>
            </Card>
          </motion.section>
        </motion.div>
      </RoleBasedDashboard>
    </TooltipProvider>
  );
}

// Memoize to prevent unnecessary re-renders from parent component changes
export const HRAdminDashboardClient = memo(HRAdminDashboardClientImpl);
