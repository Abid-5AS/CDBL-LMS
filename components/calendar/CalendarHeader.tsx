"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, AlignJustify } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "2-week" | "timeline" | "heatmap";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  title?: string;
  className?: string;
  children?: React.ReactNode; // For additional filters
}

export function CalendarHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onViewModeChange,
  title,
  className,
  children,
}: CalendarHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-1", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
          <Button variant="ghost" size="icon" onClick={onPrev} className="h-7 w-7 hover:bg-background hover:shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday} className="h-7 px-3 text-xs font-medium hover:bg-background hover:shadow-sm">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="h-7 w-7 hover:bg-background hover:shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-lg font-semibold tracking-tight ml-2 min-w-[140px]">
          {title || format(currentDate, "MMMM yyyy")}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}

        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50">
          <Button
            variant={viewMode === "month" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("month")}
            className={cn("h-7 px-2 text-xs gap-1.5", viewMode === "month" && "bg-background shadow-sm")}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Month</span>
          </Button>
          <Button
            variant={viewMode === "2-week" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("2-week")}
            className={cn("h-7 px-2 text-xs gap-1.5", viewMode === "2-week" && "bg-background shadow-sm")}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">2 Weeks</span>
          </Button>
          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("timeline")}
            className={cn("h-7 px-2 text-xs gap-1.5", viewMode === "timeline" && "bg-background shadow-sm")}
          >
            <AlignJustify className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
