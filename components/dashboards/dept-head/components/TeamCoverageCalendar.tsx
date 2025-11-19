"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CoverageDay {
  date: Date;
  count: number;
  intensity: "none" | "low" | "medium" | "high";
  employees: string[];
}

export function TeamCoverageCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Mock data generation for the heatmap (replace with real API later)
  const calendarDays = React.useMemo(() => {
    const days: CoverageDay[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const count = Math.floor(Math.random() * 5); // Mock count 0-4
      let intensity: CoverageDay["intensity"] = "none";
      if (count > 0) intensity = "low";
      if (count > 2) intensity = "medium";
      if (count > 3) intensity = "high";

      days.push({
        date,
        count,
        intensity,
        employees: count > 0 ? Array(count).fill("Employee Name") : [],
      });
    }
    return days;
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getIntensityColor = (intensity: CoverageDay["intensity"]) => {
    switch (intensity) {
      case "high":
        return "bg-red-500 dark:bg-red-600";
      case "medium":
        return "bg-orange-400 dark:bg-orange-500";
      case "low":
        return "bg-emerald-400 dark:bg-emerald-500";
      default:
        return "bg-muted/30";
    }
  };

  return (
    <Card className="surface-card h-full">
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
