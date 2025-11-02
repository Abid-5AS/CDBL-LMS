import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllRequests, canViewEmployee, canEditEmployee, type AppRole } from "@/lib/rbac";
import { getEmployeeDashboardData } from "@/lib/employee";
import { EmployeeEditForm } from "../components/EmployeeEditForm";
import { EmployeeView } from "@/components/roles/EmployeeView";
import { ManagerView } from "@/components/roles/ManagerView";
import { HRAdminView } from "@/components/roles/HRAdminView";
import { HRHeadView } from "@/components/roles/HRHeadView";
import { ExecutiveView } from "@/components/roles/ExecutiveView";
import { prisma } from "@/lib/prisma";

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
  
  if (!user) {
    redirect("/login");
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

  // Check for edit mode
  const isEditMode = query.edit === "true";
  const canEdit = canEditEmployee(user.role as AppRole, data.role as AppRole);

  // Render edit form if in edit mode and user has permission
  if (isEditMode && canEdit) {
    return <EmployeeEditForm employee={data} viewerRole={user.role as AppRole} />;
  }

  // Determine viewing context for normal views
  const isSelfView = user.id === employeeId;
  const viewerRole = user.role as AppRole;
  const targetRole = data.role as AppRole;

  // Render appropriate role-specific view
  if (isSelfView) {
    // Employee viewing their own profile
    return <EmployeeView employee={data} />;
  }

  // HR Admin or HR Head or CEO viewing employee
  if (["HR_ADMIN", "HR_HEAD", "CEO"].includes(viewerRole)) {
    if (viewerRole === "HR_ADMIN") {
      return <HRAdminView employee={data} viewerRole={viewerRole} />;
    } else if (viewerRole === "HR_HEAD") {
      return <HRHeadView employee={data} viewerRole={viewerRole} />;
    } else if (viewerRole === "CEO") {
      return <ExecutiveView employee={data} viewerRole={viewerRole} />;
    }
  }

  // Dept Head viewing team member in their department
  if (viewerRole === "DEPT_HEAD") {
    const viewer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { department: true },
    });
    if (viewer?.department && data.department === viewer.department) {
      return <ManagerView employee={data} viewerRole={viewerRole} />;
    }
  }

  // Fallback - should not reach here due to canViewEmployee check
  return <EmployeeView employee={data} />;
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
