"use client";

import Link from "next/link";
import { Suspense } from "react";
import useSWR from "swr";
import { Plus, Users, FileText, Calendar } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { PendingLeaveRequestsTable } from "../hr-admin/sections/PendingApprovals";
import { CancellationRequestsPanel } from "../hr-admin/sections/CancellationRequests";
import {
  ChartContainer,
  TrendChart,
  TypePie,
} from "@/components/shared/LeaveCharts";
import { fromDashboardAgg } from "@/components/shared/LeaveCharts/adapters";
import {
  QuickActions,
  type QuickAction,
} from "@/components/shared/QuickActions";
import { apiFetcher } from "@/lib/apiClient";

type HRDashboardProps = {
  username: string;
};

interface LeaveTrendData {
  data: Array<{ month: string; leaves: number }>;
}

interface HRAdminStats {
  leaveTypeBreakdown: Array<{
    type: string;
    count: number;
    totalDays: number;
  }>;
}

export function HRDashboard({ username }: HRDashboardProps) {
  // Fetch leave trend data
  const { data: trendData, isLoading: trendLoading } = useSWR<LeaveTrendData>(
    "/api/dashboard/leave-trend",
    apiFetcher
  );

  // Fetch leave type distribution data
  const { data: statsData, isLoading: statsLoading } = useSWR<HRAdminStats>(
    "/api/dashboard/hr-admin/stats",
    apiFetcher
  );

  // Transform trend data for the chart
  const chartTrendData = trendData?.data?.map((item) => ({
    month: item.month,
    leaves: item.leaves,
  })) || [];

  // Transform type distribution data for the pie chart
  const pieData = statsData?.leaveTypeBreakdown?.map((item) => ({
    name: item.type,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm md:flex-row md:items-center md:justify-between"
        aria-label="HR Admin Dashboard Header"
      >
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            HR Admin Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {username}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <QuickActions
            actions={[
              { label: "Add Holiday", icon: Calendar, href: "/admin/holidays" },
              { label: "Manage Employees", icon: Users, href: "/employees" },
              { label: "Audit Logs", icon: FileText, href: "/admin/audit" },
              { label: "Review Policies", icon: FileText, href: "/policies" },
            ]}
            variant="dropdown"
          />
        </div>
      </section>

      {/* Pending Leave Requests */}
      <section className="space-y-4" aria-label="Pending leave requests">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
          <h3 className="text-lg font-semibold text-foreground">
            Pending Leave Requests
          </h3>
          <Link href="/approvals">
            <Button variant="ghost" className="text-data-info">
              View all
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={<TableSkeleton />}>
            <PendingLeaveRequestsTable />
          </Suspense>
        </div>
      </section>

      {/* Cancellation Requests */}
      <section className="space-y-4" aria-label="Cancellation requests">
        <h3 className="text-lg font-semibold text-foreground">
          Cancellation Requests
        </h3>
        <Suspense fallback={<CardSkeleton />}>
          <CancellationRequestsPanel />
        </Suspense>
      </section>

      {/* Analytics Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Monthly Leave Trend"
          loading={trendLoading}
          empty={!trendLoading && chartTrendData.length === 0}
          height={300}
        >
          <TrendChart data={chartTrendData} height={300} />
        </ChartContainer>
        <ChartContainer
          title="Leave Type Distribution"
          loading={statsLoading}
          empty={!statsLoading && pieData.length === 0}
          height={300}
        >
          <TypePie data={pieData} height={300} />
        </ChartContainer>
      </section>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[250px] w-full" />;
}

function CardSkeleton() {
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
