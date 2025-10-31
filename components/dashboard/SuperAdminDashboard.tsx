import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemOverviewCards } from "./SystemOverviewCards";
import { RecentAuditLogs } from "./RecentAuditLogs";

type SuperAdminDashboardProps = {
  username: string;
};

export function SuperAdminDashboard({ username }: SuperAdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Super Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {username}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Open Admin Console</Link>
        </Button>
      </section>

      {/* System Overview */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">System Overview</h3>
        <Suspense fallback={<OverviewCardsSkeleton />}>
          <SystemOverviewCards />
        </Suspense>
      </section>

      {/* Recent Audit Logs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Audit Logs</h3>
          <Button asChild variant="ghost" className="text-blue-600">
            <Link href="/admin">View all</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<TableSkeleton />}>
            <RecentAuditLogs />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function OverviewCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="h-auto min-h-[120px]">
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
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

