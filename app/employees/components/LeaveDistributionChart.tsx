"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getAccessibleFill, ChartPatternDefs } from "@/lib/chart-patterns";

type LeaveDistributionChartProps = {
  data: { type: string; value: number }[];
};

export function LeaveDistributionChart({ data }: LeaveDistributionChartProps) {
  const total = data.reduce((acc, slice) => acc + slice.value, 0);

  return (
    <div className="rounded-lg border border-border-strong p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Leave Type Distribution
      </h3>
      <div className="h-[180px]">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave records to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartPatternDefs />
              <Pie
                data={data}
                dataKey="value"
                nameKey="type"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                label={({ payload, value }: any) =>
                  `${payload?.type || 'Unknown'} (${total > 0 ? Math.round((((value as number) ?? 0) / total) * 100) : 0}%)`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.type}
                    fill={getAccessibleFill(index)}
                    stroke={getAccessibleFill(index)}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
