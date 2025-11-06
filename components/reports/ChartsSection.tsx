"use client";

import { ChartContainer, TrendChart, TypePie } from "@/components/shared/LeaveCharts";
import { fromReportsSummary } from "@/components/shared/LeaveCharts/adapters";

type ChartsSectionProps = {
  monthlyTrend: Array<{ month: string; leaves: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  departmentSummary: Array<{ name: string; count: number }>;
  isLoading?: boolean;
};


export function ChartsSection({
  monthlyTrend,
  typeDistribution,
  departmentSummary,
  isLoading,
}: ChartsSectionProps) {
  const { trend, slices } = fromReportsSummary({
    monthlyTrend,
    typeDistribution,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartContainer
        title="Monthly Leave Trend"
        subtitle="Approved leaves per month (This Year)"
        loading={isLoading}
        empty={trend.length === 0}
        height={300}
      >
        <TrendChart data={trend} height={300} />
      </ChartContainer>

      <ChartContainer
        title="Leave Type Distribution"
        subtitle="Distribution by leave type"
        loading={isLoading}
        empty={slices.length === 0}
        height={300}
      >
        <TypePie data={slices} height={300} />
      </ChartContainer>

      {/* Department Summary - keep existing for now, can be refactored later */}
      <ChartContainer
        title="Department-wise Leave Summary"
        subtitle="Top departments by leave usage"
        loading={isLoading}
        empty={departmentSummary.length === 0}
        className="lg:col-span-2"
        height={300}
      >
        {/* TODO: Create DepartmentChart component if needed */}
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Department chart placeholder
        </div>
      </ChartContainer>
    </div>
  );
}

