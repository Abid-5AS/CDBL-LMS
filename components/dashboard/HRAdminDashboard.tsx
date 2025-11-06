"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { PendingLeaveRequestsTable } from "./PendingLeaveRequestsTable";
import { CancellationRequestsPanel } from "./CancellationRequestsPanel";
import { ReviewLeaveModal } from "./ReviewLeaveModal";
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { DashboardCardSkeleton } from "@/app/dashboard/shared/LoadingFallback";
import { Button } from "@/components/ui/button";
import { LeaveStatus } from "@prisma/client";

type HRAdminDashboardProps = {
  username: string;
};

type LeaveRequest = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  requester: {
    id: number;
    name: string;
    email: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * HR Admin Dashboard - Operational Leave Management
 * Focus: Department-level leave operations (forward/reject/return)
 */
export function HRAdminDashboard({ username }: HRAdminDashboardProps) {
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = useCallback((leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setModalOpen(true);
  }, []);

  const handleActionComplete = useCallback(() => {
    // Refetch will trigger via SWR revalidation in child components
  }, []);

  return (
    <>
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
            <PendingLeaveRequestsTable onRowClick={handleRowClick} />
          </Suspense>
        </DashboardSection>

        {/* Cancellation Requests */}
        <DashboardSection title="Cancellation Requests">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <CancellationRequestsPanel />
          </Suspense>
        </DashboardSection>
      </div>

      {/* Review Leave Modal */}
      <ReviewLeaveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        leaveRequest={selectedLeave}
        onActionComplete={handleActionComplete}
      />
    </>
  );
}

