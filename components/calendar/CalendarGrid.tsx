"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { format, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { LeaveType } from "@prisma/client";
import { STATUS_COLORS, LEAVE_TYPE_DOTS } from "./CalendarLegend";

export interface CalendarEvent {
  id: number | string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  isHoliday?: boolean;
  employeeName?: string;
}

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick?: (date: Date, events: CalendarEvent[]) => void;
  className?: string;
}

export function CalendarGrid({ currentDate, events, onDayClick, className }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDay = new Date(day);
      checkDay.setHours(12, 0, 0, 0);
      
      return checkDay >= start && checkDay <= end;
    });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {weekDays.map((day, i) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysShort[i]}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toString()}
              onClick={() => onDayClick?.(day, dayEvents)}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 border-b border-r border-border/50 relative transition-colors hover:bg-muted/30 cursor-pointer group",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                isCurrentDay && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between px-0.5 sm:px-1 mb-0.5 sm:mb-1">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full",
                    isCurrentDay
                      ? "bg-primary text-primary-foreground text-xs sm:text-sm"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium bg-muted rounded-full h-4 w-4 flex items-center justify-center sm:hidden">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={`${event.id}-${day.toISOString()}`}
                    className={cn(
                      "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-sm truncate border flex items-center gap-1",
                      event.isHoliday 
                        ? STATUS_COLORS.HOLIDAY 
                        : STATUS_COLORS[event.status] || "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full shrink-0", LEAVE_TYPE_DOTS[event.type])} />
                    <span className="truncate font-medium hidden sm:inline">
                      {event.employeeName || event.title}
                    </span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground px-1 hidden sm:block">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
