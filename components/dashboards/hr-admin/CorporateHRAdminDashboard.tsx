"use client";

import * as React from "react";
import { Suspense, lazy } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Activity,
  AlertCircle,
  FileText,
  Calendar,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Corporate components
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography } from "@/lib/ui/density-modes";

// Lazy load chart components
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

// Existing feature components (preserved)
import { PendingLeaveRequestsTable } from "./sections/PendingApprovals";
import { CancellationRequestsPanel } from "./sections/CancellationRequests";
import { DashboardCardSkeleton } from "@/components/shared/skeletons";

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

type CorporateHRAdminDashboardProps = {
  initialStats?: HRAdminStats | null;
  initialKpis?: HRAdminStats | null;
};

/**
 * Corporate HR Admin Dashboard
 *
 * Design Philosophy: "Compact" density mode
 * - HR operational role needs efficient data processing views
 * - Clean, professional design without animations
 * - Focus on approval queue and daily metrics
 *
 * Features Preserved:
 * ✅ Your Workload Section (2 cards: Pending Queue, Avg Approval Time)
 * ✅ Organization Metrics Section (5 cards)
 * ✅ All tooltips with detailed explanations
 * ✅ Pending Leave Requests Table
 * ✅ Analytics Section (Quick Stats, Leave Type Pie, Request Trend)
 * ✅ Cancellation Requests Panel
 *
 * What Changed:
 * ❌ No Framer Motion animations
 * ❌ No glassmorphism effects
 * ❌ No rounded-xl/rounded-2xl (now rounded-md)
 * ✅ Corporate MetricCard components where applicable
 * ✅ Solid white cards with slate borders
 * ✅ Compact density (p-4 cards, smaller text)
 */
