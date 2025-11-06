"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type FilterBarProps = {
  duration: string;
  department: string | null;
  leaveType: string | null;
  onDurationChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onLeaveTypeChange: (value: string) => void;
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

export function FilterBar({
  duration,
  department,
  leaveType,
  onDurationChange,
  onDepartmentChange,
  onLeaveTypeChange,
}: FilterBarProps) {
  const { data: departmentsData } = useSWR("/api/departments", fetcher);
  const departments = departmentsData?.departments || [];

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <Select value={duration} onValueChange={onDurationChange}>
            <SelectTrigger className="w-[140px]">
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
            onValueChange={(value) => onDepartmentChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
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
            onValueChange={(value) => onLeaveTypeChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[160px]">
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
        </div>
      </CardContent>
    </Card>
  );
}

