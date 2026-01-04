"use client";

import * as React from "react";
import { Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle,
  RotateCcw,
  XCircle,
  UserCheck,
  RefreshCw,
  Info,
  Users,
  Calendar as CalendarIcon,
  ArrowRight
} from "lucide-react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/enums";
import { useUser } from "@/lib"; // Correct client-side hook

// Shared UI
import { RoleBasedDashboard, RoleKPICard } from "../shared/RoleBasedDashboard";
import {
  ResponsiveDashboardGrid,
  DashboardSection,
} from "../shared/ResponsiveDashboardGrid";
import { KPIGridSkeleton } from "@/components/shared/skeletons";

// Feature Components
import { DashboardPendingList } from "./components/DashboardPendingList";
import { TeamCoverageCalendar } from "./components/TeamCoverageCalendar"; // Reusing existing


// Hooks
import { useApiQueryWithParams } from "@/lib/apiClient";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function CorporateManagerDashboard() {
  const router = useRouter();
  const user = useUser();
  const username = user?.name || "Dept. Head";

  // -- Data Fetching --
  // 1. Pending Counts & List
  const {
    data: pendingData,
    isLoading: isPendingLoading,
    mutate: mutatePending,
  } = useApiQueryWithParams<{
    rows: any[];
    counts: {
      pending: number;
      forwarded: number;
      returned: number;
      cancelled: number;
    };
  }>("/api/manager/pending", {
    status: "PENDING",
    page: 1,
    size: 10 // Fetch top 10 for widgets
  });

  // 2. Team Coverage (Current Month)
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const { data: coverageData, isLoading: isCoverageLoading } = useApiQueryWithParams<{
    days: Record<string, { count: number }>;
  }>("/api/team/on-leave", {
    scope: "department",
    startDate: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).toLocaleDateString("en-CA"),
    endDate: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).toLocaleDateString("en-CA"),
  });

  // Derived Metrics
  const counts = pendingData?.counts || { pending: 0, forwarded: 0, returned: 0, cancelled: 0 };

  // Availability Logic (Simplified)
  const availabilityMetric = useMemo(() => {
    if (!coverageData?.days) return { value: "--", subtitle: "Calculating..." };
    const days = Object.values(coverageData.days);
    if (days.length === 0) return { value: "100%", subtitle: "No absences recorded" };
    const totalAbsences = days.reduce((acc, day) => acc + day.count, 0);
    const avgAbsence = (totalAbsences / days.length).toFixed(1);
    return {
      value: avgAbsence,
      subtitle: "Avg. staff on leave/day",
    };
  }, [coverageData]);

  const prevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const refreshAll = () => {
    mutatePending();
    // mutateCoverage(); // if accessible
  };

  return (
    <TooltipProvider>
      <RoleBasedDashboard
        role={Role.DEPT_HEAD}
        animate={true}
        backgroundVariant="transparent"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 lg:space-y-8"
        >
          {/* -- Header Section -- */}
          <motion.section variants={itemVariants}>
            <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Overview
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    {new Date().toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long' })}
                    <span className="h-1 w-1 rounded-full bg-border" />
                    Managing {user?.department || "Department"} Team
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshAll}
                    className="h-9 gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push("/approvals")}
                    className="h-9 gap-2 bg-[var(--dashboard-accent)] hover:bg-[var(--dashboard-accent)]/90 text-white border-0"
                  >
                    Go to Approvals
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* -- KPI Grid -- */}
          <DashboardSection
            title="Department Pulse"
            description="Real-time metrics for your team"
            animate={true}
            loadingFallback={<KPIGridSkeleton />}
          >
            <ResponsiveDashboardGrid
              columns="1:2:4:4"
              gap="md"
              animate={true}
              staggerChildren={0.1}
            >
              {/* 1. Pending (Actionable) */}
              <RoleKPICard
                title="Pending Review"
                value={counts.pending}
                subtitle="Requests awaiting action"
                icon={ClipboardList}
                role={Role.DEPT_HEAD}
                onClick={() => router.push("/approvals")}
                className={counts.pending > 0 ? "ring-2 ring-[var(--dashboard-accent)]/20" : ""}
              />

              {/* 2. Forwarded (Progress) */}
              <RoleKPICard
                title="Forwarded to HR"
                value={counts.forwarded}
                subtitle="Approved & Processing"
                icon={CheckCircle}
                role={Role.DEPT_HEAD}
              />

              {/* 3. Returned (Issues) */}
              <RoleKPICard
                title="Returned"
                value={counts.returned}
                subtitle="Sent back for updates"
                icon={RotateCcw}
                role={Role.DEPT_HEAD}
              />

              {/* 4. Team Health */}
              <RoleKPICard
                title="Absence Rate"
                value={availabilityMetric.value}
                subtitle={availabilityMetric.subtitle}
                icon={UserCheck}
                role={Role.DEPT_HEAD}
                tooltip="Average number of staff members on leave per day this month."
              />
            </ResponsiveDashboardGrid>
          </DashboardSection>

          {/* -- Main Content Split -- */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* Left: Priority Queue (8 cols) */}
            <div className="xl:col-span-8 space-y-6">
              <DashboardSection
                title="Priority Queue"
                description="Recent requests requiring your attention"
                isLoading={isPendingLoading}
              >
                <motion.div variants={itemVariants} className="h-[500px]">
                  <DashboardPendingList
                    requests={pendingData?.rows || []}
                    isLoading={isPendingLoading}
                    totalPending={counts.pending}
                  />
                </motion.div>
              </DashboardSection>
            </div>

            {/* Right: Team Context (4 cols) */}
            <div className="xl:col-span-4 space-y-6 sticky top-6">
              <DashboardSection
                title="Team Coverage"
                description="Member availability this month"
              >
                <motion.div variants={itemVariants}>
                  <div className="rounded-[20px] border border-border/60 shadow-sm bg-card overflow-hidden">
                    <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
                      <TeamCoverageCalendar
                        currentDate={calendarDate}
                        onPrevMonth={prevMonth}
                        onNextMonth={nextMonth}
                        coverageData={coverageData}
                      />
                    </Suspense>
                  </div>
                </motion.div>
              </DashboardSection>


            </div>

          </div>

        </motion.div>
      </RoleBasedDashboard>
    </TooltipProvider>
  );
}
