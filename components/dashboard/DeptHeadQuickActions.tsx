"use client";

import { QuickActions, type QuickAction } from "@/components/shared/QuickActions";
import { Calendar, UserCheck, FileSpreadsheet } from "lucide-react";

export function DeptHeadQuickActions() {
  const actions: QuickAction[] = [
    {
      label: "Team Calendar",
      icon: Calendar,
      onClick: () => {
        // TODO: Navigate to team calendar view
        console.log("View Team Calendar");
      },
      tooltip: "View team calendar",
    },
    {
      label: "Acting Approver",
      icon: UserCheck,
      onClick: () => {
        // TODO: Open acting approver assignment modal
        console.log("Assign Acting Approver");
      },
      tooltip: "Assign acting approver",
    },
    {
      label: "Export Report",
      icon: FileSpreadsheet,
      onClick: () => {
        // TODO: Export monthly report
        console.log("Export Monthly Report");
      },
      tooltip: "Export monthly report",
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

