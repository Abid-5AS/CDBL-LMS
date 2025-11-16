"use client";

import { Suspense, useMemo } from "react";
import { DeptHeadPendingTable } from "./sections/PendingTable";
import { DeptHeadTeamOverview } from "./sections/TeamOverview";
import { DeptHeadQuickActions } from "./sections/QuickActions";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { RoleKPICard, ResponsiveDashboardGrid, DashboardSection } from "@/components/dashboards/shared";
import { ClipboardList, CheckCircle, RotateCcw, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

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
  const { data: rawData, isLoading, error, mutate } = useApiQueryWithParams<{
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

  const data = rawData
    ? {
        rows: rawData.items as any[],
        total: rawData.items.length,
        counts: rawData.counts,
      }
    : undefined;

  const insightItems = useMemo(
    () => [
      {
        label: "Pending queue",
        value: counts.pending,
        helper: "Awaiting your review",
      },
      {
        label: "Forwarded this week",
        value: counts.forwarded,
        helper: "Sent onward to HR",
      },
      {
        label: "Returned to employees",
        value: counts.returned,
        helper: "Need employee updates",
      },
    ],
    [counts]
  );

  const alerts = useMemo(() => {
    const items: Array<{
      title: string;
      detail: string;
      tone: "info" | "warning" | "critical";
    }> = [];

    if (counts.pending > 12) {
      items.push({
        title: "Large approval queue",
        detail: `${counts.pending} requests require action.`,
        tone: "warning",
      });
    }

    if (counts.returned > 3) {
      items.push({
        title: "High return rate",
        detail: `${counts.returned} requests sent back to employees.`,
        tone: "critical",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "All clear",
        detail: "Approvals are on track.",
        tone: "info",
      });
    }

    return items;
  }, [counts]);

  return (
    <div className="space-y-6">
      {/* Top Row - KPI Cards Grid */}
      <DashboardSection
        title="Leave Requests Overview"
        description="Key metrics for your department's leave approvals"
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
            title="Pending"
            value={counts.pending}
            subtitle="Awaiting your review"
            icon={ClipboardList}
            role="DEPT_HEAD"
          />
          <RoleKPICard
            title="Forwarded"
            value={counts.forwarded}
            subtitle="Sent to HR"
            icon={CheckCircle}
            role="DEPT_HEAD"
          />
          <RoleKPICard
            title="Returned"
            value={counts.returned}
            subtitle="Need employee action"
            icon={RotateCcw}
            role="DEPT_HEAD"
            trend={counts.returned > 0 ? {
              value: counts.returned,
              label: "requires follow-up",
              direction: "down"
            } : undefined}
          />
          <RoleKPICard
            title="Cancelled"
            value={counts.cancelled}
            subtitle="Withdrawn by employee"
            icon={XCircle}
            role="DEPT_HEAD"
          />
        </ResponsiveDashboardGrid>
      </DashboardSection>

      {/* Pending Requests Table */}
      <DashboardSection
        title="Pending Leave Requests"
        description="Review and process leave requests from your department"
        isLoading={isLoading}
        error={error}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="surface-card">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">Awaiting Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Requests from your department
                </p>
              </div>
              <button
                onClick={() => mutate()}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
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
            <DeptHeadInsightsPanel items={insightItems} isLoading={isLoading} />
            <DeptHeadAlertsPanel alerts={alerts} isLoading={isLoading} />
          </div>
        </div>
      </DashboardSection>

      {/* Bottom Row - Team Overview and Quick Actions */}
      <DashboardSection
        title="Team & Actions"
        description="Team overview and quick management actions"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Suspense fallback={<CardSkeleton />}>
            <DeptHeadTeamOverview />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <DeptHeadQuickActions />
          </Suspense>
        </div>
      </DashboardSection>
    </div>
  );
}

function DeptHeadInsightsPanel({
  items,
  isLoading,
}: {
  items: Array<{ label: string; value: number | string; helper: string }>;
  isLoading?: boolean;
}) {
  return (
    <div className="surface-card p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Snapshot
        </p>
        <h4 className="text-base font-semibold text-foreground">Team Metrics</h4>
      </div>
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))
          : items.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/60 px-3 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.helper}</p>
              </div>
            ))}
      </div>
    </div>
  );
}

function DeptHeadAlertsPanel({
  alerts,
  isLoading,
}: {
  alerts: Array<{ title: string; detail: string; tone: "info" | "warning" | "critical" }>;
  isLoading?: boolean;
}) {
  const tones: Record<"info" | "warning" | "critical", string> = {
    info: "border-emerald-200/70 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-200/70 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    critical: "border-red-200/70 bg-red-500/5 text-red-600 dark:text-red-400",
  };

  return (
    <div className="surface-card p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Alerts
        </p>
        <h4 className="text-base font-semibold text-foreground">Action Items</h4>
      </div>
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))
          : alerts.map((alert, idx) => (
              <div
                key={`${alert.title}-${idx}`}
                className={`rounded-xl border px-3 py-2 text-sm flex gap-2 ${tones[alert.tone]}`}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-xs opacity-80">{alert.detail}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
