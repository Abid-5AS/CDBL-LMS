import { Suspense } from "react";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connection } from "next/server";

async function BalanceContent() {
  await connection();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Leave Balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your current leave balances and accrual information for {currentYear}
        </p>
      </section>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Casual Leave</CardTitle>
            </div>
            <CardDescription>Available casual leave days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-sm text-muted-foreground">Loading balance...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Medical Leave</CardTitle>
            </div>
            <CardDescription>Available sick leave days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-sm text-muted-foreground">Loading balance...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Earned Leave</CardTitle>
            </div>
            <CardDescription>Accrued earned leave days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-sm text-muted-foreground">Loading balance...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BalancePage() {
  return (
    <Suspense fallback={<BalanceFallback />}>
      <BalanceContent />
    </Suspense>
  );
}

function BalanceFallback() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-64 bg-slate-100 rounded animate-pulse" />
      </section>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-10 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
