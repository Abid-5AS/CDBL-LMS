"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeDetailView } from "@/components/shared/EmployeeDetailView";

type HRHeadViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function HRHeadView({ employee, viewerRole }: HRHeadViewProps) {
  return (
    <EmployeeDetailView
      employee={employee}
      viewerRole={viewerRole}
      breadcrumbLabel="Employee Directory"
    />
  );
}
