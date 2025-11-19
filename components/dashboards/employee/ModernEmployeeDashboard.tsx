"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  TrendingUp,
  PieChart,
  Activity,
  Plus,
  Info,
  AlertCircle,
  ClipboardList,
  BookOpen,
  Filter,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useApiQuery } from "@/lib/apiClient";
import { useLeaveRequests } from "@/hooks";
import { leaveTypeLabel } from "@/lib/ui";
import { formatDate } from "@/lib/utils";
import { RoleBasedDashboard } from "../shared/RoleBasedDashboard";
import {
  ResponsiveDashboardGrid,
  DashboardSection,
} from "../shared/ResponsiveDashboardGrid";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";

// Extracted components
import { EmployeeRecentActivity } from "./components/EmployeeRecentActivity";
import { FloatingQuickActions } from "./components/FloatingQuickActions";
import { LeaveBalanceCard } from "./components/LeaveBalanceCard";
import { TeamStatusSummary } from "./components/TeamStatusSummary";

// Extracted hooks and utils
import { KPIGridSkeleton } from "@/components/shared/skeletons";
import { useMounted } from "@/hooks/use-mounted";
import { useEmployeeDashboardData } from "./hooks/useEmployeeDashboardData";
import { WhosOutToday } from "@/app/dashboard/shared/WhosOutToday";

type EmployeeDashboardContentProps = {
  username: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

// Hardcoded entitlements for Mock 2.1 layout (as per plan)
const LEAVE_ENTITLEMENTS = {
  CASUAL: 14,
  SICK: 14,
  EARNED: 20,
};

export function ModernEmployeeDashboard({
  username,
}: EmployeeDashboardContentProps) {
  const router = useRouter();
  const [activityFilter, setActivityFilter] = useState<"ALL" | "PENDING" | "PAST">("ALL");
  const mounted = useMounted();

  const { allRows: leaves, isLoading: isLoadingLeaves } = useLeaveRequests({
    enableSelection: false,
  });
  const { data: balanceData, isLoading: isLoadingBalance } =
    useApiQuery<Record<string, number>>("/api/balance/mine");

  // Fetch holidays data
  const { data: holidaysData, isLoading: isLoadingHolidays } = useSWR(
    "/api/holidays?upcoming=true",
    apiFetcher
  );

  // Process data using custom hook
  const dashboardData = useEmployeeDashboardData(leaves, balanceData);

  // Filter leaves for the activity list
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

    // Map to add formatting
    return result.map(leave => ({
      ...leave,
      typeLabel: leaveTypeLabel[leave.type] || leave.type,
      formattedDates: `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`,
    }));
  }, [leaves, activityFilter]);

  const quickActions = [
    {
      label: "Review My Leaves",
      description: "Jump to status & history",
      icon: ClipboardList,
      accent: "bg-blue-600 text-white",
      onClick: () => router.push("/leaves"),
    },
    {
      label: "Check Balance & Policies",
      description: "View balances and rules",
      icon: BookOpen,
      accent: "bg-emerald-600 text-white",
      onClick: () => router.push("/balance"),
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push("/leaves")}>
        <ClipboardList className="mr-2 h-4 w-4" />
        My History
      </Button>
      <Button onClick={() => router.push("/leaves/apply")} size="sm" className="shadow-sm">
        <Plus className="mr-2 h-4 w-4" />
        Apply for Leave
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Removed FloatingQuickActions as per feedback */}
      <RoleBasedDashboard
        role="EMPLOYEE"
        animate={true}
        backgroundVariant="transparent"
        compactHeader={true}
        title="Overview"
        description={`Welcome back, ${username.split(" ")[0]}.`}
        actions={headerActions}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Top Section: Balance Cards */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <LeaveBalanceCard 
                type="CASUAL" 
                available={dashboardData.balanceData?.CASUAL || 0} 
                total={LEAVE_ENTITLEMENTS.CASUAL}
                colorClass="bg-blue-500"
              />
              <LeaveBalanceCard 
                type="SICK" 
                available={dashboardData.balanceData?.SICK || 0} 
                total={LEAVE_ENTITLEMENTS.SICK}
                colorClass="bg-rose-500"
              />
              <LeaveBalanceCard 
                type="EARNED" 
                available={dashboardData.balanceData?.EARNED || 0} 
                total={LEAVE_ENTITLEMENTS.EARNED}
                colorClass="bg-emerald-500"
              />
            </div>
          </motion.section>

          {/* Main Content: 2-Column Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Recent Activity (2/3 width) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  My Requests
                </h3>
                <Tabs 
                  value={activityFilter} 
                  onValueChange={(v) => setActivityFilter(v as any)}
                  className="w-auto"
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="ALL" className="text-xs px-3">All</TabsTrigger>
                    <TabsTrigger value="PENDING" className="text-xs px-3">Pending</TabsTrigger>
                    <TabsTrigger value="PAST" className="text-xs px-3">Past</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-0">
                  {/* Reusing EmployeeRecentActivity but passing filtered leaves */}
                  <EmployeeRecentActivity 
                    leaves={filteredLeaves} 
                    isLoading={isLoadingLeaves} 
                  />
                  <div className="border-t border-border/60 p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/leaves")} className="text-xs text-muted-foreground hover:text-foreground">
                      View Full History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column: Team Status (1/3 width) */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  My Team
                </h3>
              </div>
              
              {/* New Compact Team Status Summary with Modal */}
              <TeamStatusSummary />

              {/* Optional: Upcoming Holidays or other side widgets could go here */}
            </motion.div>
          </div>
        </motion.div>
      </RoleBasedDashboard>
    </TooltipProvider>
  );
}
