"use client";

import dynamic from "next/dynamic";
import type { LeaveDistributionSlice, LeaveTrendPoint } from "@/lib/employee";

const LeaveStatsChart = dynamic(
  () => import("./LeaveStatsChart").then((mod) => mod.LeaveStatsChart),
  { ssr: false },
);
const LeaveDistributionChart = dynamic(
  () => import("./LeaveDistributionChart").then((mod) => mod.LeaveDistributionChart),
  { ssr: false },
);

type ChartsSectionProps = {
  trend: LeaveTrendPoint[];
  distribution: LeaveDistributionSlice[];
};

export default function ChartsSection({ trend, distribution }: ChartsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <LeaveStatsChart data={trend} />
      <LeaveDistributionChart data={distribution} />
    </div>
  );
}
