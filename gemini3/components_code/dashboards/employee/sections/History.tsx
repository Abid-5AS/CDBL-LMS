"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@/components/ui";
import { SortedTimeline } from "./SortedTimeline";
import { LeaveHeatmap } from "@/components/shared/widgets/LeaveHeatmap";
import { ChartContainer, TypePie } from "@/components/shared/LeaveCharts";
import { fromDashboardAgg } from "@/components/shared/LeaveCharts/adapters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, Calendar, BarChart3, Info, Inbox } from "lucide-react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/apiClient";
import { useUIStore } from "@/lib/ui-state";
import { formatDate } from "@/lib/utils";


type FilterPeriod = "month" | "quarter" | "year";

type LeaveStatus =
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED";

type LeaveRow = {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: LeaveStatus;
  updatedAt: string;
  approvals?: Array<{
    step?: number;
    decision: string;
    approver?: { name: string | null } | null;
    toRole?: string | null;
    comment?: string | null;
    decidedAt?: string | null;
  }>;
};

interface HistoryAnalyticsCardProps {
  leaves: LeaveRow[];
  isLoadingLeaves: boolean;
}

// Extract RequestsTable component logic (without filter UI - filter is now in parent)
function RequestsTable({
  leaves,
  isLoading,
  filter,
  limit,
}: {
  leaves: LeaveRow[];
  isLoading: boolean;
  filter: string;
  limit?: number;
}) {
  const { openDrawer } = useUIStore();

  const filteredRows = useMemo(() => {
    let filtered: LeaveRow[] = [];
    if (filter === "all") {
      filtered = leaves;
    } else {
      filtered = leaves.filter((row) => {
        switch (filter) {
          case "pending":
            return (
              row.status === "PENDING" ||
              row.status === "SUBMITTED" ||
              row.status === "CANCELLATION_REQUESTED"
            );
          case "returned":
            return row.status === "RETURNED";
          case "history":
            return (
              row.status === "APPROVED" ||
              row.status === "REJECTED" ||
              row.status === "CANCELLED" ||
              row.status === "RECALLED"
            );
          default:
            return true;
        }
      });
    }
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [leaves, filter, limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (filteredRows.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center py-6">
        <Inbox className="size-12 text-text-tertiary" />
        <p className="mt-2 text-sm font-semibold text-text-primary">
          No Requests Found
        </p>
        <p className="text-xs text-text-muted">
          There are no requests matching your filter.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-800">
        {filteredRows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 p-3 hover:bg-bg-tertiary cursor-pointer transition-colors"
            onClick={() => openDrawer(row.id)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {row.type} Leave
              </p>
              <p className="text-xs text-text-muted">
                {formatDate(row.startDate)} → {formatDate(row.endDate)}
                <span className="hidden sm:inline">
                  {" "}
                  ({row.workingDays} days)
                </span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={row.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryAnalyticsCard({
  leaves,
  isLoadingLeaves,
}: HistoryAnalyticsCardProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "timeline" | "usage">(
    "recent"
  );
  const [filter, setFilter] = useState<string>("all");
  const [period, setPeriod] = useState<FilterPeriod>("year");

  // Fetch summary data for analytics
  const { data: summaryData, isLoading: isLoadingSummary } = useSWR<{
    summary: any;
    distribution?: any[];
  }>(
    `/api/dashboard/analytics/summary?period=${period}`,
    apiFetcher
  );

  const summary = useMemo(() => {
    if (!summaryData?.summary) return null;

    const { summary: summaryInfo } = summaryData;

    let periodLabel = "This Year";
    let periodTotal = summaryInfo.yearUsed ?? 0;

    if (period === "month") {
      periodLabel = "This Month";
      periodTotal = summaryInfo.monthUsed ?? 0;
    } else if (period === "quarter") {
      periodLabel = "This Quarter";
      periodTotal = summaryInfo.quarterUsed ?? 0;
    }

    // Find top leave type
    let topType = "N/A";
    if (summaryData?.distribution && summaryData.distribution.length > 0) {
      const sorted = [...summaryData.distribution].sort(
        (a: any, b: any) => b.days - a.days
      );
      topType = sorted[0].type || "N/A";
    }

    return {
      periodTotal,
      periodLabel,
      remaining: summaryInfo.remainingAll ?? 0,
      totalUsed: summaryInfo.yearUsed ?? 0,
      topType,
    };
  }, [summaryData, period]);

  const pieData = useMemo(() => {
    if (!summaryData?.distribution) return [];
    return summaryData.distribution.map((item: any) => ({
      name: item.type,
      value: item.days,
    }));
  }, [summaryData]);

  const primaryTabs = [
    { value: "recent", label: "Recent" },
    { value: "timeline", label: "Timeline" },
    { value: "usage", label: "Usage" },
  ];

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "returned", label: "Returned" },
    { value: "history", label: "History" },
  ];

  return (
    <Card className="bg-bg-primary/60 dark:bg-bg-secondary/40 backdrop-blur-sm border border-border-strong/70 dark:border-border-strong/70 shadow-sm animate-fade-in-up">
      <CardHeader className="p-4 sm:p-5 space-y-4">
        {/* Title */}
        <CardTitle className="text-lg font-semibold text-text-primary">
          History & Analytics
        </CardTitle>

        {/* Primary Tabs Toolbar */}
        <div className="flex flex-wrap gap-2">
          {primaryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-card-action text-text-inverted dark:bg-card-action"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Chips Toolbar (only show for Recent tab) */}
        {activeTab === "recent" && (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === option.value
                    ? "bg-card-action/10 text-card-action border border-card-action/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 dark:bg-muted/60"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Compact Analytics Bar - Show when on Usage tab */}
        {activeTab === "usage" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            {/* Compact Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/40 dark:bg-muted/20 rounded-lg p-3 border border-border-strong/50 dark:border-border-strong/50">
                <p className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                  Days Used
                </p>
                <p className="text-lg font-bold text-text-secondary dark:text-text-secondary">
                  {summary?.periodTotal ?? 0}
                </p>
                <p className="text-[10px] text-text-secondary dark:text-text-secondary mt-0.5">
                  {summary?.periodLabel ?? "This Year"}
                </p>
              </div>
              <div className="bg-muted/40 dark:bg-muted/20 rounded-lg p-3 border border-border-strong/50 dark:border-border-strong/50">
                <p className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                  Remaining
                </p>
                <p className="text-lg font-bold text-text-secondary dark:text-text-secondary">
                  {summary?.remaining ?? 0}
                </p>
                <p className="text-[10px] text-text-secondary dark:text-text-secondary mt-0.5">
                  All Types
                </p>
              </div>
              <div className="bg-muted/40 dark:bg-muted/20 rounded-lg p-3 border border-border-strong/50 dark:border-border-strong/50">
                <p className="text-xs text-text-secondary dark:text-text-secondary mb-1">
                  Top Type
                </p>
                <p className="text-lg font-bold text-text-secondary dark:text-text-secondary">
                  {summary?.topType ?? "N/A"}
                </p>
                <p className="text-[10px] text-text-secondary dark:text-text-secondary mt-0.5">
                  Most Used
                </p>
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-text-secondary dark:text-text-secondary whitespace-nowrap">
                View:
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={period === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("month")}
                  className="h-7 px-2.5 text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={period === "quarter" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("quarter")}
                  className="h-7 px-2.5 text-xs"
                >
                  Quarter
                </Button>
                <Button
                  variant={period === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("year")}
                  className="h-7 px-2.5 text-xs"
                >
                  Year
                </Button>
              </div>
            </div>
          </section>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {activeTab === "recent" && (
          <RequestsTable
            leaves={leaves}
            isLoading={isLoadingLeaves}
            filter={filter}
            limit={5}
          />
        )}
        {activeTab === "timeline" && (
          <SortedTimeline leaves={leaves} isLoading={isLoadingLeaves} />
        )}
        {activeTab === "usage" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Pie Chart (Leave Type Distribution) */}
            <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4 border border-border-strong/50 dark:border-border-strong/50">
              <h3 className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-3">
                By Leave Type
              </h3>
              {(() => {
                const { slices } = fromDashboardAgg({
                  typeDistribution: pieData.map((item: any) => ({
                    type: item.name,
                    count: item.value,
                  })),
                });
                return <TypePie data={slices} height={200} />;
              })()}
            </div>
            {/* Right: Heatmap (Day Frequency) */}
            <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4 border border-border-strong/50 dark:border-border-strong/50">
              <h3 className="text-sm font-semibold text-text-secondary dark:text-text-secondary mb-3">
                Day Frequency
              </h3>
              <LeaveHeatmap defaultScope="me" defaultRange="year" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
