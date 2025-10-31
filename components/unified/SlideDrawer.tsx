"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { useUIStore } from "@/lib/ui-state";
import { LeaveTimeline } from "@/components/dashboard/LeaveTimeline";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/app/dashboard/components/status-badge";
import { leaveTypeLabel } from "@/lib/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SlideDrawer() {
  const { drawerOpen, closeDrawer, selectedRequestId } = useUIStore();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeDrawer]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={clsx(
          "fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50",
          "transform transition-transform duration-300 ease-out overflow-hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="drawer-title" className="text-xl font-semibold text-gray-900">
            Leave Request Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="rounded-full hover:bg-gray-100"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 80px)" }}>
          <DrawerContent requestId={selectedRequestId} />
        </div>
      </div>
    </>
  );
}

function DrawerContent({ requestId }: { requestId: number | null }) {
  const { data, isLoading, error } = useSWR(
    requestId ? `/api/leaves?mine=1` : null,
    fetcher
  );

  if (!requestId || isLoading) {
    return <div className="text-gray-600">Loading details...</div>;
  }

  if (error) {
    return <div className="text-red-600">Failed to load details</div>;
  }

  const leave = Array.isArray(data?.items) 
    ? data.items.find((item: { id: number }) => item.id === requestId)
    : null;

  if (!leave) {
    return <div className="text-gray-600">Leave not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Leave Type</h3>
          <p className="text-base font-semibold text-gray-900">
            {leaveTypeLabel[leave.type] ?? leave.type}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
          <StatusBadge status={leave.status} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Dates</h3>
          <p className="text-base text-gray-900">
            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
          <p className="text-base text-gray-900">{leave.workingDays} working days</p>
        </div>

        {leave.reason && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Reason</h3>
            <p className="text-base text-gray-900 whitespace-pre-wrap">{leave.reason}</p>
          </div>
        )}
      </div>

      {/* Approval Timeline */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Approval Status</h3>
        <LeaveTimeline requestId={requestId} variant="detailed" />
      </div>
    </div>
  );
}

