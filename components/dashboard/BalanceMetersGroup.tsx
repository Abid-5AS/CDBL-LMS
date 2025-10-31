"use client";

import { CircularMeter } from "./CircularMeter";
import useSWR from "swr";
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

const LEAVE_COLORS: Record<string, string> = {
  EARNED: "text-blue-600",
  CASUAL: "text-emerald-600",
  MEDICAL: "text-amber-600",
};

export function BalanceMetersGroup() {
  const { data, error, isLoading } = useSWR("/api/balance/mine", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
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

  return (
    <div className="space-y-4">
      {balances.map((balance) => {
        const total = POLICY_LIMITS[balance.type as keyof typeof POLICY_LIMITS];
        const used = Math.max(0, total - balance.value);
        const color = LEAVE_COLORS[balance.type];

        return (
          <CircularMeter
            key={balance.type}
            label={LEAVE_LABELS[balance.type]}
            used={used}
            total={total}
            color={color}
          />
        );
      })}
    </div>
  );
}

