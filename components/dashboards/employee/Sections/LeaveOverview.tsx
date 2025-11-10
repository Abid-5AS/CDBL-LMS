"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { SegmentedControlGlider } from "@/components/shared/widgets/SegmentedControlGlider";
import { LeaveBalancePanel } from "@/components/shared/LeaveBalancePanel";
import {
  LeaveActivityCard,
  createLeaveActivityData,
} from "@/components/shared";
import { fromDashboardSummary } from "@/components/shared/balance-adapters";
import { TeamOnLeaveWidget } from "@/components/shared/widgets/TeamOnLeaveWidget";
import { InsightsWidget } from "@/components/dashboards/common/InsightsWidget";

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
  const [activeTab, setActiveTab] = useState<
    "balance" | "activity" | "team" | "insights"
  >("activity");

  const tabOptions = [
    { value: "activity", label: "Activity" },
    { value: "balance", label: "Balance" },
    { value: "team", label: "Team" },
    { value: "insights", label: "Insights" },
  ];

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            Leave Overview
          </CardTitle>
          <div className="w-full max-w-xs">
            <SegmentedControlGlider
              options={tabOptions}
              selected={activeTab}
              onChange={(value) =>
                setActiveTab(
                  value as "balance" | "activity" | "team" | "insights"
                )
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "activity" && (
          <div className="py-2">
            {isLoadingBalance ? (
              <div className="flex items-center justify-center py-8">
                <Skeleton className="w-80 h-64 rounded-2xl" />
              </div>
            ) : (
              <LeaveActivityCard
                title="My Leave Balance"
                activities={createLeaveActivityData({
                  earnedUsed: balanceData?.earned?.used || 0,
                  earnedTotal: balanceData?.earned?.total || 20,
                  casualUsed: balanceData?.casual?.used || 0,
                  casualTotal: balanceData?.casual?.total || 10,
                  medicalUsed: balanceData?.medical?.used || 0,
                  medicalTotal: balanceData?.medical?.total || 14,
                })}
                className="border-0 shadow-none bg-transparent"
              />
            )}
          </div>
        )}
        {activeTab === "balance" && (
          <LeaveBalancePanel
            balances={fromDashboardSummary(balanceData)}
            variant="full"
            showMeters={true}
            showPolicyHints={true}
            loading={isLoadingBalance}
            onClickType={(type) => {
              // Navigate to apply page with type pre-selected
              window.location.href = `/leaves/apply?type=${type}`;
            }}
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
