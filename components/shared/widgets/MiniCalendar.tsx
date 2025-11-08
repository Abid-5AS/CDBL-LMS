"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
} from "@/components/ui";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLeaveData } from "@/components/providers/LeaveDataProvider";

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
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-data-info" />
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current date display */}
        <div className="mb-4 p-3 rounded-lg bg-data-info border border-data-info">
          <div className="text-xs font-medium text-data-info uppercase tracking-wide mb-1">
            Today
          </div>
          <div className="text-lg font-bold text-data-info">
            {new Date().toLocaleDateString("en-GB", { weekday: "long" })}{" "}
            {formatDate(new Date())}
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-center text-text-secondary py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="aspect-square" />;
              }

              const dateStr = `${currentYear}-${String(
                currentMonth + 1
              ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasLeave = dateLeaveMap.has(dateStr);
              const isToday = dateStr === todayStr;
              const leaveTypes = dateLeaveMap.get(dateStr) || [];

              return (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-start p-1 rounded-md ${
                    isToday
                      ? "bg-data-info text-text-inverted font-bold"
                      : hasLeave
                      ? "bg-data-success border border-data-success"
                      : "hover:bg-bg-secondary"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isToday ? "text-text-inverted" : "text-text-secondary"
                    }`}
                  >
                    {day}
                  </span>
                  {hasLeave && !isToday && (
                    <div className="w-full h-1 bg-data-success rounded-full mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {approvedLeaves.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-strong">
            <div className="text-xs text-text-secondary mb-2">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-data-success border border-data-success" />
                <span className="text-xs text-text-secondary">Approved Leave</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-data-info" />
                <span className="text-xs text-text-secondary">Today</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
