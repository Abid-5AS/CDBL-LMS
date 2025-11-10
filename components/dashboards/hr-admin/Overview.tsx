"use client";

import { Suspense } from "react";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PendingLeaveRequestsTable } from "./Sections/PendingApprovals";
import { CancellationRequestsPanel } from "./Sections/CancellationRequests";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { ModernHRStatCards } from "@/components/ModernHRStatCards";

type HRAdminDashboardProps = {
  username: string;
};

/**
 * HR Admin Dashboard - Operational Leave Management
 * Focus: Department-level leave operations (forward/reject/return)
 *
 * Note: PendingLeaveRequestsTable handles its own modal internally
 * Note: Reports & Analytics is available in the top navbar
 *
 * Refactored to use enhanced DashboardLayout (title/description moved to page level)
 */
export function HRAdminDashboard({ username }: HRAdminDashboardProps) {
  // Mock stats for demonstration - replace with real data
  const mockStats = {
    employeesOnLeave: 8,
    pendingRequests: 12,
    avgApprovalTime: 2.5,
    encashmentPending: 4,
    totalLeavesThisYear: 342,
    processedToday: 6,
    dailyTarget: 10,
    teamUtilization: 85,
    complianceScore: 94,
  };

  return (
    <DashboardErrorBoundary role="HR_ADMIN">
      <div className="space-y-6">
        {/* HR Analytics Overview */}
        <DashboardSection title="Analytics Overview">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <ModernHRStatCards stats={mockStats} />
          </Suspense>
        </DashboardSection>

        {/* Pending Leave Requests */}
        <DashboardSection title="Pending Leave Requests">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <PendingLeaveRequestsTable />
          </Suspense>
        </DashboardSection>

        {/* Cancellation Requests */}
        <DashboardSection title="Cancellation Requests">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <CancellationRequestsPanel />
          </Suspense>
        </DashboardSection>
      </div>
    </DashboardErrorBoundary>
  );
}
