import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole, type UserRole } from "@/lib/navigation";
import { EmployeeDashboardUnified } from "@/components/dashboard/EmployeeDashboardUnified";
import { HRDashboard } from "@/components/dashboard/HRDashboard";

async function DashboardContent() {
  noStore();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = user.role as UserRole;
  const username = user.name ?? "User";

  // Redirect non-employee/non-HR_ADMIN roles to their proper dashboard
  const properHome = getHomePageForRole(role);
  if (role !== "EMPLOYEE" && role !== "HR_ADMIN" && properHome !== "/dashboard") {
    redirect(properHome);
  }

  // Render appropriate dashboard for EMPLOYEE and HR_ADMIN
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
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="h-36 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse" />
        ))}
      </div>
    </div>
  );
}
