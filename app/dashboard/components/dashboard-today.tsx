"use client";

import { formatDate } from "@/lib/utils";

export function DashboardToday() {
  const today = new Date();
  const formatted = formatDate(today);
  const weekday = today.toLocaleDateString("en-GB", { weekday: "long" });
  return <p className="text-sm text-muted-foreground">Today: {weekday}, {formatted}</p>;
}
