"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./sections/PendingTable";
import { DeptHeadTeamOverview } from "./sections/TeamOverview";
import { DeptHeadQuickActions } from "./sections/QuickActions";
import { Card, CardContent } from "@/components/ui";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { RoleKPICard, ResponsiveDashboardGrid, DashboardSection } from "@/components/dashboards/shared";
import { ClipboardList, CheckCircle, RotateCcw, XCircle, RefreshCw } from "lucide-react";

function CardSkeleton() {
  return (
    <Card className="rounded-2xl border-muted/60 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
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

  // Transform API response to component format
  const data = rawData ? {
    rows: rawData.items as any[],
    total: rawData.items.length,
    counts: rawData.counts,
  } : undefined;

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
        <div id="pending-requests-table">
          <DeptHeadPendingTable
            data={data ? { rows: data.rows, total: data.rows?.length ?? 0, counts: data.counts } : undefined}
            isLoading={isLoading}
            error={error}
            onMutate={mutate}
          />
        </div>
      </DashboardSection>

      {/* Bottom Row - Team Overview and Quick Actions */}
      <DashboardSection
        title="Team & Actions"
        description="Team overview and quick management actions"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
