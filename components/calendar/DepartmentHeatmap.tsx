"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarHeader, CalendarViewMode } from "@/components/calendar/CalendarHeader";
import { format, addMonths, subMonths, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth } from "date-fns";
import { Loader2, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DepartmentHeatmapProps {
  currentUserRole: string;
}

interface HeatmapData {
  department: string;
  coverage: Record<string, number>;
  totalStaff: number;
}

export function DepartmentHeatmap({ currentUserRole }: DepartmentHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("heatmap");
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all");

  useEffect(() => {
    fetchHeatmapData();
  }, [currentDate, selectedDept]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const departments = ["Engineering", "HR", "Finance", "Sales", "Marketing"];
      const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });

      const mockData: HeatmapData[] = departments.map(dept => {
        const coverage: Record<string, number> = {};
        days.forEach(day => {
          const isWknd = isWeekend(day);
          const randomAbsence = isWknd ? 0 : Math.random() * 40;
          coverage[format(day, "yyyy-MM-dd")] = Math.floor(randomAbsence);
        });
        return {
          department: dept,
          coverage,
          totalStaff: Math.floor(Math.random() * 20) + 5
        };
      });

      setHeatmapData(mockData);
    } catch (error) {
      console.error("Failed to fetch heatmap data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getColorForAbsence = (percentage: number) => {
    if (percentage === 0) return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20";
    if (percentage < 10) return "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30";
    if (percentage < 20) return "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30";
    if (percentage < 30) return "bg-orange-500/30 text-orange-700 hover:bg-orange-500/40";
    return "bg-rose-500/30 text-rose-700 hover:bg-rose-500/40";
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Department Coverage
        </h2>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b bg-muted/30">
          <CalendarHeader
            currentDate={currentDate}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          >
            <div className="flex items-center gap-2 mr-2 sm:mr-4">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="w-[140px] sm:w-[180px] h-7 sm:h-8 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CalendarHeader>
        </div>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="h-[300px] sm:h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-w-[600px] p-3 sm:p-4">
              {/* Header Row */}
              <div className="flex border-b border-border/50 pb-2 mb-2 bg-muted/20 sticky top-0 z-10">
                <div className="w-28 sm:w-40 shrink-0 font-semibold text-xs sm:text-sm text-muted-foreground px-2">Department</div>
                <div className="flex-1 flex">
                  {days.map(day => (
                    <div key={day.toISOString()} className="flex-1 text-center text-[9px] sm:text-[10px] text-muted-foreground">
                      {format(day, "d")}
                      <br className="hidden sm:block" />
                      <span className="hidden sm:inline">{format(day, "EEEEE")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2">
                {heatmapData
                  .filter(d => selectedDept === "all" || d.department === selectedDept)
                  .map((dept) => (
                  <div key={dept.department} className="flex items-center group">
                    <div className="w-28 sm:w-40 shrink-0 px-2">
                      <div className="font-medium text-xs sm:text-sm truncate">{dept.department}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">{dept.totalStaff} Staff</div>
                    </div>
                    <div className="flex-1 flex gap-[1px]">
                      {days.map(day => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const absence = dept.coverage[dateKey] || 0;
                        const isWknd = isWeekend(day);

                        return (
                          <TooltipProvider key={dateKey}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "flex-1 h-8 sm:h-10 rounded-sm transition-all cursor-pointer",
                                    isWknd ? "bg-muted/30" : getColorForAbsence(absence)
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-semibold">{format(day, "MMM d, yyyy")}</p>
                                  <p>{isWknd ? "Weekend" : `Absence: ${absence}%`}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
