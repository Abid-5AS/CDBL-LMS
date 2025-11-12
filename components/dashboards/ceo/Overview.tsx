"use client";

import { CEODashboardClient } from "./CEODashboardClient";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

type SuperAdminDashboardProps = {
  username: string;
};

/**
 * CEO Executive Dashboard - Strategic Leave Management Overview
 * Focus: Organization-wide metrics, financial impact, YoY trends
 *
 * ✅ FULLY REFACTORED - NO MOCK DATA
 * All KPIs pull real-time data from /api/dashboard/ceo/stats
 * Auto-refreshes every 60 seconds
 * Features: Financial analysis, YoY comparisons, AI insights
 */
export function SuperAdminDashboard({ username }: SuperAdminDashboardProps) {
  return (
    <DashboardErrorBoundary role="CEO">
      <CEODashboardClient />
    </DashboardErrorBoundary>
  );
}
