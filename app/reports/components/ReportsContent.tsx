"use client";

import { useState, useMemo } from "react";
import { KpiCards, FilterBar, ChartsSection } from "@/components/reports";
import { ExportSection } from "@/components/shared";
import useSWR from "swr";
import { Card, CardContent, Badge, Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { AlertTriangle, ShieldCheck } from "lucide-react";

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

  const kpis =
    data?.kpis || {
      pendingApprovals: 0,
      approvedLeaves: 0,
      avgApprovalTime: 0,
      totalEmployees: 0,
      utilizationRate: 0,
    };

  const charts = data?.charts || {
    monthlyTrend: [],
    typeDistribution: [],
    departmentSummary: [],
  };

  const insightData = useMemo(() => {
    const busiestMonth = [...(charts.monthlyTrend || [])]
      .sort((a, b) => b.leaves - a.leaves)
      .at(0);
    const dominantType = [...(charts.typeDistribution || [])]
      .sort((a, b) => b.value - a.value)
      .at(0);
    const topDepartment = (charts.departmentSummary || []).at(0);

    return [
      {
        label: "Busiest month",
        value: busiestMonth ? busiestMonth.month : "—",
        helper: busiestMonth
          ? `${busiestMonth.leaves} leave days`
          : "No monthly trend yet",
      },
      {
        label: "Top leave type",
        value: dominantType ? dominantType.name : "—",
        helper: dominantType
          ? `${dominantType.value} days requested`
          : "No distribution data",
      },
      {
        label: "Most impacted dept",
        value: topDepartment ? topDepartment.name : "—",
        helper: topDepartment
          ? `${topDepartment.count} days this period`
          : "No department usage yet",
      },
    ];
  }, [charts.monthlyTrend, charts.typeDistribution, charts.departmentSummary]);

  const alerts = useMemo(() => {
    const items: Array<{
      title: string;
      detail: string;
      tone: "warning" | "critical" | "info";
    }> = [];
    if (kpis.pendingApprovals > 20) {
      items.push({
        title: "Approval backlog rising",
        detail: `${kpis.pendingApprovals} requests awaiting action`,
        tone: "warning",
      });
    }
    if (kpis.avgApprovalTime > 5) {
      items.push({
        title: "SLA risk",
        detail: `Average approval time is ${kpis.avgApprovalTime} days`,
        tone: "critical",
      });
    }
    if (kpis.utilizationRate > 85) {
      items.push({
        title: "High utilization",
        detail: `Employees have used ${kpis.utilizationRate}% of available leave`,
        tone: "warning",
      });
    }
    if (items.length === 0) {
      items.push({
        title: "All clear",
        detail: "No compliance issues detected for the selected period.",
        tone: "info",
      });
    }
    return items;
  }, [kpis]);

  const emptyState = data?.emptyState as
    | { title: string; description: string }
    | null
    | undefined;

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
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <FilterBar
          duration={duration}
          department={department}
          leaveType={leaveType}
          onDurationChange={setDuration}
          onDepartmentChange={setDepartment}
          onLeaveTypeChange={setLeaveType}
        />

      <KpiCards kpis={kpis} duration={duration} isLoading={isLoading} />
      {!isLoading && emptyState && (
        <Alert variant="secondary" className="border border-dashed border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTitle>{emptyState.title}</AlertTitle>
          <AlertDescription>{emptyState.description}</AlertDescription>
        </Alert>
      )}

        <ChartsSection
          monthlyTrend={charts.monthlyTrend || []}
          typeDistribution={charts.typeDistribution || []}
          departmentSummary={charts.departmentSummary || []}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-6">
        <InsightsPanel insights={insightData} isLoading={isLoading} />
        <AlertsPanel alerts={alerts} isLoading={isLoading} />
        <DepartmentSnapshot
          data={charts.departmentSummary || []}
          isLoading={isLoading}
        />
        <ExportSection
          context="reports"
          payload={{
            duration: duration as "month" | "quarter" | "year",
            department,
            leaveType,
          }}
        />
      </div>
    </div>
  );
}

function InsightsPanel({
  insights,
  isLoading,
}: {
  insights: Array<{ label: string; value: string; helper: string }>;
  isLoading?: boolean;
}) {
  return (
    <Card className="surface-card">
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Highlights
          </p>
          <h3 className="text-lg font-semibold">Operational Insights</h3>
        </div>
        <div className="space-y-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))
            : insights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/60 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.helper}</p>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel({
  alerts,
  isLoading,
}: {
  alerts: Array<{ title: string; detail: string; tone: "warning" | "critical" | "info" }>;
  isLoading?: boolean;
}) {
  const iconColor = {
    warning: "text-amber-500",
    critical: "text-red-500",
    info: "text-emerald-500",
  } as const;
  return (
    <Card className="surface-card">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Compliance & Alerts
            </p>
            <h3 className="text-lg font-semibold">Attention Needed</h3>
          </div>
        </div>
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))
            : alerts.map((alert, idx) => (
                <div
                  key={`${alert.title}-${idx}`}
                  className="rounded-xl border border-border/60 p-4 flex items-start gap-3"
                >
                  <AlertTriangle className={`h-4 w-4 ${iconColor[alert.tone]}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {alert.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{alert.detail}</p>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentSnapshot({
  data,
  isLoading,
}: {
  data: Array<{ name: string; count: number }>;
  isLoading?: boolean;
}) {
  const topThree = (data || []).slice(0, 3);
  return (
    <Card className="surface-card">
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Coverage
          </p>
          <h3 className="text-lg font-semibold">Teams Under Pressure</h3>
        </div>
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))
            : topThree.length === 0
            ? (
              <p className="text-sm text-muted-foreground">
                No department data for the selected filters.
              </p>
            ) : (
              topThree.map((dept, idx) => (
                <div
                  key={`${dept.name}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {dept.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dept.count} leave days
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{idx + 1}
                  </Badge>
                </div>
              ))
            )}
        </div>
      </CardContent>
    </Card>
  );
}
