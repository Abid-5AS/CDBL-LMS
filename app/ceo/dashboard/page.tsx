import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";

async function CEODashboardContent() {
  const user = await getCurrentUser();

  if (!user || user.role !== "CEO") {
    redirect("/dashboard");
  }

  const username = user.name ?? "Executive";

  return <SuperAdminDashboard username={username} />;
}

export default function CEODashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <CEODashboardContent />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
        <div className="h-64 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
      </div>
    </div>
  );
}
