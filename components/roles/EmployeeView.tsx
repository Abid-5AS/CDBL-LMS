"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { EmployeeDetailView } from "@/components/shared";

type EmployeeViewProps = {
  employee: EmployeeDashboardData;
};

export function EmployeeView({ employee }: EmployeeViewProps) {
  return (
    <EmployeeDetailView
      employee={employee}
      viewerRole={employee.role as AppRole}
      breadcrumbLabel="Dashboard"
    />
  );
}
