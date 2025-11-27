"use client";

import { ModernHolidaysView } from "@/app/holidays/components/ModernHolidaysView";

interface HolidayCalendarViewProps {
  role?: string;
}

export function HolidayCalendarView({ role = "EMPLOYEE" }: HolidayCalendarViewProps) {
  return <ModernHolidaysView role={role as any} />;
}
