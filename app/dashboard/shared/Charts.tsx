"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BarChartData = {
  name: string;
  value: number;
  [key: string]: string | number;
};

type PieChartData = {
  name: string;
  value: number;
  color?: string;
};

type ChartProps = {
  title?: string;
  description?: string;
  className?: string;
};

type BarChartProps = ChartProps & {
  data: BarChartData[];
  dataKey: string;
  color?: string;
  height?: number;
};

type LineChartProps = ChartProps & {
  data: BarChartData[];
  dataKey: string;
  color?: string;
  height?: number;
};

type PieChartProps = ChartProps & {
  data: PieChartData[];
  height?: number;
};

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
];

/**
 * Bar chart component with Recharts
 * Material 3 style with animations
 */
export function BarChartCard({
  title,
  description,
  data,
  dataKey,
  color = "#3b82f6",
  height = 300,
  className,
}: BarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("rounded-2xl border border-border/50 bg-card shadow-sm", className)}>
        {(title || description) && (
          <CardHeader className="px-6 pt-6">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[8, 8, 0, 0]}
                animationDuration={800}
                animationBegin={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Line chart component with Recharts
 * Material 3 style with animations
 */
export function LineChartCard({
  title,
  description,
  data,
  dataKey,
  color = "#3b82f6",
  height = 300,
  className,
}: LineChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("rounded-2xl border border-border/50 bg-card shadow-sm", className)}>
        {(title || description) && (
          <CardHeader className="px-6 pt-6">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
                animationBegin={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Pie chart component with Recharts
 * Material 3 style with animations
 */
export function PieChartCard({
  title,
  description,
  data,
  height = 300,
  className,
}: PieChartProps) {
  const colors = data.map((item, index) => item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("rounded-2xl border border-border/50 bg-card shadow-sm", className)}>
        {(title || description) && (
          <CardHeader className="px-6 pt-6">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
                animationBegin={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}


