"use client";

import useSWR from "swr";
import type { Holiday } from "@/lib/date-utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHolidays() {
  const { data, error, isLoading } = useSWR("/api/holidays", fetcher);

  const holidays: Holiday[] = Array.isArray(data?.items)
    ? data.items.map((h: any) => ({
        date: new Date(h.date).toISOString().slice(0, 10),
        name: h.name,
      }))
    : [];

  return { holidays, isLoading, error };
}

