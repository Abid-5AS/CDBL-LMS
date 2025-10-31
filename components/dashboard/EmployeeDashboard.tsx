import Link from "next/link";
import { Suspense } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceSummaryCards } from "@/app/dashboard/components/balance-summary-cards";
import { RequestsTable } from "@/app/dashboard/components/requests-table";
import { UpcomingHolidays } from "./UpcomingHolidays";

type EmployeeDashboardProps = {
  username: string;
};

export function EmployeeDashboard({ username }: EmployeeDashboardProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back, {username}</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your leave requests and track your balance</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/leaves/apply">
            <Plus className="mr-2 h-4 w-4" />
            Apply Leave
          </Link>
        </Button>
      </section>

      {/* Balance Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<BalanceCardSkeleton />}>
          <BalanceSummaryCards />
        </Suspense>
        <Suspense fallback={<HolidayCardSkeleton />}>
          <UpcomingHolidays />
        </Suspense>
      </section>

      {/* Recent Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Leave Requests</h3>
          <Button asChild variant="ghost" className="text-blue-600">
            <Link href="/leaves">View all</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Suspense fallback={<TableSkeleton />}>
            <RequestsTable />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function BalanceCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="h-auto min-h-[120px]">
          <CardHeader>
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function HolidayCardSkeleton() {
  return (
    <Card className="h-auto min-h-[120px]">
      <CardHeader>
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

