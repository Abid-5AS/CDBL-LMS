"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { SearchInput } from "@/components/filters/SearchInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";

type Holiday = {
  id: number;
  name: string;
  date: string;
  isOptional: boolean;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HolidaysList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [showPast, setShowPast] = useState(false);

  const { data, isLoading, error } = useSWR<{ items: Holiday[] }>("/api/holidays", fetcher, {
    revalidateOnFocus: false,
  });

  const allHolidays: Holiday[] = Array.isArray(data?.items) ? data.items : [];

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allHolidays.forEach((holiday) => {
      const year = new Date(holiday.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allHolidays]);

  const filteredHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = allHolidays;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (holiday) =>
          holiday.name.toLowerCase().includes(query) ||
          formatDate(holiday.date).toLowerCase().includes(query)
      );
    }

    // Year filter
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      filtered = filtered.filter((holiday) => new Date(holiday.date).getFullYear() === year);
    }

    // Past/Upcoming filter
    if (!showPast) {
      filtered = filtered.filter((holiday) => new Date(holiday.date) >= today);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allHolidays, searchQuery, yearFilter, showPast]);

  const clearFilters = () => {
    setSearchQuery("");
    setYearFilter(new Date().getFullYear().toString());
    setShowPast(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading holidays...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          Failed to load holidays
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by holiday name..."
          />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={showPast ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPast(!showPast)}
          >
            {showPast ? "Upcoming Only" : "Show Past"}
          </Button>
          {(searchQuery || yearFilter !== new Date().getFullYear().toString() || showPast) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredHolidays.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showPast ? "All Holidays" : "Upcoming Holidays"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {allHolidays.length === 0
                ? "No holidays scheduled"
                : "No holidays match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showPast ? "All Holidays" : "Upcoming Holidays"}
              {filteredHolidays.length !== allHolidays.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredHolidays.length} of {allHolidays.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredHolidays.map((holiday) => {
                const isPast = new Date(holiday.date) < new Date();
                return (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{holiday.name}</p>
                        {holiday.isOptional && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Optional
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600">
                            Past
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(holiday.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

