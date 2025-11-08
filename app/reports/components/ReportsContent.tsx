"use client";

import { useState, useMemo } from "react";
import { KpiCards } from "@/components/reports/KpiCards";
import { FilterBar } from "@/components/reports/FilterBar";
import { ChartsSection } from "@/components/reports/ChartsSection";
import { ExportSection } from "@/components/shared/ExportSection";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ReportsContent() {
  const [duration, setDuration] = useState("month");
  const [department, setDepartment] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<string | null>(null);

  // Build query string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("duration", duration);
    if (department) params.set("department", department);
    if (leaveType) params.set("leaveType", leaveType);
    return params.toString();
  }, [duration, department, leaveType]);

  const { data, error, isLoading } = useSWR(
    `/api/reports/analytics?${queryParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Failed to load analytics data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <FilterBar
        duration={duration}
        department={department}
        leaveType={leaveType}
        onDurationChange={setDuration}
        onDepartmentChange={setDepartment}
        onLeaveTypeChange={setLeaveType}
      />

      {/* KPI Cards */}
      <KpiCards
        kpis={
          data?.kpis || {
            pendingApprovals: 0,
            approvedLeaves: 0,
            avgApprovalTime: 0,
            totalEmployees: 0,
            utilizationRate: 0,
          }
        }
        duration={duration}
        isLoading={isLoading}
      />

      {/* Charts Section */}
      <ChartsSection
        monthlyTrend={data?.charts?.monthlyTrend || []}
        typeDistribution={data?.charts?.typeDistribution || []}
        departmentSummary={data?.charts?.departmentSummary || []}
        isLoading={isLoading}
      />

      {/* Export Section */}
      <ExportSection
        context="reports"
        payload={{
          duration: duration as "month" | "quarter" | "year",
          department,
          leaveType,
        }}
      />
    </div>
  );
}