export function CorporateHRAdminDashboard({
  initialStats,
  initialKpis,
}: CorporateHRAdminDashboardProps) {
  const density = "compact"; // HR Admin uses compact density
  const densityClasses = getDensityClasses(density);
  const typography = getTypography(density);

  // Fetch KPIs first for instant rendering
  const { data: kpiData, isLoading: isKPILoading } = useSWR<HRAdminStats>(
    "/api/dashboard/hr-admin/kpis",
    apiFetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      fallbackData: initialKpis ?? undefined,
    }
  );

  // Fetch full stats in background
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

  const displayStats = stats || kpiData || initialStats || initialKpis || null;
  const isLoading = isKPILoading && !kpiData;

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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* Corporate Header */}
        <div className="mb-4">
          <h1 className={cn(typography.pageTitle, "mb-1")}>
            HR Operations Dashboard
          </h1>
          <p className={cn(typography.label, "!normal-case")}>
            Manage leave approvals and organizational oversight
          </p>
        </div>

        {/* Main Content */}
        <div className={densityClasses.section}>
          {/* Section 1: Your Workload - Personal Metrics */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Your Workload</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Your personal approval queue and processing metrics
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-4">
                      <div className="h-16 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Your Approval Queue */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Your Approval Queue
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.pendingRequests || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Awaiting your action
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-blue-50 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about pending requests"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Leave requests awaiting YOUR action. This is your personal work queue.
                      </p>
                      <p className="text-sm font-semibold mb-1">What to do:</p>
                      <p className="text-sm">
                        Review each request and Forward to DEPT_HEAD, Return for modification, or Reject if invalid.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>

                {/* Avg Approval Time */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Avg Approval Time
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.avgApprovalTime?.toFixed(1) || 0}d
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Processing speed</p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about average approval time"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm mb-2">
                        Organization-wide average time from submission to final decision. Shows overall system efficiency.
                      </p>
                      <p className="text-sm font-semibold mb-1">Why it matters:</p>
                      <p className="text-sm">
                        Target is ≤3 days. Longer times indicate bottlenecks in the approval chain.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>
              </div>
            )}
          </section>

          {/* Section 2: Organization Metrics */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Organization Metrics</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Company-wide performance, utilization, and compliance tracking
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="border-slate-200 shadow-sm rounded-md">
                    <CardContent className="p-4">
                      <div className="h-16 bg-slate-100 animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Employees on Leave */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Employees on Leave
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.employeesOnLeave || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Currently absent</p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-violet-50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about employees on leave"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm">
                        Number of employees who have approved leave today across the entire organization. Helps track workforce availability.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>

                {/* Total Leaves YTD */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Total Leaves (YTD)
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.totalLeavesThisYear || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Approved this year</p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-amber-50 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about total leaves"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm">
                        Total number of approved leave requests this year organization-wide. Tracks overall leave volume.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>

                {/* Daily Processing */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-medium text-slate-500">Daily Processing</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="Information about daily processing"
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm font-semibold mb-1">What this shows:</p>
                            <p className="text-sm">
                              Organization-wide count of leave requests approved or rejected today. Tracks daily processing momentum.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {displayStats?.processedToday || 0}
                          </p>
                          <p className="text-xs text-slate-500">
                            of {displayStats?.dailyTarget || 10} target
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600">
                            {displayStats?.dailyProgress || 0}%
                          </p>
                        </div>
                      </div>
                      <Progress value={displayStats?.dailyProgress || 0} className="h-2" />
                      {displayStats && displayStats.dailyProgress >= 100 && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                          <CheckCircle2 className="h-3 w-3" />
                          Target achieved!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Utilization */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Team Utilization
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.teamUtilization || 0}%
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Workforce availability</p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-cyan-50 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-cyan-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about team utilization"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm">
                        Percentage of employees available for work today (not on approved leave). Real-time workforce capacity indicator.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>

                {/* Compliance Score */}
                <Card className="border-slate-200 shadow-sm rounded-md hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 mb-2">
                          Compliance Score
                        </p>
                        <p className={typography.kpiNumber}>
                          {displayStats?.complianceScore || 0}%
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Policy adherence</p>
                      </div>
                      <div className="h-12 w-12 rounded-md bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about compliance score"
                        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">What this shows:</p>
                      <p className="text-sm">
                        Measures how well the organization follows leave policies - proper documentation, timely processing, and workflow adherence.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Card>
              </div>
            )}
          </section>

          {/* Section 3: Pending Leave Requests */}
          <section id="pending-approvals">
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Pending Leave Requests</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Review and manage pending leave requests
              </p>
            </div>
            <Suspense fallback={<DashboardCardSkeleton />}>
              <PendingLeaveRequestsTable />
            </Suspense>
          </section>

          {/* Section 4: Analytics Overview */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Analytics Overview</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Request trends and leave type distribution
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Quick Stats Summary */}
              <Card className="border-slate-200 shadow-sm rounded-md">
                <CardHeader>
                  <CardTitle className={cn(typography.cardTitle, "flex items-center gap-2")}>
                    <FileText className="h-4 w-4 text-blue-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <>
                      <div className="h-6 w-full bg-slate-100 animate-pulse rounded" />
                      <div className="h-6 w-full bg-slate-100 animate-pulse rounded" />
                      <div className="h-6 w-full bg-slate-100 animate-pulse rounded" />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-sm hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <span className="text-slate-500">Processed Today</span>
                        <span className="font-semibold text-slate-900">
                          {displayStats?.processedToday || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <span className="text-slate-500">Pending</span>
                        <span className="font-semibold text-slate-900">
                          {displayStats?.pendingRequests || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <span className="text-slate-500">On Leave</span>
                        <span className="font-semibold text-slate-900">
                          {displayStats?.employeesOnLeave || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <span className="text-slate-500">Avg Processing</span>
                        <span className="font-semibold text-slate-900">
                          {displayStats?.avgApprovalTime?.toFixed(1) || 0} days
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-sm hover:bg-slate-50 p-2 rounded-md transition-colors">
                        <span className="text-slate-500">Encashment Queue</span>
                        <span className="font-semibold text-slate-900">
                          {displayStats?.encashmentPending || 0}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Leave Type Distribution */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 shadow-sm rounded-md">
                  <CardHeader>
                    <CardTitle className={typography.cardTitle}>Leave Type Distribution</CardTitle>
                    <p className={cn(typography.label, "!normal-case mt-1")}>
                      Current year breakdown
                    </p>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[360px] bg-slate-100 animate-pulse rounded" />
                    ) : !displayStats?.leaveTypeBreakdown ||
                      displayStats.leaveTypeBreakdown.length === 0 ? (
                      <div className="h-[360px] flex items-center justify-center text-slate-500">
                        No data available
                      </div>
                    ) : (
                      <Suspense
                        fallback={
                          <div className="h-[360px] bg-slate-100 animate-pulse rounded" />
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
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Request Trend Chart */}
              {!isLoading &&
                displayStats?.monthlyTrend &&
                displayStats.monthlyTrend.length > 0 && (
                  <div className="lg:col-span-3">
                    <Card className="border-slate-200 shadow-sm rounded-md">
                      <CardHeader>
                        <CardTitle className={typography.cardTitle}>Request Trend</CardTitle>
                        <p className={cn(typography.label, "!normal-case mt-1")}>
                          Last 6 months submission pattern
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Suspense
                          fallback={
                            <div className="h-[360px] bg-slate-100 animate-pulse rounded" />
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
                      </CardContent>
                    </Card>
                  </div>
                )}
            </div>
          </section>

          {/* Section 5: Cancellation Requests */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Cancellation Requests</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Review and process cancellation requests
              </p>
            </div>
            <Card className="border-slate-200 shadow-sm rounded-md">
              <CardContent className="p-4">
                <Suspense fallback={<DashboardCardSkeleton />}>
                  <CancellationRequestsPanel />
                </Suspense>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
