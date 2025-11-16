"use client";

import useSWR from "swr";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Skeleton, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { apiFetcher } from "@/lib/apiClient";

interface Holiday {
  date: string;
  name: string;
}

interface HolidaysResponse {
  items: Holiday[];
}

export function NextHoliday() {
  const { data, error, isLoading } = useSWR<HolidaysResponse>(
    "/api/holidays?upcoming=true",
    apiFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-2xl" />;
  }

  const holidays = Array.isArray(data?.items) ? data.items : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextHoliday = holidays.find((holiday) => {
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  });

  const accent = "var(--color-data-info)";

  if (!nextHoliday || error) {
    return (
      <div
        className="neo-card flex flex-col gap-3 px-5 py-5"
        style={{
          "--holiday-accent": accent,
          "--holiday-accent-soft": `color-mix(in srgb, ${accent} 15%, transparent)`,
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-2xl border border-white/20 p-3 shadow-inner"
            style={{ background: "var(--holiday-accent-soft)" }}
          >
            <Calendar className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Upcoming
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              No upcoming holidays
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;re all caught up. Keep an eye on the holiday calendar for future plans.
        </p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/holidays">View Calendar</Link>
        </Button>
      </div>
    );
  }

  const holidayDate = new Date(nextHoliday.date);
  const daysUntil = Math.ceil(
    (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="neo-card flex flex-col gap-4 px-5 py-5"
      style={{
        "--holiday-accent": accent,
        "--holiday-accent-soft": `color-mix(in srgb, ${accent} 20%, transparent)`,
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-2xl border border-white/20 p-3 shadow-inner"
          style={{ background: "var(--holiday-accent-soft)" }}
        >
          <Calendar className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Next Holiday
          </p>
          <h3 className="text-xl font-semibold text-foreground">
            {nextHoliday.name}
          </h3>
        </div>
      </div>

      <div className="flex items-baseline gap-2 text-muted-foreground">
        <p className="text-base font-medium text-foreground">
          {formatDate(nextHoliday.date)}
        </p>
        <span className="text-sm font-semibold" style={{ color: accent }}>
          {daysUntil === 0
            ? "Today"
            : daysUntil === 1
            ? "Tomorrow"
            : `in ${daysUntil} days`}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Plan ahead and update your schedule.</span>
        <Button asChild variant="ghost" size="sm" className="gap-2 p-0">
          <Link href="/holidays">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
