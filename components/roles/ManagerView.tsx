"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeManagementProfile } from "@/app/employees/components/EmployeeManagementProfile";

type ManagerViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function ManagerView({ employee, viewerRole }: ManagerViewProps) {
  return (
    <EmployeeManagementProfile employee={employee} viewerRole={viewerRole} />
  );
}
