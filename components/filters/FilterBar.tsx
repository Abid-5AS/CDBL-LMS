"use client";

import { useState } from "react";
import { SearchInput } from "./SearchInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  onClear?: () => void;
  className?: string;
};

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  typeFilter,
  onClear,
  className,
}: FilterBarProps) {
  const hasActiveFilters = searchValue || statusFilter?.value || typeFilter?.value;

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className || ""}`}>
      <div className="flex-1 min-w-0">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
      {statusFilter && (
        <Select value={statusFilter.value} onValueChange={statusFilter.onChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Leave Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeFilter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasActiveFilters && onClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="whitespace-nowrap">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

