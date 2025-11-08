"use client";

import useSWR from "swr";
import { Card, CardContent, Skeleton } from "@/components/ui";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NextHoliday() {
  const { data, error, isLoading } = useSWR("/api/holidays", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const holidays = Array.isArray(data?.items) ? data.items : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextHoliday = holidays.find((holiday: { date: string }) => {
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  });

  if (!nextHoliday) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-data-info dark:bg-data-info/30">
              <Calendar className="h-4 w-4 text-data-info dark:text-data-info" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-0.5">
                Next Holiday
              </div>
              <div className="text-sm font-medium text-foreground">
                No upcoming holidays
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const holidayDate = new Date(nextHoliday.date);
  const daysUntil = Math.ceil(
    (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-data-info dark:bg-data-info/30">
            <Calendar className="h-4 w-4 text-data-info dark:text-data-info" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5">
              Next Holiday
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {nextHoliday.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDate(nextHoliday.date)}
              {daysUntil >= 0 && (
                <span className="ml-2 text-data-info dark:text-data-info font-medium">
                  {daysUntil === 0
                    ? "Today"
                    : daysUntil === 1
                    ? "Tomorrow"
                    : `in ${daysUntil} days`}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
