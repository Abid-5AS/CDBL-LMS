"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MiniCalendar() {
  const { data: leavesData, isLoading: leavesLoading } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

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
  const approvedLeaves = leaves.filter((leave: any) => leave.status === "APPROVED");
  
  // Create a map of dates with leaves
  const dateLeaveMap = new Map();
  approvedLeaves.forEach((leave: any) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!dateLeaveMap.has(dateStr)) {
        dateLeaveMap.set(dateStr, []);
      }
      dateLeaveMap.get(dateStr).push(leave.type);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentDate = nextDate;
    }
  });

  const todayStr = today.toISOString().split('T')[0];

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

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

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
            <Calendar className="h-5 w-5 text-blue-600" />
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current date display */}
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Today</div>
          <div className="text-lg font-bold text-blue-900">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-xs font-medium text-center text-slate-600 py-1">
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

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasLeave = dateLeaveMap.has(dateStr);
              const isToday = dateStr === todayStr;
              const leaveTypes = dateLeaveMap.get(dateStr) || [];

              return (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-start p-1 rounded-md ${
                    isToday
                      ? "bg-blue-600 text-white font-bold"
                      : hasLeave
                      ? "bg-emerald-50 border border-emerald-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-xs ${isToday ? "text-white" : "text-slate-900"}`}>
                    {day}
                  </span>
                  {hasLeave && !isToday && (
                    <div className="w-full h-1 bg-emerald-600 rounded-full mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {approvedLeaves.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600 mb-2">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span className="text-xs text-slate-600">Approved Leave</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span className="text-xs text-slate-600">Today</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

