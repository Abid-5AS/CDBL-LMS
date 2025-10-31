import { Suspense } from "react";
import { connection } from "next/server";
import AppShell from "@/components/app-shell";
import { HolidaysList } from "./components/HolidaysList";

async function HolidaysContent() {
  await connection();
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Company Holidays</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View upcoming holidays and calendar for {currentYear}
        </p>
      </section>
      <Suspense fallback={<HolidaysListSkeleton />}>
        <HolidaysList />
      </Suspense>
    </div>
  );
}

export default function HolidaysPage() {
  return (
    <AppShell title="Holidays" pathname="/holidays">
      <Suspense fallback={<HolidaysPageFallback />}>
        <HolidaysContent />
      </Suspense>
    </AppShell>
  );
}

function HolidaysPageFallback() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-96 bg-slate-100 rounded animate-pulse" />
      </section>
      <HolidaysListSkeleton />
    </div>
  );
}

function HolidaysListSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
