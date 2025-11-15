"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Download,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { leaveTypeLabel, leaveTypeColor } from "@/lib/ui";

// ============================================
// Types
// ============================================

interface MonthlyTrendData {
  month: string;
  leaves: number;
  approved: number;
  rejected: number;
}

interface LeaveTypeBreakdown {
  type: string;
  count: number;
  days: number;
  percentage: number;
}

interface DepartmentUtilization {
  department: string;
  employeeCount: number;
  totalDays: number;
  avgDaysPerEmployee: number;
  utilizationRate: number;
}

interface AnalyticsData {
  monthlyTrend: MonthlyTrendData[];
  leaveTypeBreakdown: LeaveTypeBreakdown[];
  departmentUtilization: DepartmentUtilization[];
  totalLeaves: number;
  totalDays: number;
  approvalRate: number;
}

// ============================================
// Simple Bar Chart Component
// ============================================

interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

function SimpleBarChart({
  data,
  maxValue,
  height = 200,
  showValues = true,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-20 text-sm font-medium truncate text-muted-foreground">
            {item.label}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  item.color || "bg-primary"
                )}
                style={{
                  width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                }}
              />
            </div>
            {showValues && (
              <div className="w-12 text-right text-sm font-semibold">
                {item.value}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Monthly Trend Chart
// ============================================

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  isLoading?: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const maxValue = Math.max(...data.map((d) => d.leaves));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Monthly Leave Trend
            </CardTitle>
            <CardDescription>Leave requests over the past 12 months</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((month, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{month.month}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Approved: <strong className="text-green-600">{month.approved}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Rejected: <strong className="text-red-600">{month.rejected}</strong>
                  </span>
                  <span className="font-semibold">{month.leaves} total</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500 transition-all duration-500"
                      style={{
                        width: `${maxValue > 0 ? (month.approved / maxValue) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-500"
                      style={{
                        width: `${maxValue > 0 ? (month.rejected / maxValue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Leave Type Distribution Chart
// ============================================

interface LeaveTypeDistributionProps {
  data: LeaveTypeBreakdown[];
  isLoading?: boolean;
}

export function LeaveTypeDistribution({ data, isLoading }: LeaveTypeDistributionProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Leave Type Distribution
        </CardTitle>
        <CardDescription>Breakdown by leave type</CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleBarChart
          data={data.map((item) => ({
            label: item.type,
            value: item.count,
            color: leaveTypeColor(item.type as any),
          }))}
          showValues={true}
        />

        <div className="mt-6 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <div className="text-sm font-medium">{item.type}</div>
                <div className="text-xs text-muted-foreground">
                  {item.days} days • {item.percentage.toFixed(1)}%
                </div>
              </div>
              <Badge variant="secondary">{item.count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Department Utilization Chart
// ============================================

interface DepartmentUtilizationProps {
  data: DepartmentUtilization[];
  isLoading?: boolean;
}

export function DepartmentUtilizationChart({
  data,
  isLoading,
}: DepartmentUtilizationProps) {
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Department Utilization
            </CardTitle>
            <CardDescription>Leave usage by department</CardDescription>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Depts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {data.map((dept, idx) => (
                <SelectItem key={idx} value={dept.department}>
                  {dept.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((dept, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{dept.department}</h4>
                  <p className="text-sm text-muted-foreground">
                    {dept.employeeCount} employees
                  </p>
                </div>
                <Badge
                  variant={
                    dept.utilizationRate > 80
                      ? "destructive"
                      : dept.utilizationRate > 60
                      ? "default"
                      : "secondary"
                  }
                >
                  {dept.utilizationRate.toFixed(0)}% utilized
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total leave days:</span>
                  <span className="font-semibold">{dept.totalDays}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg per employee:</span>
                  <span className="font-semibold">
                    {dept.avgDaysPerEmployee.toFixed(1)} days
                  </span>
                </div>

                {/* Utilization Bar */}
                <div className="mt-2">
                  <div className="bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        dept.utilizationRate > 80
                          ? "bg-red-500"
                          : dept.utilizationRate > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                      style={{ width: `${dept.utilizationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Complete Analytics Dashboard
// ============================================

interface LeaveAnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading?: boolean;
  role?: "HR_ADMIN" | "DEPT_HEAD" | "CEO";
}

export function LeaveAnalyticsDashboard({
  data,
  isLoading = false,
  role = "HR_ADMIN",
}: LeaveAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = React.useState("12m");

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Leaves</CardDescription>
            <CardTitle className="text-3xl">{data.totalLeaves}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="size-4" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Days</CardDescription>
            <CardTitle className="text-3xl">{data.totalDays}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>Across all types</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approval Rate</CardDescription>
            <CardTitle className="text-3xl">{data.approvalRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="size-4" />
              <span>Excellent</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Departments</CardDescription>
            <CardTitle className="text-3xl">
              {data.departmentUtilization.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>Active departments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart data={data.monthlyTrend} />
        <LeaveTypeDistribution data={data.leaveTypeBreakdown} />
      </div>

      {/* Department Utilization */}
      {(role === "HR_ADMIN" || role === "CEO") && (
        <DepartmentUtilizationChart data={data.departmentUtilization} />
      )}
    </div>
  );
}
