"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuickActions, type QuickAction } from "@/components/shared/QuickActions";
import { Calendar, UserCheck, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { apiFetcher } from "@/lib/apiClient";
import useSWR from "swr";
import Papa from "papaparse";

export function DeptHeadQuickActions() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch team data for export
  const { data: teamData } = useSWR<{
    items: any[];
    counts: {
      pending: number;
      forwarded: number;
      returned: number;
      cancelled: number;
    };
  }>(
    "/api/manager/pending",
    apiFetcher
  );

  const handleTeamCalendar = () => {
    // Navigate to leaves page with calendar view (if exists)
    // For now, navigate to leaves page which shows team leaves
    router.push("/leaves?view=calendar");
    toast.info("Team calendar view");
  };

  const handleActingApprover = () => {
    // This would typically open a modal
    // For now, show a toast message
    toast.info("Acting approver assignment coming soon", {
      description: "This feature allows you to delegate approval authority temporarily",
    });
  };

  const handleExportReport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Fetch full data for export
      const data = teamData?.items || [];

      if (data.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Prepare data for CSV
      const exportData = data.map((item: any) => ({
        "Employee Name": item.requester?.name || "N/A",
        "Email": item.requester?.email || "N/A",
        "Leave Type": item.type || "N/A",
        "Start Date": new Date(item.startDate).toLocaleDateString(),
        "End Date": new Date(item.endDate).toLocaleDateString(),
        "Working Days": item.workingDays || 0,
        "Status": item.status || "N/A",
        "Reason": item.reason || "N/A",
        "Submitted": new Date(item.createdAt).toLocaleDateString(),
      }));

      // Generate CSV
      const csv = Papa.unparse(exportData);

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = `team-leave-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const actions: QuickAction[] = [
    {
      label: "Team Calendar",
      icon: Calendar,
      onClick: handleTeamCalendar,
      tooltip: "View team leave calendar",
    },
    {
      label: "Acting Approver",
      icon: UserCheck,
      onClick: handleActingApprover,
      tooltip: "Assign temporary approval delegation",
    },
    {
      label: "Export Report",
      icon: isExporting ? Download : FileSpreadsheet,
      onClick: handleExportReport,
      tooltip: isExporting ? "Exporting..." : "Export team leave report as CSV",
    },
  ];

  return (
    <QuickActions
      actions={actions}
      variant="card"
      title="Quick Actions"
    />
  );
}

