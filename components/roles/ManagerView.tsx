"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeDetailView } from "@/components/shared/EmployeeDetailView";

type ManagerViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

export function ManagerView({ employee, viewerRole }: ManagerViewProps) {
  return (
    <EmployeeDetailView
      employee={employee}
      viewerRole={viewerRole}
      breadcrumbLabel="Team"
    />
  );
}

