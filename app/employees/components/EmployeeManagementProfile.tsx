"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmployeeDashboardData } from "@/lib/employee";
import type { AppRole } from "@/lib/rbac";
import { canEditEmployee } from "@/lib/rbac";
import {
  Button,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import { EmployeeProfileCard } from "./EmployeeProfileCard";
import { HRStatCards } from "@/components/HRStatCards";
import { LeaveHistoryTable } from "./LeaveHistoryTable";
import { Pencil, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EmployeeManagementProfileProps = {
  employee: EmployeeDashboardData;
  viewerRole: AppRole;
};

const getRoleBadgeVariant = (role: AppRole) => {
  switch (role) {
    case "CEO":
      return "bg-card-summary text-card-summary border-card-summary";
    case "HR_HEAD":
      return "bg-data-info text-data-info border-data-info";
    case "HR_ADMIN":
      return "bg-data-info text-data-info border-data-info";
    case "DEPT_HEAD":
      return "bg-data-success text-data-success border-data-success";
    case "EMPLOYEE":
      return "bg-bg-secondary text-text-secondary border-border-strong";
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case "DEPT_HEAD":
      return "Manager";
    case "HR_ADMIN":
      return "HR Admin";
    case "HR_HEAD":
      return "HR Head";
    case "CEO":
      return "CEO";
    default:
      return "Employee";
  }
};

export function EmployeeManagementProfile({
  employee,
  viewerRole,
}: EmployeeManagementProfileProps) {
  const router = useRouter();
  const canEdit = canEditEmployee(viewerRole, employee.role as AppRole);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/employees">Employee Directory</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{employee.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with employee info */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-text-secondary">
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.email}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Badge className={getRoleBadgeVariant(employee.role as AppRole)}>
                {roleLabel(employee.role)}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-data-success"></span>
                <span className="text-sm text-text-secondary">Active</span>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/employees/${employee.id}?edit=true`)
                      }
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Update Employee
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit employee information</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <Ban className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Feature coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      {/* Employee Information Card */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-secondary mb-4">
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

      {/* Leave Statistics Summary */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-secondary mb-4">
          Leave Statistics
        </h2>
        <HRStatCards stats={employee.stats} />
      </div>

      {/* Recent Leave Requests */}
      <div className="rounded-xl border border-border-strong bg-bg-primary p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-secondary mb-4">
          Recent Leave Requests
        </h2>
        <LeaveHistoryTable history={employee.history.slice(0, 5)} />
        {employee.history.length === 0 && (
          <p className="text-sm text-text-secondary mt-4 text-center">
            No leave requests found for this employee.
          </p>
        )}
      </div>
    </div>
  );
}
