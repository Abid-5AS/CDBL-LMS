"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Users, User, Pencil } from "lucide-react";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

// Shared Components (barrel export)
import { FilterBar } from "@/components/shared";

// Lib utilities (barrel export)
import { useUser } from "@/lib";
import { canEditEmployee, type AppRole } from "@/lib/rbac";

type EmployeeRecord = {
  id: number;
  name: string;
  email: string;
  empCode: string | null;
  department: string | null;
  role: "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO";
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "DEPT_HEAD", label: "Department Head" },
  { value: "HR_ADMIN", label: "HR Admin" },
  { value: "HR_HEAD", label: "HR Head" },
  { value: "CEO", label: "CEO" },
];

export function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const user = useUser();

  const { data, isLoading, error } = useSWR<{ users: EmployeeRecord[] }>(
    "/api/auth/users",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const allEmployees: EmployeeRecord[] = Array.isArray(data?.users)
    ? data.users
    : [];

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    allEmployees.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts).sort();
  }, [allEmployees]);

  const departmentOptions = departments.map((dept) => ({
    value: dept,
    label: dept,
  }));

  const filteredEmployees = useMemo(() => {
    let filtered = allEmployees;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          (emp.empCode?.toLowerCase().includes(query) ?? false) ||
          (emp.department?.toLowerCase().includes(query) ?? false)
      );
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((emp) => emp.role === roleFilter);
    }

    return filtered;
  }, [allEmployees, searchQuery, departmentFilter, roleFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setRoleFilter("all");
  };

  const roleLabel = (role: EmployeeRecord["role"]) => {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading employees...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-data-error">
          Failed to load employees. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, code, or department..."
        statusFilter={
          departmentOptions.length > 0
            ? {
                value: departmentFilter,
                onChange: setDepartmentFilter,
                options: departmentOptions,
              }
            : undefined
        }
        typeFilter={{
          value: roleFilter,
          onChange: setRoleFilter,
          options: ROLE_OPTIONS,
        }}
        onClear={clearFilters}
      />

      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title={
                allEmployees.length === 0
                  ? "No employees found"
                  : "No matching employees"
              }
              description={
                allEmployees.length === 0
                  ? "No employees are registered in the system."
                  : "Try adjusting your search or filters."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Employee Code
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Department
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-bg-secondary dark:hover:bg-bg-secondary/50"
                  >
                    <TableCell className="font-medium text-text-primary">
                      {employee.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {employee.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {employee.empCode || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {employee.department || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          employee.role === "CEO"
                            ? "bg-card-summary text-card-summary border-card-summary"
                            : employee.role === "HR_HEAD"
                            ? "bg-data-info text-data-info border-data-info"
                            : employee.role === "HR_ADMIN"
                            ? "bg-data-info text-data-info border-data-info"
                            : employee.role === "DEPT_HEAD"
                            ? "bg-data-success text-data-success border-data-success"
                            : "bg-bg-secondary text-text-secondary border-bg-muted"
                        }
                      >
                        {roleLabel(employee.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/employees/${employee.id}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              View employee profile
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {user &&
                          canEditEmployee(
                            user.role as AppRole,
                            employee.role
                          ) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={`/employees/${employee.id}?edit=true`}
                                  >
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Update employee</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredEmployees.length !== allEmployees.length && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredEmployees.length} of {allEmployees.length} employees
        </p>
      )}
    </div>
  );
}
