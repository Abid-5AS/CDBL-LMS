"use client";

import { Suspense } from "react";
import { DeptHeadPendingTable } from "./Sections/PendingTable";
import { DeptHeadTeamOverview } from "./Sections/TeamOverview";
import { DeptHeadQuickActions } from "./Sections/QuickActions";
import { Card, CardContent } from "@/components/ui";
import { useApiQueryWithParams } from "@/lib/apiClient";
import { useFilterFromUrl } from "@/lib/url-filters";
import { KPIGrid, KPICard } from "@/components/cards/KPICard";
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold mt-0.5">{counts.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Forwarded</p>
                  <p className="text-2xl font-bold mt-0.5">{counts.forwarded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Returned</p>
                  <p className="text-2xl font-bold mt-0.5">{counts.returned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Cancelled</p>
                  <p className="text-2xl font-bold mt-0.5">{counts.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
