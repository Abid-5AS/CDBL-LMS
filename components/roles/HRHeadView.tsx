"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeManagementProfile } from "@/app/employees/components/EmployeeManagementProfile";

type HRHeadViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function HRHeadView({ employee, viewerRole }: HRHeadViewProps) {
  return (
    <EmployeeManagementProfile employee={employee} viewerRole={viewerRole} />
  );
}
