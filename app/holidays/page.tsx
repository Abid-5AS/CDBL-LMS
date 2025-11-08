import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { ModernHolidaysView } from "./components/ModernHolidaysView";

async function HolidaysPageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();

  // Both Employee and HR Admin use unified layout
  if (role !== "EMPLOYEE" && role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  return <ModernHolidaysView role={role} />;
}

export default function HolidaysPage() {
  return (
    <Suspense fallback={<HolidaysPageFallback />}>
      <HolidaysPageWrapper />
    </Suspense>
  );
}

function HolidaysPageFallback() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <section className="rounded-3xl border border-border/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40">
        <div className="h-8 w-48 bg-slate-200/70 dark:bg-slate-700 animate-pulse rounded-lg" />
        <div className="mt-3 h-4 w-64 bg-slate-200/60 dark:bg-slate-700/80 animate-pulse rounded" />
      </section>
      <section className="rounded-3xl border border-border/60 bg-white/80 dark:bg-slate-900/30 backdrop-blur-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800/80"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
