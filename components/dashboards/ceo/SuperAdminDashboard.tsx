"use client";

import { CEODashboard } from "./CEODashboard";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

type SuperAdminDashboardProps = {
  username: string;
};

/**
 * CEO Executive Dashboard
 * Refactored to use standard shadcn/ui components and dark mode support.
 */
export function SuperAdminDashboard({ username }: SuperAdminDashboardProps) {
  return (
    <DashboardErrorBoundary role="CEO">
      <CEODashboard />
    </DashboardErrorBoundary>
  );
}
