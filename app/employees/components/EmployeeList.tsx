"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { Users } from "lucide-react";

// UI Components (barrel export)
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
} from "@/components/ui";

// Shared Components (barrel export)
import { FilterBar, EmptyState } from "@/components/shared";
import { CompletePagination } from "@/components/shared/pagination/Pagination";

// Lib utilities (barrel export)
import { useUser } from "@/lib";
import { EmployeeCard } from "./EmployeeCard";

// Helper functions for badge styles
function getRoleBadgeClasses(role: string) {
  switch (role) {
    case "CEO": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "HR_HEAD": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800";
    case "HR_ADMIN": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    case "DEPT_HEAD": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800";
  }
}

function getRoleLabel(role: string) {
  return role.replace("_", " ");
}

export type EmployeeRecord = {
  id: number;
  name: string;
  email: string;
  empCode: string | null;
  department: string | null;
  role: "EMPLOYEE" | "DEPT_HEAD" | "HR_ADMIN" | "HR_HEAD" | "CEO";
  leaves?: {
    id: number;
    type: string;
    endDate: string;
  }[];
  profile?: {
    phone: string | null;
  } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

const PAGE_SIZE = 12; // Adjusted for grid view

export function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
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

    // Status Filter (Active vs On Leave)
    if (statusFilter !== "all") {
      if (statusFilter === "on_leave") {
        filtered = filtered.filter(emp => emp.leaves && emp.leaves.length > 0);
      } else if (statusFilter === "active") {
        filtered = filtered.filter(emp => !emp.leaves || emp.leaves.length === 0);
      }
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    return filtered;
  }, [allEmployees, searchQuery, departmentFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage]);


  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[280px] rounded-xl bg-muted/50 animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-danger dark:text-danger/90">
          Failed to load employees. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, code, or department..."
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: "active", label: "Active" },
            { value: "on_leave", label: "On Leave" },
          ],
        }}
        typeFilter={
          departmentOptions.length > 1
            ? {
              value: departmentFilter,
              onChange: setDepartmentFilter,
              options: departmentOptions,
            }
            : undefined
        }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}

      {filteredEmployees.length > 0 && (
        <div className="mt-8 flex justify-center">
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
