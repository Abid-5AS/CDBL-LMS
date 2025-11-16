import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsContent } from "./components/ReportsContent";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow HR_ADMIN, HR_HEAD, and CEO to access reports
  if (!["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Strategic Insights
            </p>
            <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor organizational leave health, spot risk early, and export data for board reviews.
            </p>
          </div>
          <div className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </section>
      <Suspense fallback={<ReportsFallback />}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-card/90 rounded-2xl animate-pulse border border-border shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 bg-card/90 rounded-2xl animate-pulse border border-border shadow-sm" />
        ))}
      </div>
      <div className="h-48 bg-card/90 rounded-2xl animate-pulse border border-border shadow-sm" />
    </div>
  );
}
