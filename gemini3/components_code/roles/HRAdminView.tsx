"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeManagementProfile } from "@/app/employees/components/EmployeeManagementProfile";

type HRAdminViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function HRAdminView({ employee, viewerRole }: HRAdminViewProps) {
  return (
    <EmployeeManagementProfile employee={employee} viewerRole={viewerRole} />
  );
}
