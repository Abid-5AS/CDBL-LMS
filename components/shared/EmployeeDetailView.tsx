"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { canEditEmployee } from "@/lib/rbac";
import { Button, Badge } from "@/components/ui";
import { EmployeeProfileCard } from "./EmployeeProfileCard";
import { LeaveHistoryTable } from "./LeaveHistoryTable";
import { ModernHRStatCards } from "@/components/ModernHRStatCards";
import { Pencil } from "lucide-react";

type EmployeeDetailViewProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
  breadcrumbLabel?: string;
};

const getRoleBadgeVariant = (role: AppRole) => {
  switch (role) {
    case "CEO":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
    case "HR_HEAD":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    case "HR_ADMIN":
      return "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800";
    case "DEPT_HEAD":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    case "EMPLOYEE":
      return "bg-secondary text-secondary-foreground border-secondary dark:bg-secondary/20 dark:text-secondary-foreground dark:border-secondary";
    case "SYSTEM_ADMIN":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case "DEPT_HEAD":
      return "Department Head";
    case "HR_ADMIN":
      return "HR Admin";
    case "HR_HEAD":
      return "HR Head";
    case "CEO":
      return "CEO";
    case "SYSTEM_ADMIN":
      return "System Admin";
    default:
      return "Employee";
  }
};

/**
 * Unified Employee Detail View
 * Used by all roles to view employee information consistently
 */
export function EmployeeDetailView({
  employee,
  viewerRole,
  breadcrumbLabel = "Employees",
}: EmployeeDetailViewProps) {
  const router = useRouter();
  const canEdit = canEditEmployee(viewerRole, employee.role as AppRole);
  const showStats = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(
    viewerRole
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/employees"
          className="hover:text-foreground transition-colors"
        >
          {breadcrumbLabel}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{employee.name}</span>
      </nav>

      {/* Header with employee info */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.email}
            </p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={getRoleBadgeVariant(employee.role as AppRole)}
              >
                {roleLabel(employee.role)}
              </Badge>
              {employee.department && (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground"
                >
                  {employee.department}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/employees/${employee.id}?edit=true`)}
              className="shrink-0"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Employee Information Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Employee Information
        </h2>
        <EmployeeProfileCard
          name={employee.name}
          email={employee.email}
          department={employee.department}
          designation={employee.designation}
          manager={employee.manager}
          joiningDate={employee.joiningDate}
          employmentStatus={employee.employmentStatus}
        />
      </div>

      {/* Leave Statistics Summary - Only for HR roles */}
      {showStats && employee.stats && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Leave Statistics
          </h2>
          <ModernHRStatCards stats={employee.stats} />
        </div>
      )}

      {/* Recent Leave Requests */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Leave History
          {employee.history.length > 10 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (Last 10 requests)
            </span>
          )}
        </h2>
        {employee.history.length > 0 ? (
          <LeaveHistoryTable history={employee.history.slice(0, 10)} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No leave requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
