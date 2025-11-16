"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  User,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { leaveTypeLabel, leaveTypeColor } from "@/lib/ui";
import { LeaveType } from "@prisma/client";

interface LeaveEvent {
  id: number;
  employeeName: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface LeaveCalendarProps {
  leaves?: LeaveEvent[];
  isLoading?: boolean;
  showTeamLeaves?: boolean;
  onDateClick?: (date: Date) => void;
  className?: string;
}

const MONTHS = [
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Leave Calendar Component - Monthly view of approved and upcoming leaves
 *
 * Features:
 * - Color-coded by leave type
 * - Team leave visibility
 * - Month/year navigation
 * - Filter by leave type
 * - Responsive grid layout
 * - Click to view leave details
 */
export function LeaveCalendar({
  leaves = [],
  isLoading = false,
  showTeamLeaves = false,
  onDateClick,
  className,
}: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedLeaveType, setSelectedLeaveType] = React.useState<string>("all");
  const [view, setView] = React.useState<"my" | "team">("my");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigate month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter leaves by selected type
  const filteredLeaves = React.useMemo(() => {
    let filtered = leaves;

    if (selectedLeaveType !== "all") {
      filtered = filtered.filter(
        (leave) => leave.leaveType === selectedLeaveType
      );
    }

    return filtered;
  }, [leaves, selectedLeaveType]);

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date): LeaveEvent[] => {
    return filteredLeaves.filter((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const checkDate = new Date(date);

      // Reset time parts for accurate comparison
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(12, 0, 0, 0);

      return checkDate >= leaveStart && checkDate <= leaveEnd;
    });
  };

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (day: number): boolean => {
    return day >= 1 && day <= daysInMonth;
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const days: React.JSX.Element[] = [];
    let dayCounter = 1 - firstDayOfMonth;

    for (let week = 0; week < 6; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayNumber = dayCounter;
        const date = new Date(year, month, dayNumber);
        const leavesOnDay = getLeavesForDate(date);
        const isCurrentDay = isToday(dayNumber);
        const isInMonth = isCurrentMonth(dayNumber);

        days.push(
          <div
            key={`${week}-${dayOfWeek}`}
            className={cn(
              "min-h-[80px] sm:min-h-[100px] border border-border/50 p-1 sm:p-2",
              !isInMonth && "bg-muted/30 text-muted-foreground",
              isCurrentDay && "ring-2 ring-primary ring-inset",
              leavesOnDay.length > 0 && isInMonth && "cursor-pointer hover:bg-accent/50",
              "transition-colors"
            )}
            onClick={() => {
              if (isInMonth && leavesOnDay.length > 0 && onDateClick) {
                onDateClick(date);
              }
            }}
          >
            {/* Day number */}
            <div
              className={cn(
                "text-xs sm:text-sm font-medium mb-1",
                isCurrentDay && "text-primary font-bold"
              )}
            >
              {isInMonth ? dayNumber : ""}
            </div>

            {/* Leave indicators */}
            {isInMonth && leavesOnDay.length > 0 && (
              <div className="space-y-0.5">
                {leavesOnDay.slice(0, 2).map((leave, idx) => (
                  <div
                    key={`${leave.id}-${idx}`}
                    className={cn(
                      "text-[10px] sm:text-xs px-1 py-0.5 rounded truncate",
                      leaveTypeColor(leave.leaveType),
                      "text-white font-medium"
                    )}
                    title={`${leave.employeeName} - ${leaveTypeLabel[leave.leaveType]}`}
                  >
                    <span className="hidden sm:inline">
                      {leave.employeeName.split(" ")[0]}
                    </span>
                    <span className="sm:hidden">•</span>
                  </div>
                ))}
                {leavesOnDay.length > 2 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{leavesOnDay.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        );

        dayCounter++;
      }
    }

    return days;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-muted-foreground" />
            <CardTitle>Leave Calendar</CardTitle>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            {showTeamLeaves && (
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={view === "my" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("my")}
                  className="h-7 px-2"
                >
                  <User className="size-3 mr-1" />
                  My Leaves
                </Button>
                <Button
                  variant={view === "team" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("team")}
                  className="h-7 px-2"
                >
                  <Users className="size-3 mr-1" />
                  Team
                </Button>
              </div>
            )}

            {/* Leave Type Filter */}
            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="w-[140px] h-8">
                <Filter className="size-3 mr-1" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CASUAL">Casual Leave</SelectItem>
                <SelectItem value="EARNED">Earned Leave</SelectItem>
                <SelectItem value="MEDICAL">Medical Leave</SelectItem>
                <SelectItem value="MATERNITY">Maternity</SelectItem>
                <SelectItem value="PATERNITY">Paternity</SelectItem>
              </SelectContent>
            </Select>

            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 px-2"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3">
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 px-2"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Current Month/Year Display */}
        <div className="text-lg font-semibold mt-4">
          {MONTHS[month]} {year}
        </div>
      </CardHeader>

      <CardContent>
        {/* Calendar Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs sm:text-sm font-medium border-r last:border-r-0 border-border/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">{renderCalendarDays()}</div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Today</span>
          </div>
          {filteredLeaves.length > 0 && (
            <>
              {Array.from(new Set(filteredLeaves.map((l) => l.leaveType))).map(
                (type) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div
                      className={cn("size-3 rounded-full", leaveTypeColor(type))}
                    ></div>
                    <span className="text-muted-foreground">
                      {leaveTypeLabel[type]}
                    </span>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Empty State */}
        {filteredLeaves.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="size-12 mx-auto mb-2 opacity-50" />
            <p>No leaves scheduled for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Leave Calendar - Simplified version for dashboards
 */
export function CompactLeaveCalendar({
  leaves = [],
  isLoading = false,
  className,
}: Omit<LeaveCalendarProps, "showTeamLeaves" | "onDateClick">) {
  return (
    <LeaveCalendar
      leaves={leaves}
      isLoading={isLoading}
      showTeamLeaves={false}
      className={className}
    />
  );
}
