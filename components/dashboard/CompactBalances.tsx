"use client";

import useSWR from "swr";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const POLICY_LIMITS = {
  EARNED: 60,
  CASUAL: 10,
  MEDICAL: 14,
};

const LEAVE_LABELS: Record<string, string> = {
  EARNED: "Earned Leave",
  CASUAL: "Casual Leave",
  MEDICAL: "Medical Leave",
};

export function CompactBalances() {
  const { data, error, isLoading } = useSWR("/api/balance/mine", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const balances = [
    { type: "EARNED", value: data.EARNED ?? 0 },
    { type: "CASUAL", value: data.CASUAL ?? 0 },
    { type: "MEDICAL", value: data.MEDICAL ?? 0 },
  ];

  const getProgressColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return "bg-emerald-500";
    if (percentage > 20) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return "text-emerald-600";
    if (percentage > 20) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-3">
      {balances.map((balance) => {
        const total = POLICY_LIMITS[balance.type as keyof typeof POLICY_LIMITS];
        const used = Math.max(0, total - balance.value);
        const progressPercentage = Math.min(Math.max((used / total) * 100, 0), 100);
        const statusColor = getStatusColor(balance.value, total);

        return (
          <div key={balance.type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">
                {LEAVE_LABELS[balance.type]}
              </span>
              <span className={`font-semibold ${statusColor}`}>
                {balance.value} days
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-1.5"
              indicatorClassName={getProgressColor(balance.value, total)}
            />
          </div>
        );
      })}
    </div>
  );
}

