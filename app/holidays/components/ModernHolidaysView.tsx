"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { Role } from "@prisma/client";
import { RoleBasedDashboard } from "../../../components/dashboards/shared/RoleBasedDashboard";
import { HolidaysKPISection } from "./HolidaysKPISection";
import { HolidaysMainContent } from "./HolidaysMainContent";
import { useHolidaysData } from "../hooks/useHolidaysData";
import { PDFExportButton } from "./PDFExportButton";
import { formatDate } from "@/lib/utils";
import { Badge, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui";
import { EmployeePageHero } from "@/components/employee/PageHero";
import { HolidayAdminPanel } from "./HolidayAdminPanel";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

type ModernHolidaysViewProps = {
  role: Role;
};

export function ModernHolidaysView({ role }: ModernHolidaysViewProps) {
  const {
    holidays,
    filteredHolidays,
    holidaysStats,
    filters,
    updateFilters,
    clearFilters,
    isLoading,
    error,
    refresh,
  } = useHolidaysData();
  const isAdminRole = role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO";

  const headerActions = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <PDFExportButton variant="outline" size="sm" className="gap-2 rounded-xl" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            Downloads the full holiday list for the selected filters, including mandatory/optional flags.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const viewingYearDescription =
    filters.yearFilter === "all" ? "all scheduled years" : filters.yearFilter;

  if (isLoading) {
    return (
      <RoleBasedDashboard
        role={role}
        title="Company Holidays"
        description="Loading holiday calendar..."
        actions={headerActions}
        animate={true}
        backgroundVariant="transparent"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
      </RoleBasedDashboard>
    );
  }

  if (error) {
    return (
      <RoleBasedDashboard
        role={role}
        title="Company Holidays"
        description="Failed to load holiday calendar"
        actions={headerActions}
        animate={true}
        backgroundVariant="transparent"
      >
        <div className="p-12 text-center">
          <p className="text-red-600 dark:text-red-400">
            Unable to load holidays. Please try again later.
          </p>
        </div>
      </RoleBasedDashboard>
    );
  }

  const today = new Date();
  const nextHolidayDate = holidaysStats.nextHoliday
    ? new Date(holidaysStats.nextHoliday.date)
    : null;
  const daysUntilNext =
    nextHolidayDate && nextHolidayDate > today
      ? Math.ceil(
          (nextHolidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const heroStats = [
    {
      label: "Total Holidays",
      value: holidaysStats.total,
      helper: `${holidaysStats.availableYears[0] || new Date().getFullYear()}`,
    },
    {
      label: "Next Holiday",
      value: holidaysStats.nextHoliday?.name ?? "None scheduled",
      helper: holidaysStats.nextHoliday
        ? formatDate(holidaysStats.nextHoliday.date)
        : "Stay tuned for updates",
    },
    {
      label: "Days Until Next",
      value: daysUntilNext !== null ? `${daysUntilNext} days` : "—",
      helper:
        daysUntilNext !== null ? "Plan coverage now" : "All observances passed",
      state: daysUntilNext !== null && daysUntilNext <= 7 ? "warning" : "default",
    },
  ];

  return (
    <RoleBasedDashboard
      role={role}
      title="Company Holidays"
      description={`View and plan around ${holidaysStats.total} company holidays for ${viewingYearDescription}`}
      animate={true}
      backgroundVariant="transparent"
    >
      <EmployeePageHero
        eyebrow="Company Calendar"
        title="Holidays & Closures"
        description={`Stay ahead of ${holidaysStats.total} holidays scheduled for ${viewingYearDescription}.`}
        stats={heroStats}
        actions={headerActions}
        className="mb-6"
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* KPI Section */}
        {isAdminRole && (
          <HolidayAdminPanel
            onCreated={async () => {
              await refresh?.();
            }}
          />
        )}
        <HolidaysKPISection stats={holidaysStats} />

        {/* Simple highlight card for upcoming holiday */}
        {holidaysStats.nextHoliday && (
          <section className="neo-card p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="px-4 py-3 rounded-xl bg-muted text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                {formatDate(holidaysStats.nextHoliday.date)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Holiday</p>
                <p className="text-lg font-semibold text-foreground">
                  {holidaysStats.nextHoliday.name}
                </p>
                <div className="mt-1 flex gap-2">
                  {holidaysStats.nextHoliday.isOptional ? (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Mandatory
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <HolidaysMainContent
          holidays={filteredHolidays}
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          availableYears={holidaysStats.availableYears}
        />
      </motion.div>
    </RoleBasedDashboard>
  );
}
