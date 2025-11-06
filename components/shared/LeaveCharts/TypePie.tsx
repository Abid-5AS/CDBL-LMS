"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/reports/ChartTooltip";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";

export type Slice = {
  type: "CASUAL" | "EARNED" | "MEDICAL";
  value: number; // counts; percent computed inside
};

export type TypePieProps = {
  data: Slice[];
  donut?: boolean; // default true
  height?: number; // default 240
  showLegend?: boolean; // default true
  onSliceClick?: (t: Slice["type"]) => void;
  className?: string;
};

// Color tokens from leave type palette (matches LeaveBalancePanel)
const TYPE_COLORS: Record<Slice["type"], string> = {
  EARNED: "rgb(245, 158, 11)", // amber-500
  CASUAL: "rgb(37, 99, 235)", // blue-600
  MEDICAL: "rgb(34, 197, 94)", // green-500
};

/**
 * TypePie - Leave type distribution pie/donut chart
 * Consolidates LeaveTypePieChart and type distribution displays
 */
export function TypePie({
  data,
  donut = true,
  height = 240,
  showLegend = true,
  onSliceClick,
  className,
}: TypePieProps) {
  const { theme } = useTheme();

  // Compute percentages and total
  const chartData = useMemo(() => {
    const total = data.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) return [];

    return data.map((slice) => ({
      name: leaveTypeLabel[slice.type] || slice.type,
      value: slice.value,
      percent: (slice.value / total) * 100,
      type: slice.type,
    }));
  }, [data]);

  const isDark = theme === "dark";

  if (chartData.length === 0) {
    return null; // Empty state handled by ChartContainer
  }

  return (
    <div className={cn("w-full", className)} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${percent.toFixed(0)}%`
            }
            outerRadius={donut ? 80 : 100}
            innerRadius={donut ? 50 : 0}
            fill="#8884d8"
            dataKey="value"
            onClick={(e) => {
              if (onSliceClick && e?.type) {
                onSliceClick(e.type as Slice["type"]);
              }
            }}
            aria-label="Leave type distribution chart"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={TYPE_COLORS[entry.type as Slice["type"]] || "#8884d8"}
              />
            ))}
          </Pie>
          <RechartsTooltip
            content={(props) => {
              if (!props.active || !props.payload?.[0]) return null;
              const entry = props.payload[0].payload;
              return (
                <ChartTooltip
                  active={props.active}
                  payload={[
                    {
                      ...props.payload[0],
                      name: entry.name,
                      value: `${entry.value} (${entry.percent.toFixed(1)}%)`,
                    },
                  ]}
                  label={props.label}
                />
              );
            }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              iconType="circle"
              formatter={(value, entry: any) => {
                const data = entry.payload;
                return `${value}: ${data.value} (${data.percent.toFixed(1)}%)`;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

