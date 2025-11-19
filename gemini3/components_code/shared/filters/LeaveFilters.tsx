/**
 * Reusable filter components for leave requests
 * Used across multiple dashboards for consistent filtering UI
 */

"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { getStatusColors, Select, StatusColors } from "@/lib";
import { LEAVE_TYPE_OPTIONS, getStatusOptions } from "@/lib/constants";

/**
 * Status filter chips
 * Role-aware status options based on user role
 */
type StatusFilterProps = {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  userRole?: string;
  className?: string;
};

export function StatusFilter({
  selectedStatus,
  onStatusChange,
  userRole = "EMPLOYEE",
  className,
}: StatusFilterProps) {
  const statusOptions = getStatusOptions(userRole);

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-muted-foreground mb-2 block">
        Status
      </Label>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const statusValue =
            option.value === "all" ? "ALL" : option.value.toUpperCase();
          const isSelected = selectedStatus === statusValue;
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors whitespace-nowrap",
                isSelected
                  ? getStatusColors(
                      option.value === "FORWARDED"
                        ? "FORWARDED"
                        : option.value.toUpperCase(),
                      "chip"
                    )
                  : "hover:bg-accent/20"
              )}
              onClick={() => onStatusChange(statusValue)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Leave type filter chips
 */
type LeaveTypeFilterProps = {
  selectedType: string;
  onTypeChange: (type: string) => void;
  className?: string;
};

export function LeaveTypeFilter({
  selectedType,
  onTypeChange,
  className,
}: LeaveTypeFilterProps) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-muted-foreground mb-2 block">
        Leave Type
      </Label>
      <div className="flex flex-wrap gap-2">
        {LEAVE_TYPE_OPTIONS.map((option) => {
          const typeValue = option.value === "all" ? "ALL" : option.value;
          const isSelected = selectedType === typeValue;
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer rounded-full px-2 py-1 text-xs transition-colors whitespace-nowrap",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent/20"
              )}
              onClick={() => onTypeChange(typeValue)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Combined filter section with sticky positioning
 * Includes both status and type filters
 */
type CombinedFilterSectionProps = {
  selectedStatus: string;
  selectedType: string;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
  userRole?: string;
  sticky?: boolean;
};

export function CombinedFilterSection({
  selectedStatus,
  selectedType,
  onStatusChange,
  onTypeChange,
  userRole = "EMPLOYEE",
  sticky = true,
}: CombinedFilterSectionProps) {
  return (
    <Card
      className={cn(
        "bg-card border-b border-border pb-4 mb-4 shadow-sm",
        sticky && "sticky top-0 z-20 -mx-6 px-6 -mt-4"
      )}
    >
      <div className="flex flex-col gap-3 pt-2">
        <StatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={onStatusChange}
          userRole={userRole}
        />
        <LeaveTypeFilter
          selectedType={selectedType}
          onTypeChange={onTypeChange}
        />
      </div>
    </Card>
  );
}
