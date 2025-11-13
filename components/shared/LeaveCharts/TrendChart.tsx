"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type TrendPoint = {
  month: string;
  approved?: number;
  pending?: number;
  returned?: number;
  leaves?: number; // Support flexible data keys
  [key: string]: any; // Allow any numeric field
};

export type TrendChartProps = {
  data: TrendPoint[];
  stacked?: boolean; // default false
  height?: number; // default 240
  onBarClick?: (m: string) => void;
  className?: string;
  dataKey?: string; // Primary data key to display (default: "approved")
};

// Month order: Jan → Dec
const MONTH_ORDER = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Custom glass-styled tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground font-medium">{entry.name}:</span>
            </span>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * TrendChart - Modern monthly leave trend area chart with gradients
 * Supports flexible data keys and stacked visualization
 */
export function TrendChart({
  data,
  stacked = false,
  height = 240,
  onBarClick,
  className,
  dataKey = "approved",
}: TrendChartProps) {
  const { theme } = useTheme();

  // Auto-detect data key if not provided
  const detectedDataKey = useMemo(() => {
    if (data.length === 0) return dataKey;
    const firstPoint = data[0];
    // Check for common keys
    if (firstPoint.leaves !== undefined) return "leaves";
    if (firstPoint.approved !== undefined) return "approved";
    // Find first numeric key
    const numericKey = Object.keys(firstPoint).find(
      (key) => key !== "month" && typeof firstPoint[key] === "number"
    );
    return numericKey || dataKey;
  }, [data, dataKey]);

  // Ensure all 12 months are present, sorted correctly
  const normalizedData = useMemo(() => {
    const dataMap = new Map<string, TrendPoint>();
    data.forEach((point) => {
      dataMap.set(point.month, point);
    });

    return MONTH_ORDER.map((month) => {
      const existing = dataMap.get(month);
      return (
        existing || {
          month,
          [detectedDataKey]: 0,
          approved: 0,
          pending: 0,
          returned: 0,
        }
      );
    });
  }, [data, detectedDataKey]);

  const isDark = theme === "dark";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.15)";
  const textColor = isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.75)";

  return (
    <div className={cn("w-full", className)} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={normalizedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          onClick={(e: any) => {
            if (onBarClick && e?.activeLabel) {
              const month = e.activeLabel;
              // Telemetry: log click for filter UX confirmation
              if (typeof window !== "undefined" && window.console) {
                console.debug("[TrendChart] Area clicked:", { month, timestamp: Date.now() });
              }
              onBarClick(month);
            }
          }}
          aria-label={`Monthly leave trend chart from ${normalizedData[0]?.month || "Jan"} to ${normalizedData[normalizedData.length - 1]?.month || "Dec"}`}
        >
          <defs>
            {/* Gradient for primary data */}
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradients for stacked areas */}
            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: textColor, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {stacked ? (
            <>
              <Area
                type="monotone"
                dataKey="approved"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorApproved)"
                fillOpacity={1}
                strokeWidth={2}
                name="Approved"
              />
              {data.some((d) => d.pending) && (
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#colorPending)"
                  fillOpacity={1}
                  strokeWidth={2}
                  name="Pending"
                />
              )}
              {data.some((d) => d.returned) && (
                <Area
                  type="monotone"
                  dataKey="returned"
                  stackId="1"
                  stroke="hsl(var(--chart-4))"
                  fill="url(#colorReturned)"
                  fillOpacity={1}
                  strokeWidth={2}
                  name="Returned"
                />
              )}
            </>
          ) : (
            <Area
              type="monotone"
              dataKey={detectedDataKey}
              stroke="hsl(var(--chart-1))"
              fill="url(#colorPrimary)"
              fillOpacity={1}
              strokeWidth={3}
              name={detectedDataKey.charAt(0).toUpperCase() + detectedDataKey.slice(1)}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

