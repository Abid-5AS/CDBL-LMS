"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, User, Pencil } from "lucide-react";
import { FilterBar } from "@/components/filters/FilterBar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { canEditEmployee, type AppRole } from "@/lib/rbac";
import { useUser } from "@/lib/user-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const { data, isLoading, error } = useSWR<{ users: EmployeeRecord[] }>("/api/auth/users", fetcher, {
    revalidateOnFocus: false,
  });

  const allEmployees: EmployeeRecord[] = Array.isArray(data?.users) ? data.users : [];

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    allEmployees.forEach((emp) => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts).sort();
  }, [allEmployees]);

  const departmentOptions = departments.map((dept) => ({ value: dept, label: dept }));

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
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading employees...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
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
              title={allEmployees.length === 0 ? "No employees found" : "No matching employees"}
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
                  <TableHead className="hidden md:table-cell">Employee Code</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{employee.email}</TableCell>
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
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : employee.role === "HR_HEAD"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : employee.role === "HR_ADMIN"
                            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                            : employee.role === "DEPT_HEAD"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
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
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/employees/${employee.id}`}>View</Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View employee profile</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {user && canEditEmployee(user.role as AppRole, employee.role) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/employees/${employee.id}?edit=true`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
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

