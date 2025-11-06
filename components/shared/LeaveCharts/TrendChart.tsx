"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/reports/ChartTooltip";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type TrendPoint = {
  month: string;
  approved: number;
  pending?: number;
  returned?: number;
};

export type TrendChartProps = {
  data: TrendPoint[];
  stacked?: boolean; // default false
  height?: number; // default 240
  onBarClick?: (m: string) => void;
  className?: string;
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

/**
 * TrendChart - Monthly leave trend bar chart
 * Consolidates LeaveTrendChart and monthly trend displays
 */
export function TrendChart({
  data,
  stacked = false,
  height = 240,
  onBarClick,
  className,
}: TrendChartProps) {
  const { theme } = useTheme();

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
          approved: 0,
          pending: 0,
          returned: 0,
        }
      );
    });
  }, [data]);

  const isDark = theme === "dark";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
  const textColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)";

  return (
    <div className={cn("w-full", className)} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={normalizedData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          onClick={(e) => {
            if (onBarClick && e?.activePayload?.[0]?.payload?.month) {
              onBarClick(e.activePayload[0].payload.month);
            }
          }}
          aria-label="Monthly leave trend chart"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fill: textColor, fontSize: 12 }}
            tickLine={{ stroke: gridColor }}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 12 }}
            tickLine={{ stroke: gridColor }}
          />
          <RechartsTooltip content={<ChartTooltip />} />
          {stacked ? (
            <>
              <Bar
                dataKey="approved"
                stackId="a"
                fill="rgb(34, 197, 94)"
                radius={[0, 0, 0, 0]}
              />
              {data.some((d) => d.pending) && (
                <Bar
                  dataKey="pending"
                  stackId="a"
                  fill="rgb(251, 191, 36)"
                  radius={[0, 0, 0, 0]}
                />
              )}
              {data.some((d) => d.returned) && (
                <Bar
                  dataKey="returned"
                  stackId="a"
                  fill="rgb(239, 68, 68)"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </>
          ) : (
            <Bar
              dataKey="approved"
              fill="rgb(37, 99, 235)"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

