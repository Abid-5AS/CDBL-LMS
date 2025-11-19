"use client";

import { Skeleton } from "@/components/ui";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLeaveData } from "@/components/providers";

export function MiniCalendar() {
  const { data: leavesData, isLoading: leavesLoading } = useLeaveData();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get approved leaves for this month
  const leaves = Array.isArray(leavesData?.items) ? leavesData.items : [];
  const approvedLeaves = leaves.filter(
    (leave: any) => leave.status === "APPROVED"
  );

  // Create a map of dates with leaves
  const dateLeaveMap = new Map();
  approvedLeaves.forEach((leave: any) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (!dateLeaveMap.has(dateStr)) {
        dateLeaveMap.set(dateStr, []);
      }
      dateLeaveMap.get(dateStr).push(leave.type);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentDate = nextDate;
    }
  });

  const todayStr = today.toISOString().split("T")[0];

  if (leavesLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar days
  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="neo-card space-y-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/20 p-3 shadow-inner">
            <Calendar className="h-5 w-5 text-data-info" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Calendar
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {formatDate(new Date())}
        </span>
      </div>

      <div className="rounded-2xl border border-data-info/20 bg-[color-mix(in_srgb,var(--color-data-info)10%,transparent)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-data-info">
          Today
        </p>
        <p className="text-lg font-semibold text-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long" })} · {formatDate(new Date())}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) return <div key={index} className="aspect-square" />;

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasLeave = dateLeaveMap.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={index}
                className={cn(
                  "aspect-square rounded-xl border border-white/5 p-1 text-center text-xs font-semibold",
                  hasLeave && !isToday && "bg-data-success/15 text-data-success",
                  isToday && "bg-data-info text-background",
                  !hasLeave && !isToday && "bg-[color-mix(in_srgb,var(--color-card)95%,transparent)]"
                )}
              >
                {day}
                {hasLeave && !isToday && <div className="mt-0.5 h-1 rounded-full bg-data-success" />}
              </div>
            );
          })}
        </div>
      </div>

      {approvedLeaves.length > 0 && (
        <div className="flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-data-success" /> Approved
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-data-info" /> Today
          </div>
        </div>
      )}
    </div>
  );
}
