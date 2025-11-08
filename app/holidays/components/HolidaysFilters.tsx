"use client";

import { Search, Filter, X, Eye, EyeOff, Calendar } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import type { HolidayFilters } from "../hooks/useHolidaysData";

type HolidaysFiltersProps = {
  filters: HolidayFilters;
  onFiltersChange: (filters: Partial<HolidayFilters>) => void;
  onClearFilters: () => void;
  availableYears: number[];
  variant?: "card" | "inline";
};

export function HolidaysFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  availableYears,
  variant = "card",
}: HolidaysFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.yearFilter !== new Date().getFullYear().toString() ||
    filters.showPast ||
    !filters.showOptional;

  const content = (
    <div className="flex flex-col gap-4">
      {/* Search and Year Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search holidays..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.yearFilter}
          onValueChange={(value) => onFiltersChange({ yearFilter: value })}
        >
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
      </div>

      {/* Toggle Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filters.showPast ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ showPast: !filters.showPast })}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          {filters.showPast ? "All Holidays" : "Upcoming Only"}
        </Button>

        <Button
          variant={filters.showOptional ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onFiltersChange({ showOptional: !filters.showOptional })
          }
          className="gap-2"
        >
          {filters.showOptional ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          Optional Holidays
        </Button>

        {hasActiveFilters && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
            <Badge variant="secondary" className="text-xs">
              {
                [
                  filters.searchQuery && "Search",
                  filters.yearFilter !== new Date().getFullYear().toString() &&
                    "Year",
                  filters.showPast && "Past",
                  !filters.showOptional && "No Optional",
                ].filter(Boolean).length
              }{" "}
              active
            </Badge>
          </>
        )}
      </div>
    </div>
  );

  if (variant === "inline") {
    return content;
  }

  return (
    <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-xl">
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}
