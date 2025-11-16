"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { leaveTypeLabel } from "@/lib/ui";
import { LeaveType } from "@prisma/client";
import Link from "next/link";

type CalendarEvent = {
  id: number;
  employeeName: string;
  employeeCode: string | null;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
  workingDays: number;
};

type LeaveCalendarViewProps = {
  currentUserRole: string;
};

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  EARNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CASUAL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  MEDICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  MATERNITY: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  PATERNITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  STUDY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  EXTRAWITHPAY: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  EXTRAWITHOUTPAY: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  SPECIAL_DISABILITY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  QUARANTINE: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  SPECIAL: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
};

export function LeaveCalendarView({ currentUserRole }: LeaveCalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [view, setView] = useState<"my" | "team" | "all">("team");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(currentUserRole);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentYear, view]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/calendar/leaves?month=${currentMonth}&year=${currentYear}&view=${view}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getEventsForDate = (date: number) => {
    const targetDate = new Date(currentYear, currentMonth, date);
    return events.filter((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    });
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] bg-muted/30 rounded-lg"></div>
      );
    }

    // Days of the month
    for (let date = 1; date <= daysInMonth; date++) {
      const dayEvents = getEventsForDate(date);
      const isToday =
        date === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push(
        <div
          key={date}
          className={`min-h-[120px] border rounded-lg p-2 ${
            isToday
              ? "bg-primary/10 border-primary"
              : "bg-card border-muted hover:border-muted-foreground/20"
          } transition-colors`}
        >
          <div className="text-sm font-semibold mb-1">
            {date}
            {isToday && (
              <Badge variant="default" className="ml-2 text-xs">
                Today
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/leaves/${event.id}`}
                className={`block text-xs p-1 rounded ${
                  LEAVE_TYPE_COLORS[event.leaveType]
                } hover:opacity-80 transition-opacity`}
              >
                <div className="font-medium truncate">{event.employeeName}</div>
                <div className="text-xs truncate">{leaveTypeLabel[event.leaveType]}</div>
              </Link>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground pl-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

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

  return (
    <Card className="rounded-2xl border-muted shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-bold">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Select value={view} onValueChange={(v) => setView(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my">My Leaves</SelectItem>
                <SelectItem value="team">Team Leaves</SelectItem>
                {isAdmin && <SelectItem value="all">All Leaves</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {Object.entries(LEAVE_TYPE_COLORS).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colorClass}`}></div>
              <span className="text-xs text-muted-foreground">
                {leaveTypeLabel[type as LeaveType]}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">{renderCalendarGrid()}</div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total events this month:
                </span>
                <Badge variant="secondary">{events.length}</Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
