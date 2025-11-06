"use client";

import { Suspense } from "react";
import { PendingLeaveRequestsTable } from "./PendingLeaveRequestsTable";
import { CancellationRequestsPanel } from "./CancellationRequestsPanel";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";

type HRAdminDashboardProps = {
  username: string;
};

/**
 * HR Admin Dashboard - Operational Leave Management
 * Focus: Department-level leave operations (forward/reject/return)
 * 
 * Note: PendingLeaveRequestsTable handles its own modal internally
 * Note: Reports & Analytics is available in the top navbar
 */
export function HRAdminDashboard({ username }: HRAdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardSection
        title="HR & Admin Dashboard"
        description="Operational leave management and forwarding"
      />

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
  );
}

