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
  const maxDeptValue =
    departmentSummary.length > 0
      ? Math.max(...departmentSummary.map((dept) => dept.count))
      : 0;

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

      <ChartContainer
        title="Department-wise Leave Summary"
        subtitle="Top departments by leave usage"
        loading={isLoading}
        empty={departmentSummary.length === 0}
        className="lg:col-span-2"
        height={300}
      >
        <div className="max-h-[280px] space-y-3 overflow-auto pr-2">
          {departmentSummary.map((dept, index) => (
            <div
              key={`${dept.name}-${index}`}
              className="flex items-center gap-4 rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="w-10 text-sm font-semibold text-muted-foreground">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{dept.name}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted relative overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{
                      width: maxDeptValue
                        ? `${Math.max(
                            (dept.count / maxDeptValue) * 100,
                            4
                          )}%`
                        : "4%",
                    }}
                  />
                </div>
              </div>
              <div className="text-sm font-semibold text-muted-foreground">
                {dept.count} days
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}
