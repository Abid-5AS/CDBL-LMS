"use client";

import useSWR from "swr";
import { KPICard } from "@/components/cards/KPICard";
import { CalendarCheck, Clock, Plus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Policy constants
const POLICY_LIMITS = {
  EARNED: 60, // Max that can be carried forward
  CASUAL: 10, // Annual limit
  MEDICAL: 14, // Annual limit
};

export function BalanceSummaryCards() {
  const { data, error } = useSWR("/api/balance/mine", fetcher, {
    revalidateOnFocus: false,
  });

  const loading = !data && !error;
  const earned = data?.EARNED ?? 0;
  const casual = data?.CASUAL ?? 0;
  const medical = data?.MEDICAL ?? 0;

  const formatValue = (value: number) => (loading ? "..." : `${value} days`);

  // Calculate status based on percentage remaining
  const getStatus = (available: number, total: number) => {
    if (loading) return undefined;
    const percentage = (available / total) * 100;
    if (percentage > 50) return "healthy";
    if (percentage > 20) return "low";
    return "critical";
  };

  // Add year-end badge for Casual Leave
  const currentMonth = new Date().getMonth();
  const showYearEndBadge = currentMonth >= 10 && casual > 0; // November or December

  return (
    <>
      <KPICard
        title="Available Earned Leave"
        value={formatValue(earned)}
        subtext="Carry-forward allowed up to 60 days"
        icon={CalendarCheck}
        progress={
          !loading
            ? {
                used: Math.max(0, POLICY_LIMITS.EARNED - earned),
                total: POLICY_LIMITS.EARNED,
              }
            : undefined
        }
        status={getStatus(earned, POLICY_LIMITS.EARNED)}
      />
      <KPICard
        title="Available Casual Leave"
        value={formatValue(casual)}
        subtext="Max 3 consecutive days"
        icon={Clock}
        progress={
          !loading
            ? {
                used: Math.max(0, POLICY_LIMITS.CASUAL - casual),
                total: POLICY_LIMITS.CASUAL,
              }
            : undefined
        }
        status={getStatus(casual, POLICY_LIMITS.CASUAL)}
        badge={showYearEndBadge ? "Expires Dec 31" : undefined}
        badgeVariant="outline"
      />
      <KPICard
        title="Available Medical Leave"
        value={formatValue(medical)}
        subtext="> 3 days requires medical certificate"
        icon={Plus}
        progress={
          !loading
            ? {
                used: Math.max(0, POLICY_LIMITS.MEDICAL - medical),
                total: POLICY_LIMITS.MEDICAL,
              }
            : undefined
        }
        status={getStatus(medical, POLICY_LIMITS.MEDICAL)}
      />
    </>
  );
}
