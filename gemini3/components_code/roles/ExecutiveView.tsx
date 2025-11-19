"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeManagementProfile } from "@/app/employees/components/EmployeeManagementProfile";

type ExecutiveViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function ExecutiveView({ employee, viewerRole }: ExecutiveViewProps) {
  return (
    <EmployeeManagementProfile employee={employee} viewerRole={viewerRole} />
  );
}
