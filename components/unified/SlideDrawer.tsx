"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useUIStore } from "@/lib/ui-state";
import { LeaveDetailsModal } from "@/components/dashboard/LeaveDetailsModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SlideDrawer() {
  const { drawerOpen, closeDrawer, selectedRequestId } = useUIStore();

  // Fetch leave data when a request is selected
  const { data, isLoading } = useSWR(
    selectedRequestId ? `/api/leaves?mine=1` : null,
    fetcher
  );

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

