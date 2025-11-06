"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { ChartTooltip } from "./ChartTooltip";

type ChartsSectionProps = {
  monthlyTrend: Array<{ month: string; leaves: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  departmentSummary: Array<{ name: string; count: number }>;
  isLoading?: boolean;
};

const COLORS = [
  "#2563eb",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#9333ea",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ChartsSection({
  monthlyTrend,
  typeDistribution,
  departmentSummary,
  isLoading,
}: ChartsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Department-wise Leave Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div variants={chartVariants} initial="hidden" animate="visible" transition={{ duration: 0.3 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Approved leaves per month (This Year)</p>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="leaves"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Distribution by leave type</p>
          </CardHeader>
          <CardContent>
            {typeDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
        className="lg:col-span-2"
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Department-wise Leave Summary</CardTitle>
            <p className="text-sm text-muted-foreground">Top departments by leave usage</p>
          </CardHeader>
          <CardContent>
            {departmentSummary.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentSummary} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

