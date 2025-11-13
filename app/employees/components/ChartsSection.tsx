"use client";

import { ChartContainer, TrendChart, TypePie } from "@/components/shared/LeaveCharts";
import type { LeaveDistributionSlice, LeaveTrendPoint } from "@/lib/employee";
import { useMemo } from "react";

type ChartsSectionProps = {
  trend: LeaveTrendPoint[];
  distribution: LeaveDistributionSlice[];
};

export default function ChartsSection({ trend, distribution }: ChartsSectionProps) {
  // Transform trend data to match TrendChart format
  const trendData = useMemo(() => {
    return trend.map((point) => ({
      month: point.month,
      leaves: point.leavesTaken, // Map leavesTaken to leaves
    }));
  }, [trend]);

  // Transform distribution data to match TypePie format
  const pieData = useMemo(() => {
    return distribution.map((slice) => ({
      name: slice.type,
      value: slice.value,
    }));
  }, [distribution]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartContainer
        title="Monthly Leave Trend"
        subtitle="Your leaves taken per month"
        loading={false}
        empty={trendData.length === 0}
        height={240}
      >
        <TrendChart data={trendData} height={240} dataKey="leaves" />
      </ChartContainer>

      <ChartContainer
        title="Leave Type Distribution"
        subtitle="Breakdown by leave type"
        loading={false}
        empty={pieData.length === 0}
        height={240}
      >
        <TypePie data={pieData} height={240} />
      </ChartContainer>
    </div>
  );
}
