"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./sections/PendingTable";
import { DeptHeadTeamOverview } from "./sections/TeamOverview";
import { DeptHeadQuickActions } from "./sections/QuickActions";
import { Card, CardContent } from "@/components/ui";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { RoleKPICard, ResponsiveDashboardGrid } from "@/components/dashboards/shared";
import { ClipboardList, CheckCircle, RotateCcw, XCircle } from "lucide-react";

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

export function DeptHeadDashboardWrapper() {
  const { state } = useFilterFromUrl();
  const { data, isLoading, error, mutate } = useApiQueryWithParams<{
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

  const counts = data?.counts || {
    pending: 0,
    forwarded: 0,
    returned: 0,
    cancelled: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Row - KPI Cards Grid */}
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

      {/* Main Content */}
      <div id="pending-requests-table">
        <DeptHeadPendingTable
          data={data}
          isLoading={isLoading}
          error={error}
          onMutate={mutate}
        />
      </div>

      {/* Bottom Row - Team Overview and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CardSkeleton />}>
          <DeptHeadTeamOverview />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <DeptHeadQuickActions />
        </Suspense>
      </div>
    </div>
  );
}
