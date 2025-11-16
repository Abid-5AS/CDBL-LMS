"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button, Skeleton } from "@/components/ui";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

interface HeatmapBucket {
  date: string;
  count: number;
  types: string[];
}

interface HeatmapApiResponse {
  buckets: HeatmapBucket[];
  periodStart: string;
  periodEnd: string;
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

const SCOPE_FILTERS = [
  { label: "Me", value: "me" },
  { label: "Team", value: "team" },
];

const RANGE_FILTERS = [
  { label: "Year", value: "year" },
  { label: "Rolling 12", value: "rolling12" },
];

function getDayOfWeek(date: Date): number {
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
  const [types, setTypes] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("APPROVED");

  const typesParam = types.length > 0 ? types.join(",") : "all";
  const { data: heatmapData, isLoading } = useSWR<HeatmapApiResponse>(
    `/api/analytics/heatmap?scope=${scope}&range=${range}&types=${typesParam}&status=${status}`,
    apiFetcher
  );

  const handleParamsChange = (
    newScope: string,
    newRange: string,
    newTypes: string[],
    newStatus: string
  ) => {
    setScope(newScope as "me" | "team");
    setRange(newRange as typeof range);
    setTypes(newTypes);
    setStatus(newStatus);
    onParamsChange?.({
      scope: newScope,
      range: newRange,
      types: newTypes,
      status: newStatus,
    });
  };

  const { grid } = useMemo(() => {
    if (isLoading || !heatmapData) {
      return { grid: [] };
    }

    const buckets = heatmapData.buckets ?? [];
    const periodStart = heatmapData.periodStart
      ? new Date(heatmapData.periodStart)
      : new Date();
    const periodEnd = heatmapData.periodEnd
      ? new Date(heatmapData.periodEnd)
      : new Date();
    const currentYear = new Date().getFullYear();
    const startDate = range === "rolling12" ? periodStart : new Date(currentYear, 0, 1);
    const endDate = range === "rolling12" ? periodEnd : new Date(currentYear, 11, 31);

    const dataMap = new Map<string, { count: number; types: string[] }>();
    buckets.forEach((bucket) => dataMap.set(bucket.date, { count: bucket.count, types: bucket.types }));

    const weeks: Array<Array<{ date: Date; data?: { count: number; types: string[] } }>> = [];
    let currentDate = new Date(startDate);

    const firstDay = getDayOfWeek(currentDate);
    if (firstDay !== 0) {
      currentDate.setDate(currentDate.getDate() - firstDay);
    }

    for (let week = 0; week < 53; week++) {
      const weekDays: Array<{ date: Date; data?: { count: number; types: string[] } }> = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        weekDays.push({
          date: new Date(currentDate),
          data: dataMap.get(dateStr),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(weekDays);
      if (currentDate > endDate && week > 0) break;
    }

    return { grid: weeks };
  }, [heatmapData, range, isLoading]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const renderEmptyState = () => (
    <div className="text-center space-y-4 py-10 text-muted-foreground">
      <p className="text-sm">
        {scope === "me" ? "No leave days in this period." : "No team leave days."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {scope === "me" ? (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/leaves/apply">Apply Leave</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleParamsChange("team", range, types, status)}>
              Switch to Team
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => handleParamsChange("me", range, types, status)}>
            Back to Me
          </Button>
        )}
      </div>
    </div>
  );

  const intensity = (count = 0) => {
    if (count === 0) return "var(--color-card)";
    if (count === 1) return "color-mix(in srgb, var(--color-data-success) 40%, transparent)";
    if (count === 2) return "color-mix(in srgb, var(--color-data-success) 60%, transparent)";
    if (count >= 3) return "var(--color-data-success)";
    return "var(--color-card)";
  };

  if (grid.length === 0 || buckets.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="neo-card space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Heatmap</p>
          <h3 className="text-xl font-semibold text-foreground">Leave Activity</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={scope === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleParamsChange(filter.value, range, types, status)}
            >
              {filter.label}
            </Button>
          ))}
          {RANGE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={range === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleParamsChange(scope, filter.value, types, status)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <TooltipProvider>
        <div className="grid grid-flow-col auto-cols-fr gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[color-mix(in_srgb,var(--color-card)90%,transparent)] p-3">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid gap-1" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
              {week.map((day, dayIndex) => {
                const color = intensity(day.data?.count ?? 0);
                return (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-4 w-4 rounded-md"
                        style={{ backgroundColor: color }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm font-semibold">
                        {format(day.date, "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {day.data?.count ?? 0} days
                      </div>
                      {day.data?.types && day.data.types.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {day.data.types.join(", ")}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </TooltipProvider>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((count) => (
            <div
              key={count}
              className="h-3 w-3 rounded-md"
              style={{ backgroundColor: intensity(count) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
