"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { isWeekendOrHoliday, fmtDDMMYYYY } from "@/lib/date-utils";
import type { Holiday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value: { start: Date | undefined; end: Date | undefined };
  onChange: (range: { start: Date | undefined; end: Date | undefined }) => void;
  holidays: Holiday[];
  disabled?: boolean;
  minDate?: Date;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  holidays, 
  disabled, 
  minDate 
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({ start: undefined, end: undefined });
      return;
    }

    // Validate start date
    if (range.from && isWeekendOrHoliday(range.from, holidays)) {
      toast.error("Start date cannot be on Friday, Saturday, or a company holiday");
      return;
    }

    // Validate end date
    if (range.to && isWeekendOrHoliday(range.to, holidays)) {
      toast.error("End date cannot be on Friday, Saturday, or a company holiday");
      return;
    }

    onChange({ start: range.from, end: range.to });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      <PopoverContent className="w-auto p-0" align="start">
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
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

