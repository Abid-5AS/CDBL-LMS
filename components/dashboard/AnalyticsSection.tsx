"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, Calendar, BarChart3, Info } from "lucide-react";
import { LeaveHeatmap } from "./LeaveHeatmap";
import { LeaveTypePieChart } from "./LeaveTypePieChart";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type FilterPeriod = "month" | "quarter" | "year";

export function AnalyticsSection() {
  const [period, setPeriod] = useState<FilterPeriod>("year");

  // Fetch summary data independently (not from heatmap)
  const { data: summaryData, isLoading: isLoadingSummary } = useSWR(
    `/api/dashboard/analytics/summary?period=${period}`,
    fetcher
  );

  const summary = useMemo(() => {
    if (!summaryData?.summary) return null;

    const { summary: summaryInfo } = summaryData;

    // Get period-specific usage based on filter
    let periodLabel = "This Year";
    let periodTotal = summaryInfo.yearUsed ?? 0;
    
    if (period === "month") {
      periodLabel = "This Month";
      periodTotal = summaryInfo.monthUsed ?? 0;
    } else if (period === "quarter") {
      periodLabel = "This Quarter";
      periodTotal = summaryInfo.quarterUsed ?? 0;
    } else {
      // year
      periodLabel = "This Year";
      periodTotal = summaryInfo.yearUsed ?? 0;
    }

    // Total Used is ALWAYS year-to-date (independent of filter)
    const totalUsed = summaryInfo.yearUsed ?? 0;

    return {
      periodTotal,
      periodLabel,
      remaining: summaryInfo.remainingAll ?? 0,
      totalUsed, // Always year-to-date
    };
  }, [summaryData, period]);

  // Prepare pie chart data from distribution
  const pieData = useMemo(() => {
    if (!summaryData?.distribution) return [];

    return summaryData.distribution.map((item: any) => ({
      name: item.type,
      value: item.days,
    }));
  }, [summaryData]);

  if (isLoadingSummary) {
    return (
      <Card className="solid-card animate-fade-in-up">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Days Used - Changes with filter */}
        <Card className="solid-card animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary?.periodTotal ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {summary?.periodLabel ?? "This Year"}
                </p>
              </div>
              <BarChart3 className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Used - Always year-to-date (independent of filter) */}
        <Card className="solid-card animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Used</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex items-center">
                          <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          This value always shows total leaves used in the current year, regardless of the selected view filter.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary?.totalUsed ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  This Year
                </p>
              </div>
              <TrendingUp className="size-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="solid-card animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {summary?.remaining ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  All Types
                </p>
              </div>
              <Calendar className="size-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
        <Button
          variant={period === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("month")}
        >
          Month
        </Button>
        <Button
          variant={period === "quarter" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("quarter")}
        >
          Quarter
        </Button>
        <Button
          variant={period === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod("year")}
        >
          Year
        </Button>
      </div>

      {/* Heatmap - Decoupled */}
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Leave Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveHeatmap
            defaultScope="me"
            defaultRange="year"
          />
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card className="solid-card animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4" />
            Leave Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveTypePieChart data={pieData} />
        </CardContent>
      </Card>
    </div>
  );
}
