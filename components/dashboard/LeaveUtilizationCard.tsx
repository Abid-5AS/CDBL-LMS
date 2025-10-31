"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LeaveUtilizationCard() {
  const { data, error, isLoading } = useSWR("/api/dashboard/analytics", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { monthlyUsage, summary } = data;

  // Get current month usage data
  const currentMonth = new Date().getMonth();
  const thisMonthData = monthlyUsage[currentMonth];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Leave Usage Analytics
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Projected Annual Usage */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Projected Annual Usage</span>
              <span className="text-sm font-bold text-slate-900">{summary.projectedAnnualUsage} days</span>
            </div>
            <div className="text-xs text-slate-600">
              Based on {summary.totalUsed} days used so far this year
            </div>
          </div>

          {/* Usage by Type */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Usage by Leave Type</h4>
            
            {/* Earned Leave */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Earned Leave</span>
                <span className="font-medium text-slate-900">
                  {summary.breakdown.earned} days ({summary.utilization.earned}%)
                </span>
              </div>
              <Progress
                value={summary.utilization.earned}
                className="h-2"
                indicatorClassName={
                  summary.utilization.earned > 70
                    ? "bg-amber-500"
                    : summary.utilization.earned > 90
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }
              />
            </div>

            {/* Casual Leave */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Casual Leave</span>
                <span className="font-medium text-slate-900">
                  {summary.breakdown.casual} days ({summary.utilization.casual}%)
                </span>
              </div>
              <Progress
                value={summary.utilization.casual}
                className="h-2"
                indicatorClassName={
                  summary.utilization.casual > 70
                    ? "bg-amber-500"
                    : summary.utilization.casual > 90
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }
              />
            </div>

            {/* Medical Leave */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Medical Leave</span>
                <span className="font-medium text-slate-900">
                  {summary.breakdown.medical} days ({summary.utilization.medical}%)
                </span>
              </div>
              <Progress
                value={summary.utilization.medical}
                className="h-2"
                indicatorClassName={
                  summary.utilization.medical > 70
                    ? "bg-amber-500"
                    : summary.utilization.medical > 90
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }
              />
            </div>
          </div>

          {/* Monthly Trend (Simple Bar Chart) */}
          {thisMonthData && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900">This Month Usage</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-20">Earned</span>
                  <div className="flex-1 h-4 bg-slate-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{ width: `${Math.min((thisMonthData.earned / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-900 w-10 text-right">
                    {thisMonthData.earned}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-20">Casual</span>
                  <div className="flex-1 h-4 bg-slate-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded"
                      style={{ width: `${Math.min((thisMonthData.casual / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-900 w-10 text-right">
                    {thisMonthData.casual}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-20">Medical</span>
                  <div className="flex-1 h-4 bg-slate-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded"
                      style={{ width: `${Math.min((thisMonthData.medical / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-900 w-10 text-right">
                    {thisMonthData.medical}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

