"use client";

import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  };
  typeFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  };
  departmentFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  };
  onClear?: () => void;
  className?: string;
};

/**
 * Unified Filter Bar Component
 * Reusable filter component for tables and lists
 * Supports search, status, type, and department filters
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  typeFilter,
  departmentFilter,
  onClear,
  className,
}: FilterBarProps) {
  const hasFilters =
    searchValue ||
    (statusFilter && statusFilter.value !== "all") ||
    (typeFilter && typeFilter.value !== "all") ||
    (departmentFilter && departmentFilter.value !== "all");

  const handleClear = () => {
    onSearchChange("");
    statusFilter?.onChange("all");
    typeFilter?.onChange("all");
    departmentFilter?.onChange("all");
    onClear?.();
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card",
        className
      )}
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {statusFilter && (
        <Select
          value={statusFilter.value}
          onValueChange={statusFilter.onChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusFilter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {typeFilter && (
        <Select value={typeFilter.value} onValueChange={typeFilter.onChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {typeFilter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {departmentFilter && (
        <Select
          value={departmentFilter.value}
          onValueChange={departmentFilter.onChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentFilter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
