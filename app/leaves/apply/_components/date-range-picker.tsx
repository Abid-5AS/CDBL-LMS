"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isWeekendOrHoliday, fmtDDMMYYYY, totalDaysInclusive } from "@/lib/date-utils";
import type { Holiday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

interface DateRangePickerProps {
  value: { start: Date | undefined; end: Date | undefined };
  onChange: (range: { start: Date | undefined; end: Date | undefined }) => void;
  holidays: Holiday[];
  disabled?: boolean;
  minDate?: Date;
  showQuickSelect?: boolean;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  holidays, 
  disabled, 
  minDate,
  showQuickSelect = true,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<{ start?: Date; end?: Date } | null>(null);

  // Auto-swap logic: if user selects end date before start, swap them
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({ start: undefined, end: undefined });
      return;
    }

    // Auto-swap if end < start
    if (range.from && range.to && range.to < range.from) {
      const swappedRange = { from: range.to, to: range.from };
      
      // Validate swapped dates
      if (isWeekendOrHoliday(swappedRange.from, holidays)) {
        toast.error("Start date cannot be on Friday, Saturday, or a company holiday");
        return;
      }
      if (isWeekendOrHoliday(swappedRange.to, holidays)) {
        toast.error("End date cannot be on Friday, Saturday, or a company holiday");
        return;
      }
      
      onChange({ start: swappedRange.from, end: swappedRange.to });
      return;
    }

    // Normal flow validation
    if (range.from && isWeekendOrHoliday(range.from, holidays)) {
      toast.error("Start date cannot be on Friday, Saturday, or a company holiday");
      return;
    }

    if (range.to && isWeekendOrHoliday(range.to, holidays)) {
      toast.error("End date cannot be on Friday, Saturday, or a company holiday");
      return;
    }

    onChange({ start: range.from, end: range.to });
  };

  const handleClear = () => {
    onChange({ start: undefined, end: undefined });
  };

  const handleQuickSelect = (type: "today" | "tomorrow" | "nextWeek") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start: Date;
    let end: Date;
    
    switch (type) {
      case "today":
        start = today;
        end = today;
        break;
      case "tomorrow":
        start = addDays(today, 1);
        end = start;
        break;
      case "nextWeek":
        start = addDays(today, 7);
        end = addDays(start, 2); // 3 days total
        break;
    }
    
    // Check if any of these fall on weekends/holidays
    if (isWeekendOrHoliday(start, holidays)) {
      toast.error("Selected start date falls on Friday, Saturday, or a company holiday");
      return;
    }
    if (isWeekendOrHoliday(end, holidays)) {
      toast.error("Selected end date falls on Friday, Saturday, or a company holiday");
      return;
    }
    
    onChange({ start, end });
  };

  const previewStart = hoverPreview?.start || value.start;
  const previewEnd = hoverPreview?.end || value.end;
  const previewDays = previewStart && previewEnd ? totalDaysInclusive(previewStart, previewEnd) : 0;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
          <PopoverTrigger asChild className="flex-1">
            <Button
              variant="outline"
              disabled={disabled}
              className={cn("w-full justify-start text-left font-normal")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value.start ? (
                value.end ? (
                  <>
                    {fmtDDMMYYYY(value.start)} - {fmtDDMMYYYY(value.end)}
                  </>
                ) : (
                  fmtDDMMYYYY(value.start)
                )
              ) : (
                <span className="text-muted-foreground">Pick date range</span>
              )}
            </Button>
          </PopoverTrigger>
          {value.start && value.end && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              className="h-10 w-10 flex-shrink-0"
              aria-label="Clear date selection"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Quick Select Buttons */}
            {showQuickSelect && (
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSelect("today")}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSelect("tomorrow")}
                  className="text-xs"
                >
                  Tomorrow
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSelect("nextWeek")}
                  className="text-xs"
                >
                  Next Week
                </Button>
              </div>
            )}
            
            {/* Hover Preview */}
            {previewStart && previewEnd && previewDays > 0 && (
              <div className="text-xs text-slate-600 dark:text-slate-400 px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-medium">
                  {previewDays} day{previewDays !== 1 ? 's' : ''}
                </span>
                <span className="text-slate-500 ml-2">
                  ({fmtDDMMYYYY(previewStart)} → {fmtDDMMYYYY(previewEnd)})
                </span>
              </div>
            )}
            
            {/* Calendar */}
            <Calendar
              mode="range"
              selected={{ from: value.start, to: value.end }}
              onSelect={handleSelect}
              disabled={(date) => date < (minDate || new Date())}
              modifiers={{
                weekend: (d) => [5, 6].includes(d.getDay()),
                holiday: (d) => holidays.some(h => h.date === d.toISOString().slice(0, 10)),
              }}
              modifiersClassNames={{
                weekend: "weekend-day",
                holiday: "holiday-day",
              }}
              onDayMouseEnter={(day) => {
                if (value.start && !value.end) {
                  setHoverPreview({ start: value.start, end: day });
                }
              }}
              onDayMouseLeave={() => setHoverPreview(null)}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

