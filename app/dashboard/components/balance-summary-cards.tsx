"use client";

import useSWR from "swr";
import { KPICard } from "./kpi-card";
import { CalendarCheck, Clock, Plus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BalanceSummaryCards() {
  const { data, error } = useSWR("/api/balance/mine", fetcher, {
    revalidateOnFocus: false,
  });

  const loading = !data && !error;
  const earned = data?.EARNED ?? 0;
  const casual = data?.CASUAL ?? 0;
  const medical = data?.MEDICAL ?? 0;

  const formatValue = (value: number) => (loading ? "..." : `${value} days`);

  return (
    <>
      <KPICard
        title="Available Earned Leave"
        value={formatValue(earned)}
        subtext="Carry-forward allowed up to 60 days"
        icon={CalendarCheck}
      />
      <KPICard
        title="Available Casual Leave"
        value={formatValue(casual)}
        subtext="Max 3 consecutive days"
        icon={Clock}
      />
      <KPICard
        title="Available Medical Leave"
        value={formatValue(medical)}
        subtext="> 3 days requires medical certificate"
        icon={Plus}
      />
    </>
  );
}
