import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { HelpCircle, AlertCircle } from "lucide-react";
import type { LeaveType } from "../leave-constants";
import { POLICY_TOOLTIPS, LEAVE_OPTIONS } from "../leave-constants";
import { cn } from "@/lib";
import React from "react";

interface LeaveTypeFieldProps {
  type: LeaveType;
  onTypeChange: (type: LeaveType) => void;
  error?: string;
  clearErrors: () => void;
}

export function LeaveTypeField({
  type,
  onTypeChange,
  error,
  clearErrors,
}: LeaveTypeFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="leave-type" className="text-sm font-medium leading-6">
          Leave Type <span className="text-destructive">*</span>
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex items-center">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">{POLICY_TOOLTIPS[type]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={type}
        onValueChange={(value) => {
          onTypeChange(value as LeaveType);
          clearErrors();
        }}
      >
        <SelectTrigger
          id="leave-type"
          className={cn("h-11", error && "border-destructive")}
          aria-label="Leave type"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "type-error" : undefined}
        >
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {LEAVE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p
          id="type-error"
          className="text-sm text-destructive flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
