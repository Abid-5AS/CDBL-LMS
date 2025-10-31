import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingLeaveRequestsTable } from "./PendingLeaveRequestsTable";
import { LeaveTrendChartData } from "./LeaveTrendChartData";
import { LeaveTypePieChartData } from "./LeaveTypePieChartData";
import { HRQuickActions } from "./HRQuickActions";

type HRDashboardProps = {
  username: string;
};

export function HRDashboard({ username }: HRDashboardProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">HR Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {username}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HRQuickActions />
        </div>
      </section>

      {/* Pending Leave Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Pending Leave Requests</h3>
          <Button asChild variant="ghost" className="text-blue-600">
            <Link href="/approvals">View all</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Suspense fallback={<TableSkeleton />}>
            <PendingLeaveRequestsTable />
          </Suspense>
        </div>
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
        <div key={i} className="h-16 w-full bg-slate-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[250px] w-full bg-slate-200 rounded animate-pulse" />
  );
}

