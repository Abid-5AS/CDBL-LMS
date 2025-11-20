"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, startOfDay, differenceInDays, isToday } from "date-fns";
import { CalendarEvent } from "./CalendarGrid";
import { STATUS_COLORS, LEAVE_TYPE_DOTS } from "./CalendarLegend";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimelineRow {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
  events: CalendarEvent[];
}

interface TimelineGridProps {
  startDate: Date;
  daysToShow?: number;
  rows: TimelineRow[];
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
  showRowHeaders?: boolean;
}

export function TimelineGrid({
  startDate,
  daysToShow = 14,
  rows,
  onEventClick,
  className,
  showRowHeaders = true,
}: TimelineGridProps) {
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  const cellWidth = 100 / daysToShow;

  return (
    <div className={cn("w-full overflow-x-auto -mx-2 sm:mx-0", className)}>
      <div className="min-w-[600px] px-2 sm:px-0">
        {/* Header */}
        <div className="flex border-b border-border/50 bg-muted/20 sticky top-0 z-10">
          {showRowHeaders && <div className="w-32 sm:w-48 shrink-0 p-2 sm:p-2 border-r border-border/50" />}
          <div className="flex-1 flex">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 text-center py-1.5 sm:py-2 border-r border-border/50 last:border-r-0",
                  isToday(day) && "bg-primary/5"
                )}
                style={{ width: `${cellWidth}%` }}
              >
                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-medium">
                  {format(day, "EEE")}
                </div>
                <div className={cn("text-xs sm:text-sm font-semibold", isToday(day) && "text-primary")}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {rows.map((row) => (
            <div key={row.id} className="flex group hover:bg-muted/5 transition-colors">
              {/* Row Header */}
              {showRowHeaders && (
                <div className="w-32 sm:w-48 shrink-0 p-2 sm:p-3 border-r border-border/50 flex items-center gap-2 sm:gap-3">
                  {row.avatar !== undefined && (
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-border shrink-0">
                      <AvatarImage src={row.avatar} />
                      <AvatarFallback className="text-[10px] sm:text-xs">{row.label.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="overflow-hidden min-w-0">
                    <div className="text-xs sm:text-sm font-medium truncate">{row.label}</div>
                    {row.subLabel && <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{row.subLabel}</div>}
                  </div>
                </div>
              )}

              {/* Timeline Cells */}
              <div className="flex-1 relative h-12 sm:h-14">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {days.map((day) => (
                    <div
                      key={`grid-${day.toISOString()}`}
                      className={cn(
                        "flex-1 border-r border-border/30 last:border-r-0",
                        isToday(day) && "bg-primary/5"
                      )}
                      style={{ width: `${cellWidth}%` }}
                    />
                  ))}
                </div>

                {/* Events */}
                <div className="absolute inset-0 py-1.5 sm:py-2">
                  {row.events.map((event) => {
                    const eventStart = startOfDay(new Date(event.startDate));
                    const eventEnd = startOfDay(new Date(event.endDate));
                    const timelineStart = startOfDay(startDate);
                    const timelineEnd = addDays(timelineStart, daysToShow - 1);

                    if (eventEnd < timelineStart || eventStart > timelineEnd) return null;

                    const effectiveStart = eventStart < timelineStart ? timelineStart : eventStart;
                    const effectiveEnd = eventEnd > timelineEnd ? timelineEnd : eventEnd;
                    
                    const startOffset = differenceInDays(effectiveStart, timelineStart);
                    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;
                    
                    const left = (startOffset / daysToShow) * 100;
                    const width = (duration / daysToShow) * 100;

                    return (
                      <TooltipProvider key={event.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => onEventClick?.(event)}
                              className={cn(
                                "absolute top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 rounded border text-[9px] sm:text-[10px] font-medium flex items-center px-1.5 sm:px-2 cursor-pointer hover:brightness-95 transition-all shadow-sm z-10 overflow-hidden",
                                event.isHoliday 
                                  ? STATUS_COLORS.HOLIDAY 
                                  : STATUS_COLORS[event.status] || "bg-muted text-muted-foreground"
                              )}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                marginLeft: "1px",
                                marginRight: "1px",
                                maxWidth: `calc(${width}% - 2px)`
                              }}
                            >
                              <span className={cn("h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full shrink-0 mr-1", LEAVE_TYPE_DOTS[event.type])} />
                              <span className="truncate hidden sm:inline">{event.title}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold">{event.title}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(event.startDate), "MMM d")} - {format(new Date(event.endDate), "MMM d")}
                              </p>
                              <p className="capitalize mt-1">{event.type.toLowerCase().replace(/_/g, " ")} • {event.status.toLowerCase()}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
