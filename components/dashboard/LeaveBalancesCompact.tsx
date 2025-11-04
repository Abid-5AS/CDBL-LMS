"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart } from "./DonutChart";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * [COMPACT Leave Balances]
 * Displays as compact 3-column glass cards with total remaining at top
 */
export function LeaveBalancesCompact({
  balanceData,
  isLoading,
}: {
  balanceData: any;
  isLoading: boolean;
}) {
  const policyLimits = {
    EARNED: 24,
    CASUAL: 10,
    MEDICAL: 14,
  };

  const balances = useMemo(() => {
    const earned = balanceData?.EARNED ?? 0;
    const casual = balanceData?.CASUAL ?? 0;
    const medical = balanceData?.MEDICAL ?? 0;

    return {
      earned: {
        remaining: earned,
        total: policyLimits.EARNED,
      },
      casual: {
        remaining: casual,
        total: policyLimits.CASUAL,
      },
      medical: {
        remaining: medical,
        total: policyLimits.MEDICAL,
      },
      totalRemaining: earned + casual + medical,
    };
  }, [balanceData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Total Remaining - Fixed at top */}
      <div className="flex items-center justify-center md:justify-end gap-2 px-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {balances.totalRemaining}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Days Remaining
        </span>
      </div>

      {/* 3-column compact cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Earned */}
        <Card className="solid-card p-2 flex flex-col items-center">
          <DonutChart
            value={balances.earned.remaining}
            total={balances.earned.total}
            className="size-16"
          />
          <div className="text-center mt-1">
            <p className="text-xs font-semibold">Earned</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {balances.earned.remaining}/{balances.earned.total}
            </p>
          </div>
        </Card>

        {/* Casual */}
        <Card className="solid-card p-2 flex flex-col items-center">
          <DonutChart
            value={balances.casual.remaining}
            total={balances.casual.total}
            className="size-16"
          />
          <div className="text-center mt-1">
            <p className="text-xs font-semibold">Casual</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {balances.casual.remaining}/{balances.casual.total}
            </p>
          </div>
        </Card>

        {/* Medical */}
        <Card className="solid-card p-2 flex flex-col items-center">
          <DonutChart
            value={balances.medical.remaining}
            total={balances.medical.total}
            className="size-16"
          />
          <div className="text-center mt-1">
            <p className="text-xs font-semibold">Medical</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {balances.medical.remaining}/{balances.medical.total}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

