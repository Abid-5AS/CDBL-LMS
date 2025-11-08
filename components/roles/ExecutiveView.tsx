"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeDetailView } from "@/components/shared/EmployeeDetailView";

type ExecutiveViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function ExecutiveView({ employee, viewerRole }: ExecutiveViewProps) {
  return (
    <EmployeeDetailView
      employee={employee}
      viewerRole={viewerRole}
      breadcrumbLabel="Employee Directory"
    />
  );
}

