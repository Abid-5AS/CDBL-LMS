"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

interface CoverageDay {
  date: Date;
  count: number;
  intensity: "none" | "low" | "medium" | "high";
  employees: string[];
}

export function TeamCoverageCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Fetch calendar coverage data
  const { data: coverageData, isLoading } = useSWR<{
    range: { start: string; end: string };
    days: Record<string, { count: number; members: any[] }>;
  }>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    // Get first day of month
    const start = new Date(year, month, 1);
    // Get last day of month
    const end = new Date(year, month + 1, 0);
    
    // Convert to simplified date string for API: YYYY-MM-DD
    // Using local time to avoid timezone shifts
    const toDateString = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    return `/api/team/on-leave?scope=department&startDate=${toDateString(start)}&endDate=${toDateString(end)}`;
  }, apiFetcher);

  const calendarDays = React.useMemo(() => {
    const days: CoverageDay[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // Format as YYYY-MM-DD for lookup
      const offset = date.getTimezoneOffset() * 60000;
      const dateKey = new Date(date.getTime() - offset).toISOString().split('T')[0];
      
      const dayData = coverageData?.days[dateKey];
      const count = dayData?.count || 0;
      
      let intensity: CoverageDay["intensity"] = "none";
      if (count > 0) intensity = "low";
      if (count > 2) intensity = "medium";
      if (count > 3) intensity = "high"; // Assuming team size ~10-15, >3 is significant

      days.push({
        date,
        count,
        intensity,
        employees: dayData?.members?.map((m: any) => m.employeeName) || [],
      });
    }
    return days;
  }, [currentDate, coverageData]);

  const getIntensityColor = (intensity: CoverageDay["intensity"]) => {
    switch (intensity) {
      case "high":
        return "bg-red-500 dark:bg-red-600 shadow-sm";
      case "medium":
        return "bg-orange-400 dark:bg-orange-500";
      case "low":
        return "bg-emerald-400 dark:bg-emerald-500";
      default:
        return "bg-muted/30 border border-transparent";
    }
  };

  return (
    <Card variant="glass" interactive={true} className="surface-card h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Team Coverage
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[60px] text-center">
              {currentDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px] text-center text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for start of month */}
          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          
          {calendarDays.map((day, i) => (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "aspect-square rounded-sm flex items-center justify-center text-[10px] cursor-pointer transition-colors hover:opacity-80",
                      getIntensityColor(day.intensity),
                      day.count > 0 ? "text-white font-medium" : "text-muted-foreground"
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs">
                    <p className="font-semibold">{day.date.toLocaleDateString()}</p>
                    <p>{day.count} on leave</p>
                    {day.count > 3 && <p className="text-red-400 font-bold">High Absence!</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Low</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> Med</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> High</div>
        </div>
      </CardContent>
    </Card>
  );
}
