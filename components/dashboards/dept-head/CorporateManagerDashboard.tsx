"use client";

import * as React from "react";
import { Suspense, useMemo } from "react";
import {
  ClipboardList,
  CheckCircle,
  RotateCcw,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, METRIC_LABELS } from "@/constants/dashboard-labels";

// Corporate components
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography } from "@/lib/ui/density-modes";

// Hooks and utilities
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";

// Existing feature components (preserved)
import { DeptHeadPendingTable } from "./sections/PendingTable";
import { TeamCoverageCalendar } from "./components/TeamCoverageCalendar";
import { DeptHeadQuickActions } from "./sections/QuickActions";
import { SmartAlert } from "@/components/dashboards/shared";

function CardSkeleton() {
  return (
    <div className="border border-slate-200 shadow-sm rounded-md p-4">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
        <div className="h-20 bg-slate-100 animate-pulse rounded" />
      </div>
    </div>
  );
}

/**
 * Corporate Manager/Dept Head Dashboard
 *
 * Design Philosophy: "Compact" density mode
 * - Manager role needs data-heavy, efficient views
 * - Clean, professional design without animations
 * - Focus on approval queue and team management
 *
 * Features Preserved:
 * ✅ 4 KPI Cards (Pending, Forwarded, Returned, Cancelled) with tooltips
 * ✅ Click-to-scroll on Pending KPI
 * ✅ Approval Queue with ultra-feature-rich PendingTable:
 *    - Search with debounce
 *    - Filters (Status, Type)
 *    - Batch selection & bulk actions
 *    - Individual row actions (Approve/Reject/Forward/Return)
 *    - All action dialogs preserved
 *    - Loading/Error/Empty states
 * ✅ Smart Alerts Panel (dynamic alerts based on queue size)
 * ✅ Team Coverage Calendar
 * ✅ Quick Actions Panel (Team Calendar, Export Report, Delegate)
 * ✅ All tooltips preserved
 * ✅ Refresh functionality
 * ✅ All custom hooks preserved
 *
 * What Changed:
 * ❌ No animations
 * ❌ No gradients
 * ✅ Corporate MetricCard components
 * ✅ Solid white cards with slate borders
 * ✅ Compact density (p-4 cards, text-sm)
 * ✅ Ultra-dense table styling
 */
