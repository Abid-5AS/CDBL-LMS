"use client";

import { useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestsTable } from "@/app/dashboard/components/requests-table";
import { UpcomingHolidays } from "./UpcomingHolidays";
import { PolicyAlerts } from "./PolicyAlerts";
import { QuickActionsCard } from "./QuickActionsCard";
import { LeaveUtilizationCard } from "./LeaveUtilizationCard";
import { SmartRecommendations } from "./SmartRecommendations";
import { ActiveRequestsTimeline } from "./ActiveRequestsTimeline";
import { MiniCalendar } from "./MiniCalendar";
import { CompactBalances } from "./CompactBalances";
import { NextHoliday } from "./NextHoliday";
import { SegmentedControl } from "@/components/ui/segmented-control";

type EmployeeDashboardProps = {
  username: string;
};

export function EmployeeDashboard({ username }: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  const TABS = ["Overview", "Activity", "Calendar"];

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back, {username}</h2>
            <p className="text-sm text-slate-600 mt-0.5">Manage your leave requests and track your balance</p>
          </div>
          
          {/* iOS-style Segmented Control */}
          <SegmentedControl
            options={TABS}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Suspense fallback={<div className="h-9 w-full" />}>
              <QuickActionsCard />
            </Suspense>
          </section>

          {/* Policy Alerts */}
          <Suspense fallback={<AlertSkeleton />}>
            <PolicyAlerts />
          </Suspense>

          {/* Main Content Grid */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left Column: Active Requests */}
            <div className="lg:col-span-2 space-y-4">
              <Suspense fallback={<ActiveRequestsSkeleton />}>
                <ActiveRequestsTimeline />
              </Suspense>
            </div>

            {/* Right Column: Balances & Next Holiday */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Balances</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Suspense fallback={<BalanceSkeleton />}>
                    <CompactBalances />
                  </Suspense>
                </CardContent>
              </Card>
              
              <Suspense fallback={<NextHolidaySkeleton />}>
                <NextHoliday />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="space-y-4">
          {/* Recent Requests */}
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

          {/* Analytics Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Suspense fallback={<UtilizationSkeleton />}>
              <LeaveUtilizationCard />
            </Suspense>
            <Suspense fallback={<RecommendationsSkeleton />}>
              <SmartRecommendations />
            </Suspense>
          </div>
        </div>
      )}

      {activeTab === "Calendar" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Suspense fallback={<MiniCalendarSkeleton />}>
              <MiniCalendar />
            </Suspense>
            <Suspense fallback={<HolidayCardSkeleton />}>
              <UpcomingHolidays />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
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

function HolidayCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function UtilizationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
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

function MiniCalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
