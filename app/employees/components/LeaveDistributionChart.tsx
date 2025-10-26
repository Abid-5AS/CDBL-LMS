"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeaveDistributionChartProps = {
  data: { type: string; value: number }[];
};

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ec4899", "#9333ea"];

export function LeaveDistributionChart({ data }: LeaveDistributionChartProps) {
  const total = data.reduce((acc, slice) => acc + slice.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Leave Type Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave records to display.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="type"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                label={({ type, value }) =>
                  `${type} (${total > 0 ? Math.round((((value as number) ?? 0) / total) * 100) : 0}%)`
                }
              >
                {data.map((entry, index) => (
                  <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
