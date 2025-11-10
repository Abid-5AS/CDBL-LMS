"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeDetailView } from "@/components/shared";

type HRAdminViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function HRAdminView({ employee, viewerRole }: HRAdminViewProps) {
  return (
    <EmployeeDetailView
      employee={employee}
      viewerRole={viewerRole}
      breadcrumbLabel="Employee Directory"
    />
  );
}
