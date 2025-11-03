import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingLeaveRequestsTable } from "./PendingLeaveRequestsTable";
import { LeaveTrendChartData } from "./LeaveTrendChartData";
import { LeaveTypePieChartData } from "./LeaveTypePieChartData";
import { HRQuickActions } from "./HRQuickActions";
import { CancellationRequestsPanel } from "./CancellationRequestsPanel";

type HRDashboardProps = {
  username: string;
};

export function HRDashboard({ username }: HRDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm md:flex-row md:items-center md:justify-between" aria-label="HR Admin Dashboard Header">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">HR Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {username}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HRQuickActions />
        </div>
      </section>

      {/* Pending Leave Requests */}
      <section className="space-y-4" aria-label="Pending leave requests">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
          <h3 className="text-lg font-semibold text-foreground">Pending Leave Requests</h3>
          <Button asChild variant="ghost" className="text-blue-600">
            <Link href="/approvals">View all</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={<TableSkeleton />}>
            <PendingLeaveRequestsTable />
          </Suspense>
        </div>
      </section>

      {/* Cancellation Requests */}
      <section className="space-y-4" aria-label="Cancellation requests">
        <h3 className="text-lg font-semibold text-foreground">Cancellation Requests</h3>
        <Suspense fallback={<CardSkeleton />}>
          <CancellationRequestsPanel />
        </Suspense>
      </section>

      {/* Analytics Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="h-auto min-h-[300px]">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <LeaveTrendChartData />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="h-auto min-h-[300px]">
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <LeaveTypePieChartData />
            </Suspense>
          </CardContent>
        </Card>
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

