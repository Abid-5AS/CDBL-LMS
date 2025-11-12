"use client";

import { HRAdminDashboardClient } from "./HRAdminDashboardClient";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

type HRAdminDashboardProps = {
  username: string;
};

/**
 * HR Admin Dashboard - Operational Leave Management
 * Focus: Department-level leave operations (forward/reject/return)
 *
 * ✅ FULLY REFACTORED - NO MOCK DATA
 * All KPIs now pull real-time data from /api/dashboard/hr-admin/stats
 * Auto-refreshes every 60 seconds
 */
export function HRAdminDashboard({ username }: HRAdminDashboardProps) {
  return (
    <DashboardErrorBoundary role="HR_ADMIN">
      <HRAdminDashboardClient />
    </DashboardErrorBoundary>
  );
}
