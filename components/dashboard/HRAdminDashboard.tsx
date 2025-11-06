"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { PendingLeaveRequestsTable } from "./PendingLeaveRequestsTable";
import { CancellationRequestsPanel } from "./CancellationRequestsPanel";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { Button } from "@/components/ui/button";

type HRAdminDashboardProps = {
  username: string;
};

/**
 * HR Admin Dashboard - Operational Leave Management
 * Focus: Department-level leave operations (forward/reject/return)
 * 
 * Note: PendingLeaveRequestsTable handles its own modal internally
 */
export function HRAdminDashboard({ username }: HRAdminDashboardProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardSection
        title="HR & Admin Dashboard"
        description="Operational leave management and forwarding"
        action={
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/reports")}
            aria-label="Export Report"
            className="rounded-full"
          >
            <Download className="h-4 w-4" />
          </Button>
        }
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

