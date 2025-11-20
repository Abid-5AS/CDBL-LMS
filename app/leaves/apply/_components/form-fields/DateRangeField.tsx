import {
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
} from "@/components/ui";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { HelpCircle, AlertCircle, Info } from "lucide-react";
import { fmtDDMMYYYY, type Holiday } from "@/lib/date-utils";
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

// Get backdate info based on minSelectableDate
function getBackdateInfo(minDate?: Date) {
  if (!minDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDateMidnight = new Date(minDate);
  minDateMidnight.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - minDateMidnight.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) {
    return { canBackdate: false, days: 0 };
  }
  return { canBackdate: true, days: daysDiff };
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
  const backdateInfo = getBackdateInfo(minSelectableDate);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="leave-dates" className="text-sm font-medium">
        Leave Dates <span className="text-destructive">*</span>
      </Label>
      
      {/* Backdate Policy Info */}
      {backdateInfo && (
        <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {backdateInfo.canBackdate ? (
              <>This leave type can be backdated up to <strong>{backdateInfo.days} days</strong> from today.</>
            ) : (
              <>This leave type cannot be backdated. Dates must be from today onwards.</>
            )}
          </p>
        </div>
      )}
      
      <DateRangePicker
        value={{ start: dateRange.start, end: dateRange.end }}
        onChange={(range) => setDateRange({ start: range.start, end: range.end })}
        holidays={holidays.map((d) => ({ date: d.toISOString().split('T')[0], name: 'Holiday' }))}
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
