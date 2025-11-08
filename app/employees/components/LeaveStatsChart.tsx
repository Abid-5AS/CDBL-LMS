"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LeaveStatsChartProps = {
  data: { month: string; leavesTaken: number }[];
};

export function LeaveStatsChart({ data }: LeaveStatsChartProps) {
  return (
    <div className="rounded-lg border border-border-strong p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Monthly Leave Trend
      </h3>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="leavesTaken" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
