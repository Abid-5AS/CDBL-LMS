"use client";

import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveStatusBanner } from "./LeaveStatusBanner";
import { LeaveSummaryCard } from "./LeaveSummaryCard";
import { RequestsTable } from "@/app/dashboard/components/requests-table";
import { HeroStrip } from "./HeroStrip";

type EmployeeDashboardUnifiedProps = {
  username: string;
};

export function EmployeeDashboardUnified({ username }: EmployeeDashboardUnifiedProps) {
  return (
    <div className="space-y-6">
      {/* Hero Strip with status and actions */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroStrip name={username} />
      </Suspense>

      {/* Leave Status Banner (conditional) */}
      <Suspense fallback={<BannerSkeleton />}>
        <LeaveStatusBanner />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): Leave Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Leave Requests Table (recent 3 only) */}
          <Suspense fallback={<TableSkeleton />}>
            <RequestsTable limit={3} showFilter={false} />
          </Suspense>
        </div>

        {/* Right Column (1/3): Leave Summary */}
        <div className="space-y-6">
          <Suspense fallback={<SummarySkeleton />}>
            <LeaveSummaryCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function BannerSkeleton() {
  return (
    <div className="rounded-2xl border-2 p-4 bg-gray-100">
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

