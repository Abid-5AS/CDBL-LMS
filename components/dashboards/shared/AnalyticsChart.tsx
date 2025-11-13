"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Modern color palette using CSS variables for consistency
const CHART_COLORS = {
  primary: "hsl(var(--data-info))",
  success: "hsl(var(--data-success))",
  warning: "hsl(var(--data-warning))",
  error: "hsl(var(--data-error))",
  secondary: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
};

// Use standardized chart color variables
const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#ec4899", // pink fallback
  "#06b6d4", // cyan fallback
  "#84cc16", // lime fallback
];

// Glass-styled tooltip configuration
const glassTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  backdropFilter: "blur(12px)",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
};

interface BaseChartProps {
  title?: string;
  subtitle?: string;
  className?: string;
  isLoading?: boolean;
}

// Line Chart Component
interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface AnalyticsLineChartProps extends BaseChartProps {
  data: LineChartData[];
  dataKeys: { key: string; color?: string; name?: string }[];
  xAxisKey?: string;
}

export function AnalyticsLineChart({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey = "name",
  className,
  isLoading,
}: AnalyticsLineChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />;
  }

  return (
    <Card className={cn("rounded-2xl", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Legend />
            {dataKeys.map((item, index) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name || item.key}
                stroke={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface AnalyticsBarChartProps extends BaseChartProps {
  data: BarChartData[];
  dataKeys: { key: string; color?: string; name?: string }[];
  xAxisKey?: string;
  stacked?: boolean;
}

export function AnalyticsBarChart({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey = "name",
  stacked = false,
  className,
  isLoading,
}: AnalyticsBarChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />;
  }

  return (
    <Card className={cn("rounded-2xl", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Legend />
            {dataKeys.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name || item.key}
                fill={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                stackId={stacked ? "stack" : undefined}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Area Chart Component
interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface AnalyticsAreaChartProps extends BaseChartProps {
  data: AreaChartData[];
  dataKeys: { key: string; color?: string; name?: string }[];
  xAxisKey?: string;
  stacked?: boolean;
}

export function AnalyticsAreaChart({
  title,
  subtitle,
  data,
  dataKeys,
  xAxisKey = "name",
  stacked = false,
  className,
  isLoading,
}: AnalyticsAreaChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />;
  }

  return (
    <Card className={cn("rounded-2xl", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((item, index) => (
                <linearGradient
                  key={item.key}
                  id={`color${item.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={
                      item.color || PIE_COLORS[index % PIE_COLORS.length]
                    }
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      item.color || PIE_COLORS[index % PIE_COLORS.length]
                    }
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip contentStyle={glassTooltipStyle} />
            <Legend />
            {dataKeys.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name || item.key}
                stroke={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                strokeWidth={2}
                fill={`url(#color${item.key})`}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Pie Chart Component
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface AnalyticsPieChartProps extends BaseChartProps {
  data: PieChartData[];
  showPercentage?: boolean;
}

export function AnalyticsPieChart({
  title,
  subtitle,
  data,
  showPercentage = true,
  className,
  isLoading,
}: AnalyticsPieChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = (entry: PieChartData) => {
    if (!showPercentage) return entry.name;
    const percentage = ((entry.value / total) * 100).toFixed(1);
    return `${entry.name} (${percentage}%)`;
  };

  return (
    <Card className={cn("rounded-2xl", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={glassTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Chart Skeleton Loader
function ChartSkeleton({
  title,
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      {title && (
        <CardHeader>
          <div className="h-5 w-32 bg-muted/50 animate-pulse rounded" />
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px] bg-muted/20 animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  );
}

// Export utility for consistent colors
export { CHART_COLORS, PIE_COLORS };
