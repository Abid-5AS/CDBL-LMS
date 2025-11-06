"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/reports/ChartTooltip";

type ChartData = {
  month: string;
  leaves: number;
};

type LeaveTrendChartProps = {
  data: ChartData[];
};

export function LeaveTrendChart({ data }: LeaveTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <RechartsTooltip content={<ChartTooltip />} />
        <Bar dataKey="leaves" fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  );
}

