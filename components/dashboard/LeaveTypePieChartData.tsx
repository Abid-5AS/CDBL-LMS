"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { ChartContainer, TypePie } from "@/components/shared/LeaveCharts";
import { fromDashboardAgg } from "@/components/shared/LeaveCharts/adapters";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart } from "lucide-react";

type ChartData = {
  name: string;
  value: number;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

export function LeaveTypePieChartData() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading } = useSWR<{ data: ChartData[] }>(
    "/api/dashboard/leave-type-distribution",
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
          icon={PieChart}
          title="No data available"
          description="No leave type distribution data available."
        />
      </div>
    );
  }

  const { slices } = fromDashboardAgg({
    typeDistribution: data.data.map((item) => ({
      type: item.name,
      count: item.value,
    })),
  });

  return (
    <ChartContainer
      title="Leave Type Distribution"
      loading={false}
      empty={slices.length === 0}
      height={250}
    >
      <TypePie data={slices} height={250} />
    </ChartContainer>
  );
}

