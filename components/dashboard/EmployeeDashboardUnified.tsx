"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveStatusBanner } from "./LeaveStatusBanner";
import { LeaveTimeline } from "./LeaveTimeline";
import { ActiveRequestsTimeline } from "./ActiveRequestsTimeline";
import { QuickActionsCard } from "./QuickActionsCard";
import { BalanceMetersGroup } from "./BalanceMetersGroup";
import { NextHoliday } from "./NextHoliday";
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
        {/* Left Column (2/3): Active Requests */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ActiveRequestsSkeleton />}>
            <ActiveRequestsTimeline />
          </Suspense>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <QuickActionsCard />
            </CardContent>
          </Card>

          {/* Recent Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <RequestsTable />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Balances & Next Holiday */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<BalanceSkeleton />}>
                <BalanceMetersGroup />
              </Suspense>
            </CardContent>
          </Card>

          <Suspense fallback={<NextHolidaySkeleton />}>
            <NextHoliday />
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

function ActiveRequestsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

function BalanceSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function NextHolidaySkeleton() {
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4">
        <Skeleton className="h-16 w-full" />
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

