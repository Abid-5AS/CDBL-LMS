"use client";

// Shared components

// Local sections
import { DashboardGreeting } from "./sections/Greeting";
import { ActionCenterCard } from "./sections/ActionCenter";
import { LeaveOverviewCard } from "./sections/LeaveOverview";
import { HistoryAnalyticsCard } from "./sections/History";

// Lib/Hooks
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";

type EmployeeDashboardContentProps = {
  username: string;
};

/**
 * Consolidated Employee Dashboard Component
 *
 * Merges EmployeeDashboardUnified and EmployeeDashboard into a single component.
 * Uses unified API client and shared components.
 *
 * Structure:
 * 1. Action Center (returned requests + quick actions)
 * 2. Leave Overview (Balance | Team | Insights tabs)
 * 3. History & Analytics (Recent | Timeline | Heatmap | Distribution tabs)
 */
export function EmployeeDashboardContent({
  username,
}: EmployeeDashboardContentProps) {
  const { allRows: leaves, isLoading: isLoadingLeaves } = useLeaveRequests({
    enableSelection: false,
  });
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  return (
    <div className="space-y-6">
      {/* 1. Simplified Greeting */}
      <DashboardGreeting />

      {/* 2. Action Center Card */}
      <ActionCenterCard leaves={leaves} isLoading={isLoadingLeaves} />

      {/* 3. Leave Overview Card (Tabbed) */}
      <LeaveOverviewCard
        balanceData={balanceData}
        isLoadingBalance={isLoadingBalance}
        isLoadingLeaves={isLoadingLeaves}
      />

      {/* 4. History & Analytics Card (Tabbed) */}
      <HistoryAnalyticsCard leaves={leaves} isLoadingLeaves={isLoadingLeaves} />
    </div>
  );
}
