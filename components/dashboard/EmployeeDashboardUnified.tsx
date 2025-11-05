"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardGreeting } from "./DashboardGreeting";
import { ActionCenterCard } from "./ActionCenterCard";
import { LeaveOverviewCard } from "./LeaveOverviewCard";
import { HistoryAnalyticsCard } from "./HistoryAnalyticsCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED"

type LeaveRow = {
  id: number;
  type: string;
  status: LeaveStatus;
  workingDays?: number;
  endDate?: string;
  fitnessCertificateUrl?: string | null;
};

type EmployeeDashboardUnifiedProps = {
  username: string;
};

/**
 * [REDESIGNED EmployeeDashboardUnified]
 * Reorganized into 3 smart clusters with tabbed navigation:
 * 1. Action Center (returned requests + quick actions)
 * 2. Leave Overview (Balance | Team | Insights tabs)
 * 3. History & Analytics (Recent | Timeline | Heatmap | Distribution tabs)
 */
export function EmployeeDashboardUnified({
  username,
}: EmployeeDashboardUnifiedProps) {
  // Fetch all necessary data at the top level
  const { data: leavesData, isLoading: isLoadingLeaves } = useSWR(
    "/api/leaves?mine=1",
    fetcher
  );
  const { data: balanceData, isLoading: isLoadingBalance } = useSWR(
    "/api/balance/mine",
    fetcher
  );

  const leaves: LeaveRow[] = leavesData?.items || [];

  return (
    <div className="space-y-4">
      {/* 1. Simplified Greeting */}
      <DashboardGreeting />

      {/* 2. Action Center Card */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ActionCenterCard leaves={leaves} isLoading={isLoadingLeaves} />
      </Suspense>

      {/* 3. Leave Overview Card (Tabbed) */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LeaveOverviewCard
          balanceData={balanceData}
          leavesData={leavesData}
          isLoadingBalance={isLoadingBalance}
          isLoadingLeaves={isLoadingLeaves}
        />
      </Suspense>

      {/* 4. History & Analytics Card (Tabbed) */}
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <HistoryAnalyticsCard
          leaves={leavesData?.items || []}
          isLoadingLeaves={isLoadingLeaves}
        />
      </Suspense>
    </div>
  );
}
