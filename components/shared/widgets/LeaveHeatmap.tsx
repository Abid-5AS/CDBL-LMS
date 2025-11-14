"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from "@/components/ui";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

interface HeatmapData {
  date: string;
  value: number;
  type: string;
}

interface LeaveHeatmapProps {
  defaultScope?: "me" | "team";
  defaultRange?: "year" | "rolling12";
  onParamsChange?: (params: {
    scope: string;
    range: string;
    types: string[];
    status: string;
  }) => void;
}

function getIntensityColor(count: number): string {
  if (count === 0) return "bg-bg-secondary dark:bg-bg-secondary";
  if (count === 1) return "bg-data-success dark:bg-data-success";
  if (count === 2) return "bg-data-success dark:bg-data-success";
  if (count === 3) return "bg-data-success dark:bg-data-success";
  return "bg-data-success dark:bg-data-success"; // 4+ days
}

function getDayOfWeek(date: Date): number {
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  // But we want Monday = 0, ..., Sunday = 6 for grid layout
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function LeaveHeatmap({
  defaultScope = "me",
  defaultRange = "year",
  onParamsChange,
}: LeaveHeatmapProps) {
  const router = useRouter();
  const [scope, setScope] = useState(defaultScope);
  const [range, setRange] = useState(defaultRange);
  const [types, setTypes] = useState<string[]>([]); // Empty = all
  const [status, setStatus] = useState<string>("APPROVED");

  // Fetch heatmap data from its own API
  const typesParam = types.length > 0 ? types.join(",") : "all";
  const { data: heatmapData, isLoading } = useSWR(
    `/api/analytics/heatmap?scope=${scope}&range=${range}&types=${typesParam}&status=${status}`,
    apiFetcher
  );

  // Notify parent of param changes (optional callback)
  const handleParamsChange = (
    newScope: string,
    newRange: string,
    newTypes: string[],
    newStatus: string
  ) => {
    setScope(newScope as "me" | "team");
    setRange(newRange as any);
    setTypes(newTypes);
    setStatus(newStatus as any);
    if (onParamsChange) {
      onParamsChange({
        scope: newScope,
        range: newRange,
        types: newTypes,
        status: newStatus,
      });
    }
  };

  const buckets = heatmapData?.buckets || [];
  const periodStart = heatmapData?.periodStart
    ? new Date(heatmapData.periodStart)
    : new Date();
  const periodEnd = heatmapData?.periodEnd
    ? new Date(heatmapData.periodEnd)
    : new Date();

  const { grid, year } = useMemo(() => {
    if (isLoading || !heatmapData) {
      return { grid: [], year: new Date().getFullYear() };
    }

    const currentYear = new Date().getFullYear();
    const startDate =
      range === "rolling12" ? periodStart : new Date(currentYear, 0, 1);

    const endDate =
      range === "rolling12" ? periodEnd : new Date(currentYear, 11, 31);

    // Create a map for quick lookup from buckets
    const dataMap = new Map<string, { count: number; types: string[] }>();
    buckets.forEach(
      (bucket: { date: string; count: number; types: string[] }) => {
        dataMap.set(bucket.date, { count: bucket.count, types: bucket.types });
      }
    );

    // Generate grid: 52 weeks × 7 days
    const weeks: Array<
      Array<{ date: Date; data?: { count: number; types: string[] } }>
    > = [];
    let currentDate = new Date(startDate);

    // Find the first Monday (or start of year if it's a Monday)
    const firstDay = getDayOfWeek(currentDate);
    if (firstDay !== 0) {
      // Move to previous Monday
      currentDate.setDate(currentDate.getDate() - firstDay);
    }

    // Generate 53 weeks (to cover full year)
    for (let week = 0; week < 53; week++) {
      const weekDays: Array<{ date: Date; data?: HeatmapData }> = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const item = dataMap.get(dateStr);
        weekDays.push({
          date: new Date(currentDate),
          data: item ? { count: item.count, types: item.types } : undefined,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(weekDays);

      // Stop if we've passed the end date
      if (currentDate > endDate && week > 0) {
        break;
      }
    }

    return { grid: weeks, year: currentYear };
  }, [buckets, range, periodStart, periodEnd, isLoading, heatmapData]);

  if (isLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Loading heatmap...
      </div>
    );
  }

  if (grid.length === 0 || buckets.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary dark:text-text-secondary">
        <p className="text-sm mb-4">
          {scope === "me"
            ? "No leave days in this period."
            : "No team leave days."}
        </p>
        <div className="flex gap-2 justify-center">
          {scope === "me" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/leaves/apply")}
              >
                Apply Leave
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleParamsChange("team", range, types, status)}
              >
                Switch to Team
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleParamsChange("me", range, types, status)}
              >
                Back to Me
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/leaves?scope=team")}
              >
                Open Team on Leave
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2 pt-7">
            <div className="text-[10px] text-text-secondary dark:text-text-secondary h-3">
              Mon
            </div>
            <div className="text-[10px] text-text-secondary dark:text-text-secondary h-3">
              Wed
            </div>
            <div className="text-[10px] text-text-secondary dark:text-text-secondary h-3">
              Fri
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const count = day.data?.count ?? 0;
                  const dayTypes = day.data?.types ?? [];
                  const dateStr = format(day.date, "MMM dd, yyyy");
                  const isInRange =
                    day.date >= new Date(year, 0, 1) &&
                    day.date <= new Date(year, 11, 31);

                  return (
                    <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-2 hover:ring-border-strong dark:hover:ring-border-strong",
                              isInRange || range === "rolling12"
                                ? getIntensityColor(count)
                                : "bg-bg-secondary dark:bg-bg-secondary"
                            )}
                            title={
                              count > 0
                                ? `${count} day${
                                    count > 1 ? "s" : ""
                                  } on ${dateStr}`
                                : `No leave on ${dateStr}`
                            }
                          />
                        </TooltipTrigger>
                        {count > 0 && (
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold">
                                {count} day{count > 1 ? "s" : ""} on leave
                              </p>
                              <p className="text-text-secondary mt-1">{dateStr}</p>
                              {dayTypes.length > 0 && (
                                <p className="text-text-secondary">
                                  {dayTypes.join(", ")}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-text-secondary dark:text-text-secondary">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-bg-secondary dark:bg-bg-secondary" />
            <div className="w-3 h-3 rounded-sm bg-data-success dark:bg-data-success" />
            <div className="w-3 h-3 rounded-sm bg-data-success dark:bg-data-success" />
            <div className="w-3 h-3 rounded-sm bg-data-success dark:bg-data-success" />
            <div className="w-3 h-3 rounded-sm bg-data-success dark:bg-data-success" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
