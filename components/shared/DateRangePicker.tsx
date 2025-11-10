"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isWeekendOrHoliday, fmtDDMMYYYY, totalDaysInclusive, nextWorkingDay, countDaysBreakdown } from "@/lib/date-utils";
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

  const handleQuickSelect = (type: "nextWorkingDay" | "nextWeek") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start: Date;
    let end: Date;
    
    switch (type) {
      case "nextWorkingDay":
        // Find next working day from today
        start = nextWorkingDay(today, holidays);
        end = start;
        break;
      case "nextWeek":
        // Next week: Find next Monday that's a working day (skip holidays)
        const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
        let potentialMonday = addDays(today, daysUntilNextMonday);
        
        // If potential Monday is on a holiday, find the next working day
        while (isWeekendOrHoliday(potentialMonday, holidays)) {
          potentialMonday = addDays(potentialMonday, 1);
        }
        
        start = potentialMonday;
        end = addDays(start, 2); // 3 days total
        break;
    }
    
    onChange({ start, end });
  };

  const previewStart = hoverPreview?.start || value.start;
  const previewEnd = hoverPreview?.end || value.end;
  const previewDays = previewStart && previewEnd ? totalDaysInclusive(previewStart, previewEnd) : 0;

  // Calculate breakdown for current selection
  const breakdown = value.start && value.end ? countDaysBreakdown(value.start, value.end, holidays) : null;

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
            {/* Quick Select Buttons - Updated for "Next Working Day" and "Next Week" */}
            {showQuickSelect && (
              <div className="flex gap-2 border-b border-border pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSelect("nextWorkingDay")}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Next Working Day
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
              <div className="text-xs text-muted-foreground px-1 pb-2 border-b border-border">
                <span className="font-medium">
                  {previewDays} day{previewDays !== 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground ml-2 opacity-70">
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

            {/* Breakdown Summary */}
            {breakdown && (
              <div className="text-xs text-muted-foreground px-1 pt-2 border-t border-border">
                <div className="font-medium mb-1">
                  {breakdown.total} total day{breakdown.total !== 1 ? 's' : ''}
                </div>
                {(breakdown.weekends > 0 || breakdown.holidays > 0) && (
                  <div className="text-muted-foreground opacity-70">
                    {breakdown.weekends > 0 && (
                      <span>{breakdown.weekends} weekend{breakdown.weekends !== 1 ? 's' : ''}</span>
                    )}
                    {breakdown.weekends > 0 && breakdown.holidays > 0 && ', '}
                    {breakdown.holidays > 0 && (
                      <span>{breakdown.holidays} holiday{breakdown.holidays !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border border-primary/20 bg-primary/10" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border border-border" />
                <span>Weekend</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

