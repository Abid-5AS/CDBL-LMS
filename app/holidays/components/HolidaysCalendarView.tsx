"use client";

import { useState } from "react";
import { HolidayCalendar } from "@/components/holidays/HolidayCalendar";
import type { Holiday as HolidayType } from "../hooks/useHolidaysData";
import { Calendar } from "lucide-react";

type HolidaysCalendarViewProps = {
  holidays: HolidayType[];
};

export function HolidaysCalendarView({ holidays }: HolidaysCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (holidays.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No holidays found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters to see more holidays
        </p>
      </div>
    );
  }

  // Transform holidays to match HolidayCalendar component interface
  const transformedHolidays = holidays.map(h => ({
    id: h.id,
    date: new Date(h.date),
    name: h.name,
    isOptional: h.isOptional || false,
    category: h.isOptional ? ("restricted" as const) : ("public" as const),
  }));

  return (
    <div className="space-y-4">
      <HolidayCalendar
        holidays={transformedHolidays}
        showWeekends={true}
        onDateClick={(date) => {
          setSelectedDate(date);
        }}
      />

      {selectedDate && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Selected: {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
