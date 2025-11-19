"use client";

import { Suspense, useMemo } from "react";
import { DeptHeadPendingTable } from "./sections/PendingTable";
import { TeamCoverageCalendar } from "./components/TeamCoverageCalendar";
import { DeptHeadQuickActions } from "./sections/QuickActions";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import {
  RoleKPICard,
  ResponsiveDashboardGrid,
  DashboardSection,
  SmartAlert,
} from "@/components/dashboards/shared";
import {
  ClipboardList,
  CheckCircle,
  RotateCcw,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  Users,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { STATUS_LABELS, METRIC_LABELS } from "@/constants/dashboard-labels";

function CardSkeleton() {
  return (
    <div className="surface-card p-6">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

function KPIGridSkeleton() {
  return (
    <ResponsiveDashboardGrid columns="2:2:4:4" gap="md" animate={false}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </ResponsiveDashboardGrid>
  );
}

export function DeptHeadDashboardWrapper() {
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

    // Alert logic refined: Warning only if queue is significantly large
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

    // "Sent Back" is normal, not critical unless very high
    if (counts.returned > 5) {
      items.push({
        title: "High Return Rate",
        detail: `${counts.returned} requests sent back to employees.`,
        tone: "info",
      });
    }

    // Placeholder for Conflict Detection (Future Feature)
    // items.push({
    //   title: "Potential Conflict",
    //   detail: "Multiple requests for Dec 25th.",
    //   tone: "warning",
    // });

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
      <div className="space-y-6">
        {/* Top Row - KPI Cards Grid */}
        <DashboardSection
          title="Department Overview"
          description="Key metrics and approval status"
          isLoading={isLoading}
          loadingFallback={<KPIGridSkeleton />}
          action={
            <button
              onClick={() => mutate()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        >
          <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>{METRIC_LABELS.PENDING_APPROVALS}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about pending requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">
                        What this shows:
                      </p>
                      <p className="text-sm mb-2">
                        Leave requests from your department awaiting YOUR
                        approval.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={counts.pending}
              subtitle="Awaiting your review"
              icon={ClipboardList}
              role="DEPT_HEAD"
              onClick={() => {
                const element = document.getElementById("pending-table");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              clickLabel="Scroll to pending requests"
            />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>{METRIC_LABELS.FORWARDED}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about forwarded requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">
                        What this shows:
                      </p>
                      <p className="text-sm mb-2">
                        Requests you've approved and forwarded to HR for final
                        processing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={counts.forwarded}
              subtitle="Sent to HR"
              icon={CheckCircle}
              role="DEPT_HEAD"
            />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>{METRIC_LABELS.SENT_BACK}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about returned requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold mb-1">
                        What this shows:
                      </p>
                      <p className="text-sm mb-2">
                        Requests you've sent back to employees for corrections.
                        They need to resubmit these.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
              value={counts.returned}
              subtitle="Require employee action"
              icon={RotateCcw}
              role="DEPT_HEAD"
              // Removed confusing trend arrow
            />
            <RoleKPICard
              title={
                <div className="flex items-center gap-2">
                  <span>{STATUS_LABELS.CANCELLED}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label="Information about cancelled requests"
                        className="hover:opacity-70 transition-opacity"
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
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
              role="DEPT_HEAD"
            />
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Pending Requests Table */}
        <div id="pending-table">
          <DashboardSection
            title="Approval Queue"
            description="Review and process leave requests from your department"
            isLoading={isLoading}
            error={error}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]">
              <div className="surface-card">
                {/* Removed redundant inner header "Pending Requests" */}
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

              <div className="space-y-4">
                <DeptHeadAlertsPanel alerts={alerts} isLoading={isLoading} />
                {/* Removed DeptHeadInsightsPanel (Redundant) */}
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* Bottom Row - Team Overview and Quick Actions */}
        <DashboardSection
          title="Team & Actions"
          description="Team overview and quick management actions"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Suspense fallback={<CardSkeleton />}>
              <TeamCoverageCalendar />
            </Suspense>

            <Suspense fallback={<CardSkeleton />}>
              <DeptHeadQuickActions />
            </Suspense>
          </div>
        </DashboardSection>
      </div>
    </TooltipProvider>
  );
}

function DeptHeadAlertsPanel({
  alerts,
  isLoading,
}: {
  alerts: Array<{
    title: string;
    detail: string;
    tone: "info" | "warning" | "critical";
  }>;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="surface-card p-4 space-y-3">
        <div className="h-14 rounded-lg bg-muted animate-pulse" />
        <div className="h-14 rounded-lg bg-muted animate-pulse" />
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
