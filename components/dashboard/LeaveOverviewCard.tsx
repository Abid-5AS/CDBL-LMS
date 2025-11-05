"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControlGlider } from "./SegmentedControlGlider";
import { LeaveBalanceCards } from "./LeaveBalanceCards";
import { TeamOnLeaveWidget } from "./TeamOnLeaveWidget";
import { InsightsWidget } from "./InsightsWidget";

interface LeaveOverviewCardProps {
  balanceData: any;
  leavesData?: any;
  isLoadingBalance: boolean;
  isLoadingLeaves: boolean;
}

export function LeaveOverviewCard({
  balanceData,
  leavesData,
  isLoadingBalance,
  isLoadingLeaves,
}: LeaveOverviewCardProps) {
  const [activeTab, setActiveTab] = useState<"balance" | "team" | "insights">("balance");

  const tabOptions = [
    { value: "balance", label: "Balance" },
    { value: "team", label: "Team" },
    { value: "insights", label: "Insights" },
  ];

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Leave Overview</CardTitle>
          <div className="w-full max-w-xs">
            <SegmentedControlGlider
              options={tabOptions}
              selected={activeTab}
              onChange={(value) => setActiveTab(value as "balance" | "team" | "insights")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "balance" && (
          <LeaveBalanceCards
            balanceData={balanceData}
            leavesData={leavesData}
            isLoading={isLoadingBalance}
          />
        )}
        {activeTab === "team" && (
          <div className="[&>div]:shadow-none [&>div]:border-0">
            <TeamOnLeaveWidget />
          </div>
        )}
        {activeTab === "insights" && (
          <div className="[&>div]:shadow-none [&>div]:border-0">
            <InsightsWidget />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

