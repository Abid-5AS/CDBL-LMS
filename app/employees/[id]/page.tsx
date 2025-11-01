import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllRequests, canViewEmployee, type AppRole } from "@/lib/rbac";
import { getEmployeeDashboardData } from "@/lib/employee";
import { EmployeeDashboard } from "../components/EmployeeDashboard";

type EmployeePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function EmployeeDetailPage(props: EmployeePageProps) {
  return (
    <Suspense fallback={<EmployeeDashboardFallback />}>
      <EmployeeDashboardSection {...props} />
    </Suspense>
  );
}

async function EmployeeDashboardSection({ params, searchParams }: EmployeePageProps) {
  noStore();
  const user = await getCurrentUser();
  
  if (!user || !canViewAllRequests(user.role as AppRole)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const query = await searchParams;

  const employeeId = Number(id);
  if (Number.isNaN(employeeId)) {
    notFound();
  }

  const data = await getEmployeeDashboardData(employeeId);
  if (!data) {
    notFound();
  }

  // Check if user can view this specific employee
  if (!canViewEmployee(user.role as AppRole, data.role as AppRole)) {
    notFound();
  }

  const pendingRequestQuery = query.request;
  const queryRequestId = typeof pendingRequestQuery === "string" ? Number(pendingRequestQuery) : NaN;
  const pendingRequestId = Number.isNaN(queryRequestId) ? data.pendingRequestId ?? undefined : queryRequestId;

  // Determine viewing context
  const isHRView = ["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role);

  return <EmployeeDashboard data={data} pendingRequestId={pendingRequestId} viewerRole={user.role as AppRole} isHRView={isHRView} />;
}

function EmployeeDashboardFallback() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="mt-4 space-y-3">
        <div className="h-28 rounded-lg bg-slate-100" />
        <div className="h-28 rounded-lg bg-slate-100" />
        <div className="h-48 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
