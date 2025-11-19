"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Activity,
  Plus,
  ClipboardList,
  BookOpen,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { leaveTypeLabel } from "@/lib/ui";
import { formatDate } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// Corporate components
import { BalanceCard } from "@/components/corporate/BalanceCard";
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography, GRID_CONFIGS } from "@/lib/ui/density-modes";
import { cn } from "@/lib/utils";

// Existing feature components (to be restyled)
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { TeamStatusSummary } from "./components/TeamStatusSummary";
import { UpcomingHolidaysPanel } from "./components/UpcomingHolidaysPanel";

// Hooks
import { useMounted } from "@/hooks/use-mounted";
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";

// Corporate Active Request Tracker (restyled)
import { CorporateActiveRequestTracker } from "./components/CorporateActiveRequestTracker";

type CorporateEmployeeDashboardProps = {
  username: string;
};

// Leave entitlements (these should come from API in production)
const LEAVE_ENTITLEMENTS = {
  CASUAL: 14,
  MEDICAL: 14, // Changed from SICK to MEDICAL to match LeaveType
  EARNED: 20,
};

/**
 * Corporate Employee Dashboard
 *
 * Design Philosophy: "Comfortable" density mode
 * - More whitespace (p-6 cards)
 * - Larger text (text-base)
 * - Focus on readability and high-level insights
 *
 * Features Preserved:
 * ✅ Balance overview (3 cards)
 * ✅ Active request tracking with approval chain
 * ✅ My Requests table with filters (ALL/PENDING/PAST)
 * ✅ Team status ("Who's out today")
 * ✅ Upcoming holidays
 * ✅ Quick actions (Apply Leave, My History)
 *
 * What Changed:
 * ❌ No Framer Motion animations
 * ❌ No gradients or glows
 * ✅ Solid white cards with slate borders
 * ✅ Corporate color palette (slate-900 primary)
 * ✅ Colored top borders for leave type identification
 */
export function CorporateEmployeeDashboard({
  username,
}: CorporateEmployeeDashboardProps) {
  const router = useRouter();
  const [activityFilter, setActivityFilter] = useState<"ALL" | "PENDING" | "PAST">("ALL");
  const mounted = useMounted();

  const density = "comfortable"; // Employee role uses comfortable density
  const densityClasses = getDensityClasses(density);
  const typography = getTypography(density);
  const gridConfig = GRID_CONFIGS.comfortable;

  // Data fetching (preserved from original)
  const { allRows: leaves, isLoading: isLoadingLeaves } = useLeaveRequests({
    enableSelection: false,
  });

  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays?upcoming=true",
    apiFetcher
  );

  // Process data using existing hook
  const dashboardData = useEmployeeDashboardData(leaves, balanceData);

  // Filter leaves for the activity list (preserved logic)
  const filteredLeaves = React.useMemo(() => {
    if (!leaves) return [];

    let result = [];
    switch (activityFilter) {
      case "PENDING":
        result = leaves.filter(l => ["PENDING", "SUBMITTED", "FORWARDED"].includes(l.status));
        break;
      case "PAST":
        result = leaves.filter(l => ["APPROVED", "REJECTED", "CANCELLED"].includes(l.status));
        break;
      default:
        result = leaves.slice(0, 10); // Show recent 10 for ALL
    }

    return result.map(leave => ({
      ...leave,
      typeLabel: leaveTypeLabel[leave.type] || leave.type,
      formattedDates: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`,
    }));
  }, [leaves, activityFilter]);

  // Calculate balance data for cards
  const casualBalance = dashboardData.balanceData?.CASUAL || 0;
  const medicalBalance = dashboardData.balanceData?.MEDICAL || 0;
  const earnedBalance = dashboardData.balanceData?.EARNED || 0;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Corporate Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn(typography.pageTitle, "mb-1 text-foreground")}>
              Welcome back, {username.split(" ")[0]}
            </h1>
            <p className={cn(typography.label, "!normal-case text-muted-foreground")}>
              Employee Dashboard
            </p>
          </div>

          {/* Header Actions - Corporate Style */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push("/leaves")}
              className="rounded-md"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              My History
            </Button>
            <Button
              onClick={() => router.push("/leaves/apply")}
              size="default"
              className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={densityClasses.section}>
        {/* Balance Overview Section */}
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BalanceCard
              type="CASUAL"
              available={casualBalance}
              used={LEAVE_ENTITLEMENTS.CASUAL - casualBalance}
              total={LEAVE_ENTITLEMENTS.CASUAL}
              density={density}
              onClick={() => router.push("/balance")}
            />
            <BalanceCard
              type="MEDICAL"
              available={medicalBalance}
              used={LEAVE_ENTITLEMENTS.MEDICAL - medicalBalance}
              total={LEAVE_ENTITLEMENTS.MEDICAL}
              density={density}
              onClick={() => router.push("/balance")}
            />
            <BalanceCard
              type="EARNED"
              available={earnedBalance}
              used={LEAVE_ENTITLEMENTS.EARNED - earnedBalance}
              total={LEAVE_ENTITLEMENTS.EARNED}
              density={density}
              onClick={() => router.push("/balance")}
            />
          </div>
        </section>

        {/* Active Request Tracker */}
        <CorporateActiveRequestTracker
          leaves={leaves || []}
          isLoading={isLoadingLeaves}
          density={density}
        />

        {/* Main Content Grid: 2-Column Layout */}
        <div className={gridConfig.employeeDashboard}>
          {/* Left Column: Recent Activity (2/3 width) */}
          <div className={cn(gridConfig.employeeMain, "space-y-4")}>
            <div className="flex items-center justify-between">
              <h3 className={cn(typography.sectionTitle, "flex items-center gap-2 text-foreground")}>
                <Activity className="h-5 w-5 text-muted-foreground" />
                My Requests
              </h3>

              {/* Corporate Filter Tabs */}
              <Tabs
                value={activityFilter}
                onValueChange={(v) => setActivityFilter(v as any)}
                className="w-auto"
              >
                <TabsList className="h-9 bg-muted border border-border">
                  <TabsTrigger
                    value="ALL"
                    className="text-sm px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="PENDING"
                    className="text-sm px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="PAST"
                    className="text-sm px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Past
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Corporate Card for Activity Table */}
            <Card className="border-border shadow-sm rounded-md bg-card">
              <CardContent className="p-0">
                <EmployeeRecentActivity
                  leaves={filteredLeaves}
                  isLoading={isLoadingLeaves}
                />
                <div className="border-t border-border p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/leaves")}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    View Full History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Team Status & Holidays (1/3 width) */}
          <div className={cn(gridConfig.employeeSidebar, "space-y-4")}>
            <div className="flex items-center justify-between">
              <h3 className={cn(typography.sectionTitle, "flex items-center gap-2 text-foreground")}>
                <Calendar className="h-5 w-5 text-muted-foreground" />
                My Team
              </h3>
            </div>

            {/* Team Status Summary with Corporate Styling */}
            <TeamStatusSummary />

            {/* Upcoming Holidays Panel */}
            <UpcomingHolidaysPanel
              holidays={holidaysData as any}
              isLoading={isLoadingHolidays}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
