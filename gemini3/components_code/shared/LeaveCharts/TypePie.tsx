"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";

export type Slice = {
  type?: "CASUAL" | "EARNED" | "MEDICAL";
  name?: string; // Support flexible naming
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

// Modern color palette using CSS variables for consistent theming
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Fallback colors for leave types (used when CSS variables unavailable)
const TYPE_COLORS_MAP: Record<string, string> = {
  EARNED: "hsl(var(--chart-2))",
  CASUAL: "hsl(var(--chart-1))",
  MEDICAL: "hsl(var(--chart-3))",
};

// Custom glass-styled tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-semibold text-foreground mb-2">{data.name}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Count:</span>
            <span className="font-semibold text-foreground">{data.value}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Percentage:</span>
            <span className="font-semibold text-foreground">{data.percent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom label renderer with better styling
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 5) return null; // Hide labels for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * TypePie - Modern leave type distribution donut chart
 * Enhanced with gradients, glass tooltips, and flexible data support
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

  // Compute percentages and total, support both type and name fields
  const chartData = useMemo(() => {
    const total = data.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) return [];

    return data.map((slice, index) => {
      // Support both typed and generic data
      const displayName = slice.type
        ? (leaveTypeLabel[slice.type] || slice.type)
        : (slice.name || `Category ${index + 1}`);

      return {
        name: displayName,
        value: slice.value,
        percent: (slice.value / total) * 100,
        type: slice.type,
        originalIndex: index,
      };
    });
  }, [data]);

  // Get color for a slice
  const getSliceColor = (entry: any, index: number): string => {
    // If it has a type, use type-specific color
    if (entry.type && TYPE_COLORS_MAP[entry.type]) {
      return TYPE_COLORS_MAP[entry.type];
    }
    // Otherwise use sequential colors
    return CHART_COLORS[index % CHART_COLORS.length];
  };

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
            label={renderCustomLabel}
            outerRadius={donut ? 90 : 110}
            innerRadius={donut ? 60 : 0}
            paddingAngle={2}
            dataKey="value"
            onClick={(e) => {
              if (onSliceClick && e?.type) {
                const type = e.type as Slice["type"];
                // Telemetry: log click for filter UX confirmation
                if (typeof window !== "undefined" && window.console) {
                  console.debug("[TypePie] Slice clicked:", { type, timestamp: Date.now() });
                }
                onSliceClick(type);
              }
            }}
            aria-label={`Leave type distribution chart showing ${chartData.length} categories with total of ${chartData.reduce((sum, d) => sum + d.value, 0)} items`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getSliceColor(entry, index)}
                className="transition-opacity hover:opacity-80 cursor-pointer"
                stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "10px",
              }}
              iconType="circle"
              iconSize={10}
              formatter={(value, entry: any) => {
                const data = entry.payload;
                return (
                  <span className="text-xs text-muted-foreground">
                    {value}: <span className="font-semibold text-foreground">{data.value}</span> ({data.percent.toFixed(1)}%)
                  </span>
                );
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

