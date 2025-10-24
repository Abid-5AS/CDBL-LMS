"use client";

export function DashboardToday() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return <p className="text-sm text-muted-foreground">Today: {today}</p>;
}
