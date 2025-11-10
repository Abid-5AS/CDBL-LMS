"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./Sections/PendingTable";
import { DeptHeadTeamOverview } from "./Sections/TeamOverview";
import { DeptHeadQuickActions } from "./Sections/QuickActions";
import { Card, CardContent } from "@/components/ui";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { KPIGrid, KPICard } from "@/components/cards";
import { HRAnalyticsCard } from "@/components/shared";
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

  const tableData = data ? { rows: data.items, total: data.items.length, counts: data.counts } : undefined;

  return (
    <div className="space-y-6">
      {/* Top Row - Team Status Activity Card */}
      <div className="max-w-2xl">
        <HRAnalyticsCard 
          title="Team Status Overview"
          subtitle="Department request management"
          metrics={[
            {
              label: "Pending",
              current: counts.pending,
              target: Math.max(10, counts.pending + 5), // Target to keep pending low
              color: "#F59E0B", // Amber
              size: 90,
              unit: "requests",
              trend: counts.pending > 5 ? "up" : counts.pending < 2 ? "down" : "stable"
            },
            {
              label: "Forwarded",
              current: counts.forwarded,
              target: Math.max(15, counts.forwarded + 3), // Target processing
              color: "#10B981", // Green
              size: 90,
              unit: "requests",
              trend: counts.forwarded >= 10 ? "up" : "stable"
            },
            {
              label: "Returned",
              current: counts.returned,
              target: Math.max(3, counts.returned + 2), // Lower target for returns
              color: "#8B5CF6", // Purple
              size: 70,
              unit: "requests",
              trend: counts.returned > 3 ? "up" : "down"
            },
            {
              label: "Cancelled",
              current: counts.cancelled,
              target: Math.max(2, counts.cancelled + 1), // Minimal cancellations
              color: "#6B7280", // Gray
              size: 60,
              unit: "requests",
              trend: "stable"
            }
          ]}
          className="w-full"
        />
      </div>

      {/* Legacy KPI Cards (hidden but kept for comparison) */}
      <div className="hidden grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-2xl font-bold mt-0.5">{counts.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div id="pending-requests-table">
        <DeptHeadPendingTable
          data={tableData}
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
