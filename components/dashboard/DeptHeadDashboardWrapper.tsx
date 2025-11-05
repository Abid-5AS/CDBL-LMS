"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./DeptHeadPendingTable";
import { DeptHeadSummaryCards } from "./DeptHeadSummaryCards";
import { DeptHeadTeamOverview } from "./DeptHeadTeamOverview";
import { DeptHeadQuickActions } from "./DeptHeadQuickActions";
import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import { useFilterFromUrl } from "@/lib/url-filters";
import { fetcher } from "@/lib/fetcher";

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
  const { data, isLoading, error, mutate } = useSWR(
    ["/api/manager/pending", state],
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const counts = data?.counts || {
    pending: 0,
    forwarded: 0,
    returned: 0,
    cancelled: 0,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
        {/* Summary Cards - Moved to top of sidebar */}
        <DeptHeadSummaryCards
          pending={counts.pending}
          approved={counts.forwarded}
          returned={counts.returned}
          cancelled={counts.cancelled}
        />
        
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

