"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { ChartContainer, TrendChart } from "@/components/shared/LeaveCharts";
import { fromDashboardAgg } from "@/components/shared/LeaveCharts/adapters";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

type ChartData = {
  month: string;
  leaves: number;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

export function LeaveTrendChartData() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading } = useSWR<{ data: ChartData[] }>(
    "/api/dashboard/leave-trend",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-sm text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-sm text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-sm text-destructive">
          Failed to load chart data: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <EmptyState
          icon={BarChart3}
          title="No data available"
          description="No leave trend data available for this period."
        />
      </div>
    );
  }

  const { trend } = fromDashboardAgg({
    monthlyTrend: data.data.map((item) => ({
      month: item.month,
      approved: item.leaves,
    })),
  });

  return (
    <ChartContainer
      title="Monthly Leave Trend"
      loading={false}
      empty={trend.length === 0}
      height={250}
    >
      <TrendChart data={trend} height={250} />
    </ChartContainer>
  );
}

