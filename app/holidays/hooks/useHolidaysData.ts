import { useMemo, useState } from "react";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";

export type Holiday = {
  id: number;
  name: string;
  date: string;
  isOptional: boolean;
};

export type HolidayFilters = {
  searchQuery: string;
  yearFilter: string;
  showPast: boolean;
  showOptional: boolean;
  viewMode: "grid" | "list";
};

export type HolidaysStats = {
  total: number;
  upcoming: number;
  past: number;
  optional: number;
  mandatory: number;
  mandatoryUpcoming: number;
  nextHoliday: Holiday | null;
  availableYears: number[];
  holidaysByMonth: Record<number, Holiday[]>;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHolidaysData() {
  const [filters, setFilters] = useState<HolidayFilters>({
    searchQuery: "",
    yearFilter: new Date().getFullYear().toString(),
    showPast: false,
    showOptional: true,
    viewMode: "grid",
  });

  const { data, isLoading, error, mutate } = useSWR<{ items: Holiday[] }>(
    "/api/holidays",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const holidays: Holiday[] = Array.isArray(data?.items) ? data.items : [];

  // Calculate statistics
  const holidaysStats = useMemo<HolidaysStats>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = holidays.filter((h) => new Date(h.date) >= today);
    const past = holidays.filter((h) => new Date(h.date) < today);
    const optional = holidays.filter((h) => h.isOptional);
    const mandatory = holidays.filter((h) => !h.isOptional);
    const mandatoryUpcoming = upcoming.filter((h) => !h.isOptional).length;

    // Get next holiday
    const nextHoliday =
      upcoming.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0] || null;

    // Get available years
    const years = new Set<number>();
    holidays.forEach((holiday) => {
      const year = new Date(holiday.date).getFullYear();
      years.add(year);
    });
    const availableYears = Array.from(years).sort((a, b) => b - a);

    // Get holidays by month for current year
    const currentYear = new Date().getFullYear();
    const holidaysByMonth = holidays
      .filter((h) => new Date(h.date).getFullYear() === currentYear)
      .reduce((acc, holiday) => {
        const month = new Date(holiday.date).getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
      }, {} as Record<number, Holiday[]>);

    return {
      total: holidays.length,
      upcoming: upcoming.length,
      past: past.length,
      optional: optional.length,
      mandatory: mandatory.length,
      mandatoryUpcoming,
      nextHoliday,
      availableYears,
      holidaysByMonth,
    };
  }, [holidays]);

  // Filter holidays
  const filteredHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = holidays;

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (holiday) =>
          holiday.name.toLowerCase().includes(query) ||
          formatDate(holiday.date).toLowerCase().includes(query)
      );
    }

    // Year filter
    if (filters.yearFilter !== "all") {
      const year = parseInt(filters.yearFilter);
      filtered = filtered.filter(
        (holiday) => new Date(holiday.date).getFullYear() === year
      );
    }

    // Past/Upcoming filter
    if (!filters.showPast) {
      filtered = filtered.filter((holiday) => new Date(holiday.date) >= today);
    }

    // Optional filter
    if (!filters.showOptional) {
      filtered = filtered.filter((holiday) => !holiday.isOptional);
    }

    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [holidays, filters]);

  const updateFilters = (newFilters: Partial<HolidayFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      yearFilter: new Date().getFullYear().toString(),
      showPast: false,
      showOptional: true,
      viewMode: "grid",
    });
  };

  return {
    holidays,
    filteredHolidays,
    holidaysStats,
    filters,
    updateFilters,
    clearFilters,
    isLoading,
    error,
    refresh: mutate,
  };
}
