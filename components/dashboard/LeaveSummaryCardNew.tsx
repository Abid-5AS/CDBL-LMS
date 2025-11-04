"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart } from "./DonutChart";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * [REDESIGNED LeaveSummaryCard]
 * Uses DonutCharts for a modern, Apple-inspired look.
 */
export function LeaveSummaryCardNew({
  balanceData,
  isLoading,
}: {
  balanceData: any;
  isLoading: boolean;
}) {
  const policyLimits = {
    EARNED: 24, // From Policy v2.0 (24 days/year, 2 days/month accrual)
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
      <Card className="p-6">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="solid-card animate-fade-in-up animate-delay-200ms">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Leave Balances</CardTitle>
        <CardDescription>
          Your total available days for the year.
        </CardDescription>
        <div className="pt-2">
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {balances.totalRemaining}
          </span>
          <span className="ml-1.5 text-lg text-gray-500 dark:text-gray-400">
            Days Remaining
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 pt-0">
        <div className="flex flex-col items-center gap-2">
          <DonutChart
            value={balances.earned.remaining}
            total={balances.earned.total}
          />
          <div className="text-center">
            <p className="text-sm font-semibold">Earned</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {balances.earned.remaining} / {balances.earned.total}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <DonutChart
            value={balances.casual.remaining}
            total={balances.casual.total}
          />
          <div className="text-center">
            <p className="text-sm font-semibold">Casual</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {balances.casual.remaining} / {balances.casual.total}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <DonutChart
            value={balances.medical.remaining}
            total={balances.medical.total}
          />
          <div className="text-center">
            <p className="text-sm font-semibold">Medical</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {balances.medical.remaining} / {balances.medical.total}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