export function CorporateManagerDashboard() {
  const density = "compact"; // Manager uses compact density
  const densityClasses = getDensityClasses(density);
  const typography = getTypography(density);

  const { state } = useFilterFromUrl();
  const {
    data: rawData,
    isLoading,
    error,
    mutate,
  } = useApiQueryWithParams<{
    items: unknown[];
    counts: {
      pending: number;
      forwarded: number;
      returned: number;
      cancelled: number;
    };
  }>(
    "/api/manager/pending",
    {
      q: state.q,
      status: state.status,
      type: state.type === "ALL" ? null : state.type,
      page: state.page,
      size: state.pageSize,
    },
    {
      revalidateOnFocus: false,
    }
  );

  const counts = rawData?.counts || {
    pending: 0,
    forwarded: 0,
    returned: 0,
    cancelled: 0,
  };

  const data =
    rawData && rawData.items
      ? {
          rows: rawData.items as any[],
          total: rawData.items.length,
          counts: rawData.counts,
        }
      : undefined;

  const alerts = useMemo(() => {
    const items: Array<{
      title: string;
      detail: string;
      tone: "info" | "warning" | "critical";
    }> = [];

    if (counts.pending > 15) {
      items.push({
        title: "Large Approval Queue",
        detail: `${counts.pending} requests awaiting review.`,
        tone: "warning",
      });
    } else if (counts.pending > 0) {
      items.push({
        title: "Pending Approvals",
        detail: `${counts.pending} requests awaiting review.`,
        tone: "info",
      });
    }

    if (counts.returned > 5) {
      items.push({
        title: "High Return Rate",
        detail: `${counts.returned} requests sent back to employees.`,
        tone: "info",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "All Clear",
        detail: "No urgent actions required.",
        tone: "info",
      });
    }

    return items;
  }, [counts]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* Corporate Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={cn(typography.pageTitle, "mb-1")}>
                Manager Dashboard
              </h1>
              <p className={cn(typography.label, "!normal-case")}>
                Review and approve leave requests from your department
              </p>
            </div>

            {/* Header Actions */}
            <button
              onClick={() => mutate()}
              className="p-2 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={densityClasses.section}>
          {/* Section 1: Department Overview KPIs (4 Cards) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Department Overview</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Key metrics and approval status
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Pending Approvals (with click to scroll) */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.PENDING_APPROVALS}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about pending requests"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">
                            What this shows:
                          </p>
                          <p className="text-sm mb-2">
                            Leave requests from your department awaiting YOUR approval.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={counts.pending}
                  subtitle="Awaiting your review"
                  icon={ClipboardList}
                  density={density}
                  onClick={() => {
                    const element = document.getElementById("pending-table");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                />

                {/* KPI 2: Forwarded */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{METRIC_LABELS.FORWARDED}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about forwarded requests"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">
                            What this shows:
                          </p>
                          <p className="text-sm mb-2">
                            Requests you've approved and forwarded to HR for final processing.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={counts.forwarded}
                  subtitle="Sent to HR"
                  icon={CheckCircle}
                  density={density}
                />

                {/* KPI 3: Returned */}
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
                          <p className="text-sm font-semibold mb-1">
                            What this shows:
                          </p>
                          <p className="text-sm mb-2">
                            Requests you've sent back to employees for corrections. They need to resubmit these.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={counts.returned}
                  subtitle="Require employee action"
                  icon={RotateCcw}
                  density={density}
                />

                {/* KPI 4: Cancelled */}
                <MetricCard
                  label={
                    <div className="flex items-center gap-2">
                      <span>{STATUS_LABELS.CANCELLED}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="Information about cancelled requests"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Info className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-semibold mb-1">
                            What this shows:
                          </p>
                          <p className="text-sm mb-2">
                            Requests withdrawn by employees or cancelled after approval.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  }
                  value={counts.cancelled}
                  subtitle="Withdrawn by employee"
                  icon={XCircle}
                  density={density}
                />
              </div>
            )}
          </section>

          {/* Section 2: Approval Queue (Wide table + Sidebar) */}
          <section id="pending-table">
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Approval Queue</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Review and process leave requests from your department
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]">
              {/* Left: Approval Queue Table */}
              <div className="border border-slate-200 shadow-sm rounded-md bg-white">
                <div className="px-2 py-4">
                  <Suspense fallback={<CardSkeleton />}>
                    <DeptHeadPendingTable
                      data={
                        data
                          ? {
                              rows: data.rows,
                              total: data.rows?.length ?? 0,
                              counts: data.counts,
                            }
                          : undefined
                      }
                      isLoading={isLoading}
                      error={error}
                      onMutate={mutate}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Right: Alerts Panel */}
              <div className="space-y-4">
                <DeptHeadAlertsPanel alerts={alerts} isLoading={isLoading} density={density} />
              </div>
            </div>
          </section>

          {/* Section 3: Team & Actions (2-Column Grid) */}
          <section>
            <div className="mb-3">
              <h2 className={typography.sectionTitle}>Team & Actions</h2>
              <p className={cn(typography.label, "!normal-case mt-1")}>
                Team overview and quick management actions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Suspense fallback={<CardSkeleton />}>
                <TeamCoverageCalendar />
              </Suspense>

              <Suspense fallback={<CardSkeleton />}>
                <DeptHeadQuickActions />
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Corporate Alerts Panel
 */
function DeptHeadAlertsPanel({
  alerts,
  isLoading,
  density = "compact",
}: {
  alerts: Array<{
    title: string;
    detail: string;
    tone: "info" | "warning" | "critical";
  }>;
  isLoading?: boolean;
  density?: "comfortable" | "compact";
}) {
  if (isLoading) {
    return (
      <div className="border border-slate-200 shadow-sm rounded-md bg-white p-4 space-y-3">
        <div className="h-14 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-14 rounded-md bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <SmartAlert
          key={`${alert.title}-${idx}`}
          variant={
            alert.tone === "critical"
              ? "destructive"
              : alert.tone === "warning"
              ? "warning"
              : "info"
          }
          title={alert.title}
        >
          {alert.detail}
        </SmartAlert>
      ))}
    </div>
  );
}
