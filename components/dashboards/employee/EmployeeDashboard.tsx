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
import { leaveTypeLabel } from "@/lib/ui/ui";
import { formatDate } from "@/lib/utils";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// Corporate components
import { BalanceCard } from "@/components/corporate/BalanceCard";
import { MetricCard } from "@/components/corporate/MetricCard";
import { getDensityClasses, getTypography, GRID_CONFIGS } from "@/lib/ui/density-modes";
import { cn } from "@/lib/utils";
import { LeaveType } from "@/lib/enums";

// Existing feature components (to be restyled)
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { TeamStatusSummary } from "./components/TeamStatusSummary";
import { UpcomingHolidaysPanel } from "./components/UpcomingHolidaysPanel";

// Hooks
import { useMounted } from "@/hooks";
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";

// Corporate Active Request Tracker (restyled)
import { ActiveRequestTracker } from "./components/ActiveRequestTracker";

type CorporateEmployeeDashboardProps = {
  username: string;
};

// Leave entitlements (these should come from API in production)
// Leave entitlements now come from API
// const LEAVE_ENTITLEMENTS = { ... }

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
export function EmployeeDashboard({
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

  // Fetch detailed balance to get total entitlements + used
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<any>("/api/balance/mine?detailed=true");

  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays?upcoming=true",
    apiFetcher
  );

  // Process data using existing hook
  const dashboardData = useEmployeeDashboardData(leaves, balanceData);

  // Calculate entitlements from API response
  const entitlements = React.useMemo(() => {
    if (!balanceData || !balanceData.balances) {
        // Fallback or loading state
        return {
            CASUAL: { total: 0, available: 0, used: 0 },
            MEDICAL: { total: 0, available: 0, used: 0 },
            EARNED: { total: 0, available: 0, used: 0 }
        };
    }
    
    const getEntitlement = (type: string) => {
        const record = balanceData.balances.find((b: any) => b.type === type);
        if (!record) return { total: 0, available: 0, used: 0 };
        // Total entitlement = opening (carry over) + accrued (this year)
        // Note: Accrued usually means "earned so far". But for Casual/Medical it's usually fixed annual.
        // Assuming API returns 'accrued' as total annual quota for fixed types.
        const total = (record.opening || 0) + (record.accrued || 0);
        return {
            total,
            available: record.closing ?? (total - (record.used || 0)),
            used: record.used || 0
        };
    };

    return {
        CASUAL: getEntitlement("CASUAL"),
        MEDICAL: getEntitlement("MEDICAL"),
        EARNED: getEntitlement("EARNED")
    };
  }, [balanceData]);

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
              type={LeaveType.CASUAL}
              available={entitlements.CASUAL.available}
              used={entitlements.CASUAL.used}
              total={entitlements.CASUAL.total}
              density={density}
              onClick={() => router.push("/balance")}
            />
            <BalanceCard
              type={LeaveType.MEDICAL}
              available={entitlements.MEDICAL.available}
              used={entitlements.MEDICAL.used}
              total={entitlements.MEDICAL.total}
              density={density}
              onClick={() => router.push("/balance")}
            />
            <BalanceCard
              type={LeaveType.EARNED}
              available={entitlements.EARNED.available}
              used={entitlements.EARNED.used}
              total={entitlements.EARNED.total}
              density={density}
              onClick={() => router.push("/balance")}
            />
          </div>
        </section>

        {/* Active Request Tracker */}
        <ActiveRequestTracker
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
