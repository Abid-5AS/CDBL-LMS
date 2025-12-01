"use client";

import { HRAnalyticsCard, createHRAnalyticsData } from "@/components/shared";

type ModernHRStatCardsProps = {
  stats: {
    employeesOnLeave: number;
    pendingRequests: number;
    avgApprovalTime: number;
    encashmentPending: number;
    totalLeavesThisYear: number;
    processedToday?: number;
    dailyTarget?: number;
    teamUtilization?: number;
    complianceScore?: number;
  };
  className?: string;
};

export function ModernHRStatCards({
  stats,
  className,
}: ModernHRStatCardsProps) {
  // Transform the existing stats into our analytics format
  const analyticsData = createHRAnalyticsData({
    pendingApprovals: stats.pendingRequests,
    maxPendingTarget: 30, // Target: keep pending requests under 30
    processedToday:
      stats.processedToday || Math.floor(stats.totalLeavesThisYear / 250), // Estimate daily processing
    dailyTarget: stats.dailyTarget || 15, // Target: process 15 requests per day
    teamUtilization:
      stats.teamUtilization || Math.max(10, 100 - stats.employeesOnLeave * 5), // Estimate utilization
    utilizationTarget: 90, // Target: 90% team utilization
    complianceScore:
      stats.complianceScore || Math.max(80, 100 - stats.avgApprovalTime * 2), // Estimate compliance
    complianceTarget: 100, // Target: 100% compliance
  });

  return (
    <div className={className}>
      <HRAnalyticsCard
        title="HR Dashboard Metrics"
        subtitle="Real-time operational overview"
        metrics={analyticsData}
        className="w-full"
      />

      {/* Additional summary cards for specific metrics */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-lg border bg-card text-center">
          <div className="text-sm text-muted-foreground">On Leave Today</div>
          <div className="text-xl font-bold text-foreground">
            {stats.employeesOnLeave}
          </div>
          <div className="text-xs text-muted-foreground">employees</div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-center">
          <div className="text-sm text-muted-foreground">Avg Approval</div>
          <div className="text-xl font-bold text-foreground">
            {stats.avgApprovalTime}
          </div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-center">
          <div className="text-sm text-muted-foreground">Encashment</div>
          <div className="text-xl font-bold text-foreground">
            {stats.encashmentPending}
          </div>
          <div className="text-xs text-muted-foreground">pending</div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-center">
          <div className="text-sm text-muted-foreground">Total YTD</div>
          <div className="text-xl font-bold text-foreground">
            {stats.totalLeavesThisYear}
          </div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>
    </div>
  );
}
