"use client";


import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

interface CoverageDay {
  date: Date;
  count: number;
  intensity: "none" | "low" | "medium" | "high";
  employees: string[];
}

interface TeamCoverageCalendarProps {
  currentDate?: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  coverageData?: {
    range: { start: string; end: string };
    days: Record<string, { count: number; members: any[] }>;
  };
  isLoading?: boolean;
}

export function TeamCoverageCalendar({
  currentDate = new Date(),
  onPrevMonth,
  onNextMonth,
  coverageData,
  isLoading = false,
}: TeamCoverageCalendarProps) {
  // Internal state fallback if not controlled (optional, but requested to lift state)
  // For this refactor, we assume controlled usage from Dashboard, but keep defaults safe

  const router = useRouter();


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

  const handleDayClick = (date: Date) => {
    // Navigate to leaves list filtered by this date
    // Format: YYYY-MM-DD
    const offset = date.getTimezoneOffset() * 60000;
    const dateStr = new Date(date.getTime() - offset).toISOString().split('T')[0];
    router.push(`/leaves?scope=team&date=${dateStr}`);
  };

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
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Coverage Map
        </h3>
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-none" onClick={onPrevMonth} disabled={isLoading}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium w-16 text-center tabular-nums">
            {currentDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-none" onClick={onNextMonth} disabled={isLoading}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {/* Padding for start of month */}
        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {calendarDays.map((day, i) => (
          <TooltipProvider key={i}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => handleDayClick(day.date)}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-[10px] cursor-pointer transition-all hover:scale-105 active:scale-95",
                    getIntensityColor(day.intensity),
                    day.count > 0 ? "text-white font-medium shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {day.date.getDate()}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs">
                  <p className="font-semibold mb-1">{day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  {day.count > 0 ? (
                    <div className="space-y-1">
                      <p className="font-medium">{day.count} Member{day.count > 1 ? 's' : ''} Out:</p>
                      <ul className="list-disc list-inside opacity-90">
                        {day.employees.slice(0, 3).map((emp, idx) => (
                          <li key={idx} className="truncate max-w-[150px]">{emp}</li>
                        ))}
                        {day.employees.length > 3 && <li>+{day.employees.length - 3} more</li>}
                      </ul>
                    </div>
                  ) : (
                    <p className="opacity-70">100% Coverage</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-3">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Low (1-2)</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /> Med (3-5)</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-sm" /> High (5+)</div>
      </div>
    </div>
  );
}
