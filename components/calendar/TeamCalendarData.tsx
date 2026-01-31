// Server Component for data fetching
import { CalendarEvent } from "@/components/calendar/CalendarGrid";

interface TeamCalendarDataProps {
  month: number;
  year: number;
}

export async function getTeamCalendarData(month: number, year: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/calendar/leaves?month=${month}&year=${year}&view=team`,
      {
        cache: 'no-store', // Real-time calendar data
        next: { tags: [`team-calendar-${year}-${month}`] }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch team calendar data");
    }

    const data = await response.json();

    const transformedEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
      id: event.id,
      title: event.leaveType,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      type: event.leaveType,
      status: event.status,
      employeeName: event.employeeName,
      isHoliday: false
    }));

    return transformedEvents;
  } catch (error) {
    console.error("Failed to fetch team calendar data:", error);
    return [];
  }
}

export async function TeamCalendarData({ month, year }: TeamCalendarDataProps) {
  const events = await getTeamCalendarData(month, year);

  // This is just a data component - the actual UI is in the client component
  return null;
}
