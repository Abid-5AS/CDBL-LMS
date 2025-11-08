"use client";

import { Suspense } from "react";

// UI Components (barrel export)
import { Skeleton } from "@/components/ui";

// Shared components
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

// Local sections
import { DashboardGreeting } from "./Sections/Greeting";
import { ActionCenterCard } from "./Sections/ActionCenter";
import { LeaveOverviewCard } from "./Sections/LeaveOverview";
import { HistoryAnalyticsCard } from "./Sections/History";

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
    <DashboardErrorBoundary role="EMPLOYEE">
      <div className="space-y-6">
        {/* 1. Simplified Greeting */}
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <DashboardGreeting />
        </Suspense>

        {/* 2. Action Center Card */}
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
          <ActionCenterCard leaves={leaves} isLoading={isLoadingLeaves} />
        </Suspense>

        {/* 3. Leave Overview Card (Tabbed) */}
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <LeaveOverviewCard
            balanceData={balanceData}
            isLoadingBalance={isLoadingBalance}
            isLoadingLeaves={isLoadingLeaves}
          />
        </Suspense>

        {/* 4. History & Analytics Card (Tabbed) */}
        <Suspense
          fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}
        >
          <HistoryAnalyticsCard
            leaves={leaves}
            isLoadingLeaves={isLoadingLeaves}
          />
        </Suspense>
      </div>
    </DashboardErrorBoundary>
  );
}
