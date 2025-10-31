import { Suspense } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getUserRole } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";
import { EmployeeDashboardUnified } from "@/components/dashboard/EmployeeDashboardUnified";
import { HRDashboard } from "@/components/dashboard/HRDashboard";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const username = user.name ?? "User";

  // Super Admin keeps sidebar layout
  if (role === "SUPER_ADMIN") {
    return (
      <AppShell title="Dashboard" pathname="/dashboard">
        <Suspense fallback={<DashboardFallback />}>
          <SuperAdminDashboard username={username} />
        </Suspense>
      </AppShell>
    );
  }

  // Unified layout for Employee and HR Admin (handled by LayoutWrapper)
  return (
    <Suspense fallback={<DashboardFallback />}>
      {role === "HR_ADMIN" ? (
        <HRDashboard username={username} />
      ) : (
        <EmployeeDashboardUnified username={username} />
      )}
    </Suspense>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-12 rounded-xl border border-slate-200 bg-white" />
          <div className="h-64 rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
          <div className="h-32 rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
