"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/lib/apiClient";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";
import { DashboardGreeting } from "./Sections/Greeting";
import { ActionCenterCard } from "./Sections/ActionCenter";
import { LeaveOverviewCard } from "./Sections/LeaveOverview";
import { HistoryAnalyticsCard } from "./Sections/History";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED";

type LeaveRow = {
  id: number;
  type: string;
  status: LeaveStatus;
  workingDays?: number;
  endDate?: string;
  fitnessCertificateUrl?: string | null;
};

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
  // Use unified API client for data fetching
  const { data: leavesData, isLoading: isLoadingLeaves } = useApiQuery<{
    items: LeaveRow[];
  }>("/api/leaves?mine=1");
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  const leaves: LeaveRow[] = leavesData?.items || [];

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
            leavesData={leavesData}
            isLoadingBalance={isLoadingBalance}
            isLoadingLeaves={isLoadingLeaves}
          />
        </Suspense>

        {/* 4. History & Analytics Card (Tabbed) */}
        <Suspense
          fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}
        >
          <HistoryAnalyticsCard
            leaves={leavesData?.items || []}
            isLoadingLeaves={isLoadingLeaves}
          />
        </Suspense>
      </div>
    </DashboardErrorBoundary>
  );
}
