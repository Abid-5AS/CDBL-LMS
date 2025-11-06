"use client";

import { QuickActions, type QuickAction } from "@/components/shared/QuickActions";
import { Users, FileText, Calendar, Activity } from "lucide-react";

export function HRQuickActions() {
  const actions: QuickAction[] = [
    {
      label: "Add Holiday",
      icon: Calendar,
      href: "/admin/holidays",
    },
    {
      label: "Manage Employees",
      icon: Users,
      href: "/employees",
    },
    {
      label: "Audit Logs",
      icon: Activity,
      href: "/admin/audit",
    },
    {
      label: "Review Policies",
      icon: FileText,
      href: "/policies",
    },
  ];

  return <QuickActions actions={actions} variant="dropdown" />;
}

