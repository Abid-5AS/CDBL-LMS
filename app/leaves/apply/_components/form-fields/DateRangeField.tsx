import {
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
} from "@/components/ui";
import { HelpCircle, AlertCircle, Info } from "lucide-react";
import { DateRangePicker } from "../date-range-picker";
import { fmtDDMMYYYY } from "@/lib/date-utils";
import { cn } from "@/lib";
import React from "react";

interface DateRangeFieldProps {
  dateRange: { start?: Date; end?: Date };
  setDateRange: (range: { start?: Date; end?: Date }) => void;
  holidays: Date[];
  minSelectableDate?: Date;
  submitting: boolean;
  requestedDays: number;
  rangeValidation: any;
  errors: { start?: string; end?: string };
}

export function DateRangeField({
  dateRange,
  setDateRange,
  holidays,
  minSelectableDate,
  submitting,
  requestedDays,
  rangeValidation,
  errors,
}: DateRangeFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="leave-dates" className="text-sm font-medium leading-6">
          Leave Dates <span className="text-destructive">*</span>
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex items-center">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">
                All days in the range count toward balance. Start/End cannot be
                Fri/Sat or holidays.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        holidays={holidays}
        disabled={submitting}
        minDate={minSelectableDate}
        showQuickSelect={false}
      />
      {/* Duration feedback */}
      {dateRange.start && dateRange.end && (
        <div
          className="mt-2 text-sm flex items-center gap-2 text-muted-foreground"
          aria-live="polite"
        >
          <span>Selected:</span>
          <span className="font-semibold text-foreground">
            {requestedDays} day{requestedDays !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">
            ({fmtDDMMYYYY(dateRange.start)} → {fmtDDMMYYYY(dateRange.end)})
          </span>
        </div>
      )}
      {/* Validation feedback */}
      {rangeValidation && !rangeValidation.valid && (
        <p
          className="text-sm text-destructive flex items-center gap-1.5 mt-2"
          role="alert"
        >
          <AlertCircle
            className="h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          {rangeValidation.message}
        </p>
      )}
      {rangeValidation?.containsNonWorking && rangeValidation.valid && (
        <div className="mt-2 rounded-lg border border-data-warning/40 bg-data-warning/10 dark:bg-data-warning/20 px-3 py-2">
          <p className="text-xs text-data-warning font-medium flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            {rangeValidation.message}
          </p>
        </div>
      )}
      {(errors.start || errors.end) && (
        <p
          className="text-sm text-destructive flex items-center gap-1.5 mt-2"
          role="alert"
        >
          <AlertCircle
            className="h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          {errors.start || errors.end}
        </p>
      )}
    </div>
  );
}
