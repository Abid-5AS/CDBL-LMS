"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalTable } from "@/components/HRAdmin/ApprovalTable";
import { HRAdminStats } from "@/components/HRAdmin/HRAdminStats";
import { HRApprovalItem } from "@/components/HRAdmin/types";

export function ApprovalsContent() {
  const router = useRouter();
  const [items, setItems] = useState<HRApprovalItem[]>([]);
  const [tableLoaded, setTableLoaded] = useState(false);

  const handleDataChange = useCallback((nextItems: HRApprovalItem[]) => {
    setItems(nextItems);
    setTableLoaded(true);
  }, []);

  const handleSelect = useCallback(
    (item: HRApprovalItem) => {
      const targetId = item.requestedById ?? item.id;
      router.push(`/employees/${targetId}?request=${item.id}&from=approvals`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <HRAdminStats items={items} loading={!tableLoaded} />
      <ApprovalTable onSelect={handleSelect} onDataChange={handleDataChange} />
    </div>
  );
}
