import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { HolidaysList } from "./components/HolidaysList";

export default function HolidaysPage() {
  return (
    <AppShell title="Holidays" pathname="/holidays">
      <div className="max-w-7xl mx-auto p-6">
        <Suspense fallback={<HolidaysListSkeleton />}>
          <HolidaysList />
        </Suspense>
      </div>
    </AppShell>
  );
}

function HolidaysListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-slate-200 rounded animate-pulse" />
      ))}
    </div>
  );
}
