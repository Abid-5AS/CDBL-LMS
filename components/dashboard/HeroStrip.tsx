"use client";

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";
import { getIcon, iconSizes } from "@/lib/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type HeroStripProps = {
  name: string;
};

const CalendarIcon = getIcon("CalendarDays");
const AlertIcon = getIcon("AlertCircle");
const ApplyIcon = getIcon("CalendarPlus");

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
      msg = `Your ${approvedUpcoming.type.toLowerCase()} leave starts on ${formatDate(startDate)}.`;
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
        dates: `${formatDate(approvedUpcoming.startDate)} → ${formatDate(approvedUpcoming.endDate)}`,
      } : null,
      nextHoliday: nextHoliday ? {
        name: nextHoliday.name,
        date: nextHoliday.date,
      } : null,
    };
  }, [leavesData, holidaysData, name]);

  return (
    <div className="glass-base border border-white/30 dark:border-white/10 rounded-2xl p-4 transition-transform duration-300 will-change-transform">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {pendingCount > 0 ? (
            <Link 
              href="/leaves?status=pending"
              className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-start gap-2 underline-offset-4 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              <AlertIcon className="mt-0.5 size-4 text-amber-500 dark:text-amber-300 flex-shrink-0" strokeWidth={2} />
              <span className="line-clamp-2">{message}</span>
            </Link>
          ) : (
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-start gap-2">
              <ApplyIcon className="mt-0.5 size-4 text-emerald-500 dark:text-emerald-300 flex-shrink-0" strokeWidth={2} />
              <span className="line-clamp-2">{message}</span>
            </p>
          )}
          {nextHoliday && (
            <p className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <CalendarIcon
                className="flex-shrink-0 text-sky-600 dark:text-sky-300"
                size={iconSizes.sm}
                strokeWidth={2.4}
              />
              <span className="leading-relaxed">
                Next holiday: <span className="font-medium text-gray-700 dark:text-gray-200">{nextHoliday.name}</span> on {formatDate(nextHoliday.date)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
