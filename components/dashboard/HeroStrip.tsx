"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Eye, TrendingUp, Calendar } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type HeroStripProps = {
  name: string;
};

export function HeroStrip({ name }: HeroStripProps) {
  const { data: leavesData } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });
  
  const { data: holidaysData } = useSWR("/api/holidays?upcoming=true", fetcher, {
    revalidateOnFocus: false,
  });

  const { message, pendingCount, approvedUpcoming, nextHoliday } = useMemo(() => {
    if (!leavesData?.items) {
      return {
        message: `All clear, ${name}. No pending requests.`,
        pendingCount: 0,
        approvedUpcoming: null,
        nextHoliday: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = leavesData.items.filter(
      (item: { status: string }) => item.status === "SUBMITTED" || item.status === "PENDING"
    );
    const approvedUpcoming = leavesData.items.find((item: { status: string; startDate: string }) => {
      if (item.status !== "APPROVED") return false;
      const startDate = new Date(item.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    // Find next holiday
    const nextHoliday = holidaysData?.items?.[0] || null;

    let msg = "";
    if (approvedUpcoming) {
      const startDate = new Date(approvedUpcoming.startDate);
      msg = `Your ${approvedUpcoming.type.toLowerCase()} leave starts on ${startDate.toLocaleDateString()}.`;
    } else if (pending.length > 0) {
      msg = `You have ${pending.length} request(s) awaiting approval.`;
    } else {
      msg = `All clear, ${name}. No pending requests.`;
    }

    return {
      message: msg,
      pendingCount: pending.length,
      approvedUpcoming: approvedUpcoming ? {
        type: approvedUpcoming.type,
        dates: `${new Date(approvedUpcoming.startDate).toLocaleDateString()} → ${new Date(approvedUpcoming.endDate).toLocaleDateString()}`,
      } : null,
      nextHoliday: nextHoliday ? {
        name: nextHoliday.name,
        date: nextHoliday.date,
      } : null,
    };
  }, [leavesData, holidaysData, name]);

  return (
    <div className="flex items-center justify-between gap-4 glass-base rounded-2xl p-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">{message}</p>
        {nextHoliday && (
          <p className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300 mt-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="leading-relaxed">
              Next holiday: <span className="font-medium text-gray-700 dark:text-gray-200">{nextHoliday.name}</span> on {new Date(nextHoliday.date).toLocaleDateString()}
            </span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full px-4 py-2 font-medium"
        >
          <Link href="/leaves/apply">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Apply Leave
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full px-4 py-2 font-medium"
        >
          <Link href="/leaves">
            <Eye className="h-4 w-4 mr-2" />
            Track Status
          </Link>
        </Button>
      </div>
    </div>
  );
}

