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
import { Badge } from "@/components/ui";

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
  } = useHolidaysData();

  const headerActions = (
    <PDFExportButton variant="outline" size="sm" className="gap-2 rounded-xl" />
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

  return (
    <RoleBasedDashboard
      role={role}
      title="Company Holidays"
      description={`View and plan around ${holidaysStats.total} company holidays for ${viewingYearDescription}`}
      actions={headerActions}
      animate={true}
      backgroundVariant="transparent"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* KPI Section */}
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
