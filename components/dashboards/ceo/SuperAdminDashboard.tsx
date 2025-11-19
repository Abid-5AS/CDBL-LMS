"use client";

import { CorporateCEODashboard } from "./CorporateCEODashboard";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

type SuperAdminDashboardProps = {
  username: string;
};

/**
 * CEO Executive Dashboard - Strategic Leave Management Overview
 * Focus: Organization-wide metrics, financial impact, YoY trends
 *
 * ✅ CORPORATE DESIGN REFACTORED
 * - Uses "comfortable" density mode for executive-level view
 * - Clean, professional design without gradients
 * - All features preserved from original CEODashboard
 * - All KPIs pull real-time data from /api/dashboard/ceo/stats
 * - Auto-refreshes every 60 seconds
 * - Features: Financial analysis, YoY comparisons, Strategic insights
 */
export function SuperAdminDashboard({ username }: SuperAdminDashboardProps) {
  return (
    <DashboardErrorBoundary role="CEO">
      <CorporateCEODashboard />
    </DashboardErrorBoundary>
  );
}
