"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, Plus, AlertCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LeaveItem = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};

/**
 * [REPLACES HeroStrip]
 * A clean welcome banner with a primary action and holiday info.
 * Shows pending requests and makes the card clickable if there are pending items.
 */
export function WelcomeHero({ username }: { username: string }) {
  const router = useRouter();
  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays?upcoming=true",
    fetcher
  );

  const { data: leavesData, isLoading: isLoadingLeaves } = useSWR<{ items: LeaveItem[] }>(
    "/api/leaves?mine=1",
    fetcher
  );

  const { nextHoliday, pendingCount, firstPendingLeave, approvedUpcoming, message } = useMemo(() => {
    const nextHoliday = holidaysData?.items?.[0] || null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = leavesData?.items?.filter(
      (item: LeaveItem) => item.status === "SUBMITTED" || item.status === "PENDING"
    ) || [];
    
    const firstPending = pending.length > 0 ? pending[0] : null;
    
    const approvedUpcoming = leavesData?.items?.find((item: LeaveItem) => {
      if (item.status !== "APPROVED") return false;
      const startDate = new Date(item.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    let msg = "";
    if (approvedUpcoming) {
      const startDate = new Date(approvedUpcoming.startDate);
      msg = `Your ${approvedUpcoming.type.toLowerCase()} leave starts on ${formatDate(startDate)}.`;
    } else if (pending.length > 0) {
      msg = `You have ${pending.length} request(s) awaiting approval.`;
    } else {
      msg = `All clear, ${username}. No pending requests.`;
    }

    return {
      nextHoliday,
      pendingCount: pending.length,
      firstPendingLeave: firstPending,
      approvedUpcoming,
      message: msg,
    };
  }, [holidaysData, leavesData, username]);

  const hasPending = pendingCount > 0;
  const hasApprovedUpcoming = approvedUpcoming !== null;

  const handleClick = () => {
    if (firstPendingLeave) {
      router.push(`/leaves?status=pending&highlight=${firstPendingLeave.id}`);
    } else if (hasPending) {
      router.push("/leaves?status=pending");
    }
  };

  return (
    <Card
      className={cn(
        "solid-card animate-fade-in-up",
        hasPending && "cursor-pointer transition-all hover:scale-[1.01]"
      )}
      onClick={hasPending ? handleClick : undefined}
      role={hasPending ? "button" : undefined}
      tabIndex={hasPending ? 0 : undefined}
      aria-label={hasPending ? "View pending leave request details" : undefined}
      onKeyDown={
        hasPending
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border flex-shrink-0",
                hasPending
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                  : hasApprovedUpcoming
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              )}
            >
              {hasPending ? (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              ) : hasApprovedUpcoming ? (
                <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              ) : (
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                As-salamu alaykum, {username}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {message}
              </p>
              {firstPendingLeave && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">
                    {firstPendingLeave.type.toLowerCase()} Leave
                  </span>
                  {": "}
                  {formatDate(firstPendingLeave.startDate)} → {formatDate(firstPendingLeave.endDate)}
                </div>
              )}
            </div>
          </div>

          {isLoadingHolidays ? (
            <Skeleton className="h-4 w-48 mt-4" />
          ) : nextHoliday ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <CalendarCheck className="size-4 text-blue-600 dark:text-blue-400" />
              <span>
                Next Holiday:{" "}
                <strong className="text-gray-700 dark:text-gray-300">{nextHoliday.name}</strong> on{" "}
                {formatDate(nextHoliday.date)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <Calendar className="size-4 text-gray-500 dark:text-gray-400" />
              <span>No upcoming holidays scheduled.</span>
            </div>
          )}
        </div>

        {/* Placeholder for illustration */}
        <div className="hidden lg:block size-24 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <svg
            className="size-full text-blue-600 dark:text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            <path d="m10.5 17.5 1.5-1.5-1.5-1.5" />
          </svg>
        </div>

        <Button
          size="lg"
          className="w-full md:w-auto animate-fade-in-up"
          onClick={() => router.push("/leaves/apply")}
        >
          <Plus className="-ml-1 size-5" />
          Apply for Leave
        </Button>
      </CardContent>
    </Card>
  );
}

