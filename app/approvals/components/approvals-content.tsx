"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalTable, HRAdminStats } from "@/components/hr-admin";
import { HRApprovalItem } from "@/components/hr-admin";

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
      router.push(`/leaves/${item.id}`);
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
