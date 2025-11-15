"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Star,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Holiday {
  id: number | string;
  date: Date | string;
  name: string;
  isOptional?: boolean;
  category?: "public" | "restricted" | "festival" | "special";
}

export interface HolidayCalendarProps {
  holidays: Holiday[];
  year?: number;
  month?: number;
  onDateClick?: (date: Date) => void;
  showWeekends?: boolean;
  groupBy?: "category" | "none";
  className?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const categoryColors = {
  public: "bg-red-500 dark:bg-red-600",
  restricted: "bg-orange-500 dark:bg-orange-600",
  festival: "bg-blue-500 dark:bg-blue-600",
  special: "bg-green-500 dark:bg-green-600",
  default: "bg-indigo-500 dark:bg-indigo-600",
};

const categoryLabels = {
  public: "Public Holiday",
  restricted: "Restricted Holiday",
  festival: "Festival Day",
  special: "Special Day",
};

export function HolidayCalendar({
  holidays,
  year: initialYear,
  month: initialMonth,
  onDateClick,
  showWeekends = true,
  groupBy = "none",
  className,
}: HolidayCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(initialYear || today.getFullYear(), initialMonth || today.getMonth(), 1)
  );

  // Normalize holidays to Date objects
  const normalizedHolidays = useMemo(
    () =>
      holidays.map((h) => ({
        ...h,
        date: typeof h.date === "string" ? new Date(h.date) : h.date,
      })),
    [holidays]
  );

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      holidays: typeof normalizedHolidays;
    }> = [];

    // Add previous month's days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        holidays: [],
      });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayHolidays = normalizedHolidays.filter(
        (h) =>
          h.date.getDate() === i &&
          h.date.getMonth() === month &&
          h.date.getFullYear() === year
      );

      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        holidays: dayHolidays,
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        holidays: [],
      });
    }

    return days;
  }, [currentDate, normalizedHolidays, today]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  return (
    <Card className={cn("border border-border bg-card shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Public</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Restricted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Festival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Special</span>
          </div>
          {showWeekends && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-muted-foreground">Weekend</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-t border-border">
          {/* Day headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="border-r last:border-r-0 border-border bg-muted/50 p-3 text-center text-sm font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const hasHoliday = day.holidays.length > 0;
            const primaryHoliday = day.holidays[0];

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                      className={cn(
                        "min-h-[80px] border-r border-b last:border-r-0 border-border p-2 transition-colors",
                        day.isCurrentMonth
                          ? "bg-background cursor-pointer hover:bg-muted/50"
                          : "bg-muted/20 text-muted-foreground",
                        day.isWeekend && showWeekends && "bg-muted/30",
                        day.isToday && "ring-2 ring-primary ring-inset",
                        hasHoliday && "bg-accent/10"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            day.isToday &&
                              "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground",
                            !day.isCurrentMonth && "text-muted-foreground/60"
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                        {hasHoliday && primaryHoliday.isOptional && (
                          <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                        )}
                      </div>

                      {/* Holiday indicators */}
                      {hasHoliday && (
                        <div className="space-y-1">
                          {day.holidays.slice(0, 2).map((holiday, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate",
                                categoryColors[holiday.category || "default"]
                              )}
                            >
                              {holiday.name}
                            </div>
                          ))}
                          {day.holidays.length > 2 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{day.holidays.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {hasHoliday && (
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        {day.holidays.map((holiday, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div
                              className={cn(
                                "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                                categoryColors[holiday.category || "default"]
                              )}
                            />
                            <div>
                              <p className="font-medium text-sm">{holiday.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {categoryLabels[holiday.category || "public"]}
                                {holiday.isOptional && " (Optional)"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact mini calendar for sidebars
export function MiniHolidayCalendar({
  holidays,
  onDateClick,
}: {
  holidays: Holiday[];
  onDateClick?: (date: Date) => void;
}) {
  return (
    <HolidayCalendar
      holidays={holidays}
      onDateClick={onDateClick}
      showWeekends={true}
      className="text-xs"
    />
  );
}
