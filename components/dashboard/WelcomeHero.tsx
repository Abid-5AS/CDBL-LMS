"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * [REPLACES HeroStrip]
 * A clean welcome banner with a primary action and holiday info.
 */
export function WelcomeHero({ username }: { username: string }) {
  const router = useRouter();
  const { data: holidaysData, isLoading } = useSWR(
    "/api/holidays?upcoming=true",
    fetcher
  );

  const nextHoliday = useMemo(() => {
    return holidaysData?.items?.[0] || null;
  }, [holidaysData]);

  return (
    <Card className="solid-card animate-fade-in-up">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            As-salamu alaykum, {username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to your dashboard. You can apply for leave or check your
            request status here.
          </p>

          {isLoading ? (
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

