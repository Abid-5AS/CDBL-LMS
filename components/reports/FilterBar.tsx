"use client";

import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui";
import { Filter } from "lucide-react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

type FilterBarProps = {
  duration: string;
  department: string | null;
  leaveType: string | null;
  onDurationChange: (value: string) => void;
  onDepartmentChange: (value: string | null) => void;
  onLeaveTypeChange: (value: string | null) => void;
};

const LEAVE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "EARNED", label: "Earned Leave" },
  { value: "MEDICAL", label: "Medical Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
  { value: "STUDY", label: "Study Leave" },
  { value: "QUARANTINE", label: "Quarantine Leave" },
];

const DURATION_OPTIONS: Record<string, string> = {
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
};

export function FilterBar({
  duration,
  department,
  leaveType,
  onDurationChange,
  onDepartmentChange,
  onLeaveTypeChange,
}: FilterBarProps) {
  const { data: departmentsData } = useSWR<{ departments: any[] }>(
    "/api/departments",
    apiFetcher
  );
  const departments = departmentsData?.departments || [];

  const departmentLabel =
    department && department !== "all"
      ? departments.find((dept: any) => String(dept.id) === department)?.name
      : null;

  const leaveTypeLabel =
    leaveType && leaveType !== "all"
      ? LEAVE_TYPES.find((type) => type.value === leaveType)?.label
      : null;

  const activeFilterLabels = [
    departmentLabel ? `Dept: ${departmentLabel}` : null,
    leaveTypeLabel ? `Type: ${leaveTypeLabel}` : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="surface-card">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <Filter className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Filters
          </span>
          <span className="text-xs text-muted-foreground">
            {DURATION_OPTIONS[duration] ?? "Custom range"}
          </span>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={duration} onValueChange={onDurationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={department || "all"}
            onValueChange={(value) =>
              onDepartmentChange(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={leaveType || "all"}
            onValueChange={(value) =>
              onLeaveTypeChange(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Leave Types" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeFilterLabels.length > 0 ? (
            <>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active
              </span>
              {activeFilterLabels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              Showing all departments and leave types.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
