"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DonutChart } from "./DonutChart";
import { Umbrella, Zap, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeaveBalanceCardsProps {
  balanceData: any;
  leavesData?: any; // Optional: leaves data to find last used date
  isLoading: boolean;
}

export function LeaveBalanceCards({
  balanceData,
  leavesData,
  isLoading,
}: LeaveBalanceCardsProps) {
  const router = useRouter();

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
        used: policyLimits.EARNED - earned,
      },
      casual: {
        remaining: casual,
        total: policyLimits.CASUAL,
        used: policyLimits.CASUAL - casual,
      },
      medical: {
        remaining: medical,
        total: policyLimits.MEDICAL,
        used: policyLimits.MEDICAL - medical,
      },
    };
  }, [balanceData]);

  // Find last used date for each leave type
  const lastUsedDates = useMemo(() => {
    if (!leavesData?.items) return {};

    const approvedLeaves = leavesData.items.filter(
      (l: any) => l.status === "APPROVED"
    );

    const findLastUsed = (type: string) => {
      const typeLeaves = approvedLeaves
        .filter((l: any) => l.type === type)
        .sort((a: any, b: any) => 
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        );
      return typeLeaves[0]?.endDate;
    };

    return {
      EARNED: findLastUsed("EARNED"),
      CASUAL: findLastUsed("CASUAL"),
      MEDICAL: findLastUsed("MEDICAL"),
    };
  }, [leavesData]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const cards = [
    {
      type: "EARNED",
      label: "Earned Leave",
      icon: Umbrella,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      data: balances.earned,
      lastUsed: lastUsedDates.EARNED,
    },
    {
      type: "CASUAL",
      label: "Casual Leave",
      icon: Zap,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      data: balances.casual,
      lastUsed: lastUsedDates.CASUAL,
    },
    {
      type: "MEDICAL",
      label: "Medical Leave",
      icon: HeartPulse,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      data: balances.medical,
      lastUsed: lastUsedDates.MEDICAL,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const percentage = card.data.total > 0 
          ? Math.round((card.data.remaining / card.data.total) * 100) 
          : 0;
        const Icon = card.icon;

        return (
          <TooltipProvider key={card.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className={cn(
                    "solid-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
                    "bg-gradient-to-br",
                    card.bgGradient,
                    card.borderColor,
                    "border-2",
                    "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    const typeParam = card.type === "EARNED" ? "EARNED" : card.type === "CASUAL" ? "CASUAL" : "MEDICAL";
                    router.push(`/leaves/apply?type=${typeParam}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const typeParam = card.type === "EARNED" ? "EARNED" : card.type === "CASUAL" ? "CASUAL" : "MEDICAL";
                      router.push(`/leaves/apply?type=${typeParam}`);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-br",
                          card.gradient,
                          "text-white"
                        )}>
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {card.label}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {card.data.remaining}/{card.data.total} days
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {card.data.remaining}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {percentage}% remaining
                        </p>
                      </div>
                      <DonutChart
                        value={card.data.remaining}
                        total={card.data.total}
                        className="size-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  Last used on {formatDate(card.lastUsed)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
