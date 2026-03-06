"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

export function AuditExportButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          const res = await fetch("/api/admin/audit/export?limit=5000");
          if (!res.ok) throw new Error("Failed to export");
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast.success("Audit logs exported!");
        } catch {
          toast.error("Failed to export audit logs");
        }
      }}
    >
      <FileDown className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
