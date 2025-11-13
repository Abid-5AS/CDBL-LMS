"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Users, User, Pencil } from "lucide-react";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableBody,
  EnhancedTableHead,
  EnhancedTableRow,
  EnhancedTableCell,
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

// Shared Components (barrel export)
import { FilterBar, EmptyState } from "@/components/shared";
import { CompletePagination } from "@/components/shared/pagination/Pagination";

// Lib utilities (barrel export)
import { useUser } from "@/lib";
import { canEditEmployee, type AppRole } from "@/lib/rbac";
import { getRoleBadgeClasses, getRoleLabel } from "@/lib/ui-utils";

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

const PAGE_SIZE = 20;

export function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, roleFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage]);


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
        <div className="max-h-[70vh] overflow-y-auto">
          <EnhancedTable>
            <EnhancedTableHeader>
              <EnhancedTableRow>
                <EnhancedTableHead>Name</EnhancedTableHead>
                <EnhancedTableHead className="hidden sm:table-cell">Email</EnhancedTableHead>
                <EnhancedTableHead className="hidden md:table-cell">
                  Employee Code
                </EnhancedTableHead>
                <EnhancedTableHead className="hidden lg:table-cell">
                  Department
                </EnhancedTableHead>
                <EnhancedTableHead>Role</EnhancedTableHead>
                <EnhancedTableHead className="text-right">Actions</EnhancedTableHead>
              </EnhancedTableRow>
            </EnhancedTableHeader>
            <EnhancedTableBody>
                {paginatedEmployees.map((employee) => (
                  <EnhancedTableRow
                    key={employee.id}
                    className="hover:bg-bg-secondary dark:hover:bg-bg-secondary/50"
                  >
                    <EnhancedTableCell className="font-medium text-text-primary">
                      {employee.name}
                    </EnhancedTableCell>
                    <EnhancedTableCell className="hidden sm:table-cell text-muted-foreground">
                      {employee.email}
                    </EnhancedTableCell>
                    <EnhancedTableCell className="hidden md:table-cell text-muted-foreground">
                      {employee.empCode || "—"}
                    </EnhancedTableCell>
                    <EnhancedTableCell className="hidden lg:table-cell text-muted-foreground">
                      {employee.department || "—"}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeClasses(employee.role)}
                      >
                        {getRoleLabel(employee.role)}
                      </Badge>
                    </EnhancedTableCell>
                    <EnhancedTableCell className="text-right">
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
                    </EnhancedTableCell>
                  </EnhancedTableRow>
                ))}
            </EnhancedTableBody>
          </EnhancedTable>
        </div>
      )}

      {filteredEmployees.length > 0 && (
        <div className="mt-6">
          <CompletePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalItems={filteredEmployees.length}
            onPageChange={setCurrentPage}
            showFirstLast={true}
          />
        </div>
      )}
    </div>
  );
}
