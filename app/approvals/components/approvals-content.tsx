"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ApprovalTable } from "@/components/HRAdmin/ApprovalTable";
import { EmployeeDetailModal } from "@/components/HRAdmin/EmployeeDetailModal";
import { HRAdminStats } from "@/components/HRAdmin/HRAdminStats";
import { HRApprovalItem } from "@/components/HRAdmin/types";
import { submitApprovalDecision } from "@/lib/api";

export function ApprovalsContent() {
  const [items, setItems] = useState<HRApprovalItem[]>([]);
  const [selected, setSelected] = useState<HRApprovalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [tableLoaded, setTableLoaded] = useState(false);
  const refreshRef = useRef<() => void>(() => {});

  const handleDataChange = useCallback((nextItems: HRApprovalItem[], refresh: () => void) => {
    setItems(nextItems);
    refreshRef.current = refresh;
    setTableLoaded(true);
    if (selected) {
      const refreshed = nextItems.find((item) => item.id === selected.id);
      if (refreshed) {
        setSelected(refreshed);
      }
    }
  }, [selected]);

  const handleSelect = useCallback((item: HRApprovalItem) => {
    setSelected(item);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelected(null);
    }
  }, []);

  const runDecision = useCallback(
    async (action: "approve" | "reject") => {
      if (!selected) return;
      try {
        setModalLoading(true);
        await submitApprovalDecision(selected.id, action);
        toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
        await refreshRef.current?.();
        setModalOpen(false);
        setSelected(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update request";
        toast.error(message);
      } finally {
        setModalLoading(false);
      }
    },
    [selected]
  );

  return (
    <div className="space-y-6">
      <HRAdminStats items={items} loading={!tableLoaded} />
      <ApprovalTable onSelect={handleSelect} onDataChange={handleDataChange} />
      <EmployeeDetailModal
        open={modalOpen}
        item={selected}
        onOpenChange={handleCloseModal}
        onApprove={() => runDecision("approve")}
        onReject={() => runDecision("reject")}
        loading={modalLoading}
      />
    </div>
  );
}
