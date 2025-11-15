"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Chart Data Interface
 */
export interface LeaveChartData {
  type: string;
  used: number;
  available: number;
  pending?: number;
  total?: number;
}

/**
 * LeaveBreakdownChart Props
 *
 * @interface LeaveBreakdownChartProps
 * @property {LeaveChartData[]} data - Leave data by type
 * @property {'bar'|'pie'|'doughnut'} [chartType] - Chart visualization type
 * @property {string} [title] - Chart title
 * @property {boolean} [showLegend] - Display legend
 * @property {boolean} [interactive] - Enable hover interactions
 */
export interface LeaveBreakdownChartProps {
  data: LeaveChartData[];
  chartType?: "bar" | "pie" | "doughnut";
  title?: string;
  showLegend?: boolean;
  interactive?: boolean;
  isLoading?: boolean;
  className?: string;
  height?: number;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

/**
 * Custom Tooltip Component
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
        {payload[0].payload.type}
      </p>
      <div className="space-y-1 text-xs">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400 capitalize">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {entry.value} days
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LeaveBreakdownChart Component
 *
 * Visual representation of leave usage/distribution.
 * Supports bar, pie, and doughnut chart types.
 *
 * @example
 * ```tsx
 * <LeaveBreakdownChart
 *   data={[
 *     { type: 'Casual', used: 2, available: 3, total: 5 },
 *     { type: 'Earned', used: 18, available: 6, total: 24 }
 *   ]}
 *   chartType="bar"
 *   title="Leave Distribution"
 *   showLegend
 *   interactive
 * />
 * ```
 */
export function LeaveBreakdownChart({
  data,
  chartType = "bar",
  title = "Leave Breakdown",
  showLegend = true,
  interactive = true,
  isLoading = false,
  className,
  height = 300,
}: LeaveBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div
            className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
            style={{ height }}
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-gray-500 dark:text-gray-400"
            style={{ height }}
          >
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="type"
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: "currentColor" }}
        />
        <YAxis
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: "currentColor" }}
        />
        {interactive && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              paddingTop: "20px",
            }}
          />
        )}
        <Bar dataKey="used" fill="#3b82f6" name="Used" radius={[4, 4, 0, 0]} />
        <Bar dataKey="available" fill="#10b981" name="Available" radius={[4, 4, 0, 0]} />
        {data.some((d) => d.pending && d.pending > 0) && (
          <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const pieData = data.map((item) => ({
      name: item.type,
      value: item.used,
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={chartType === "doughnut" ? 100 : 120}
            innerRadius={chartType === "doughnut" ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {interactive && <Tooltip />}
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "10px",
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartType === "bar" && renderBarChart()}
          {(chartType === "pie" || chartType === "doughnut") && renderPieChart()}

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {item.type}
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {item.used}/{item.total || item.used + item.available}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.available} remaining
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * LeaveBreakdownChart Skeleton Loader
 */
export function LeaveBreakdownChartSkeleton({
  className,
  height = 300,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div
          className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded mb-6"
          style={{ height }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700"
            >
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
