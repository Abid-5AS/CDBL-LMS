"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { Role } from "@prisma/client";
import { RoleBasedDashboard } from "../../../components/dashboards/shared/RoleBasedDashboard";
import { HolidaysKPISection } from "./HolidaysKPISection";
import { HolidaysMainContent } from "./HolidaysMainContent";
import { useHolidaysData } from "../hooks/useHolidaysData";
import { PDFExportButton } from "./PDFExportButton";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui";
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
          <PDFExportButton
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            holidays={filteredHolidays}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            Export holidays as PDF or iCalendar format for your calendar app.
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
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
      description={`View and manage ${holidaysStats.total} company holidays for ${viewingYearDescription}`}
      animate={true}
      backgroundVariant="transparent"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Admin Panel */}
        {isAdminRole && (
          <HolidayAdminPanel
            onCreated={async () => {
              await refresh?.();
            }}
          />
        )}

        {/* KPI Section with integrated next holiday */}
        <HolidaysKPISection stats={holidaysStats} />

        {/* Main Content */}
        <HolidaysMainContent
          holidays={filteredHolidays}
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          availableYears={holidaysStats.availableYears}
          role={role}
          onHolidayUpdated={() => refresh?.()}
        />
      </motion.div>
    </RoleBasedDashboard>
  );
}
