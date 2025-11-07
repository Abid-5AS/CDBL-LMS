"use client";

import { useMemo } from "react";
import { useUIStore } from "@/lib/ui-state";
import { LeaveDetailsModal } from "@/components/shared/LeaveDetailsModal";
import { useLeaveData } from "@/components/providers/LeaveDataProvider";

export function SlideDrawer() {
  const { drawerOpen, closeDrawer, selectedRequestId } = useUIStore();

  const { data, isLoading } = useLeaveData();

  // Find the selected leave from the data
  const selectedLeave = useMemo(() => {
    if (!selectedRequestId || !data?.items) return null;
    return (
      Array.isArray(data.items)
        ? data.items.find((item: { id: number }) => item.id === selectedRequestId)
        : null
    );
  }, [selectedRequestId, data]);

  return (
    <LeaveDetailsModal
      open={drawerOpen}
      onOpenChange={closeDrawer}
      leave={selectedLeave}
    />
  );
}
