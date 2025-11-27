"use client";

import * as React from "react";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Holiday {
  id: string;
  name: string;
  date: string | Date;
  type?: string;
}

interface UpcomingHolidaysPanelProps {
  holidays?: Holiday[];
  isLoading?: boolean;
}

export function UpcomingHolidaysPanel({ holidays = [], isLoading }: UpcomingHolidaysPanelProps) {
  // Sort holidays by date and take next 3
  const nextHolidays = React.useMemo(() => {
    if (!Array.isArray(holidays)) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return holidays
      .filter(h => new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [holidays]);

  if (isLoading) {
    return (
      <GlassCard variant="hover">
        <GlassCardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="hover">
      <GlassCardHeader className="pb-3">
        <GlassCardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Upcoming Holidays
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        {nextHolidays.length > 0 ? (
          <div className="space-y-4">
            {nextHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{holiday.name}</p>
                  <p className="text-xs text-muted-foreground">{holiday.type || "Public Holiday"}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                    {formatDate(holiday.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No upcoming holidays found.
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
