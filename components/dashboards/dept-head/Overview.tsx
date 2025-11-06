"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./Sections/PendingTable";
import { DeptHeadTeamOverview } from "./Sections/TeamOverview";
import { DeptHeadQuickActions } from "./Sections/QuickActions";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { KPIGrid, KPICard } from "@/components/shared/KPICard";
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column - Pending Requests Table (8/12 width) */}
      <main className="lg:col-span-8 space-y-6">
        <div id="pending-requests-table">
          <DeptHeadPendingTable
            data={data}
            isLoading={isLoading}
            error={error}
            onMutate={mutate}
          />
        </div>
      </main>

      {/* Right Column - Sidebar (3/12 on lg, 4/12 on xl, sticky) */}
      <aside className="lg:col-span-3 xl:col-span-4 space-y-4 lg:sticky lg:top-6 lg:h-fit">
        {/* Summary Cards - Using shared KPIGrid */}
        <KPIGrid columns={1}>
          <KPICard
            title="Pending"
            value={String(counts.pending)}
            icon={ClipboardList}
            iconColor="amber"
            status={counts.pending > 0 ? "low" : "healthy"}
          />
          <KPICard
            title="Forwarded"
            value={String(counts.forwarded)}
            icon={CheckCircle}
            iconColor="emerald"
            status="healthy"
          />
          <KPICard
            title="Returned"
            value={String(counts.returned)}
            icon={RotateCcw}
            iconColor="yellow"
            status={counts.returned > 0 ? "low" : "healthy"}
          />
          <KPICard
            title="Cancelled"
            value={String(counts.cancelled)}
            icon={XCircle}
            iconColor="slate"
          />
        </KPIGrid>
        
        {/* Team Overview */}
        <Suspense fallback={<CardSkeleton />}>
          <DeptHeadTeamOverview />
        </Suspense>
        
        {/* Quick Actions */}
        <Suspense fallback={<CardSkeleton />}>
          <DeptHeadQuickActions />
        </Suspense>
      </aside>
    </div>
  );
}

