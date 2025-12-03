"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
} from "@/components/ui";
import { LeaveType } from "@/lib/enums";
import type { BalanceProjectionResult } from "@/lib/services/balance-projector.service";

type BalanceProjectionWidgetProps = {
  leaveType?: LeaveType;
  userId?: number;
};

export function BalanceProjectionWidget({
  leaveType = LeaveType.EARNED,
  userId,
}: BalanceProjectionWidgetProps) {
  const [projection, setProjection] = useState<BalanceProjectionResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<LeaveType>(leaveType);

  const [showSimulator, setShowSimulator] = useState(false);
  const [simulateStartDate, setSimulateStartDate] = useState<Date | undefined>();
  const [simulateEndDate, setSimulateEndDate] = useState<Date | undefined>();
  const [simulateWorkingDays, setSimulateWorkingDays] = useState<number>(1);

  useEffect(() => {
    const fetchProjection = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          leaveType: selectedType,
          monthsAhead: "12",
        });

        if (showSimulator && simulateStartDate && simulateEndDate) {
          params.append("simulateStartDate", simulateStartDate.toISOString());
          params.append("simulateEndDate", simulateEndDate.toISOString());
          params.append("simulateWorkingDays", simulateWorkingDays.toString());
        }

        const response = await fetch(`/api/balance/projection?${params}`);
        if (response.ok) {
          const data = await response.json();
          setProjection(data);
        }
      } catch (error) {
        console.error("Error fetching balance projection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjection();
  }, [selectedType, showSimulator, simulateStartDate, simulateEndDate, simulateWorkingDays]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance Projection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!projection) {
    return null;
  }

  const leaveTypeLabels: Record<LeaveType, string> = {
    EARNED: "Earned",
    CASUAL: "Casual",
    MEDICAL: "Medical",
    MATERNITY: "Maternity",
    PATERNITY: "Paternity",
    STUDY: "Study",
    SPECIAL: "Special",
    SPECIAL_DISABILITY: "Special Disability",
    QUARANTINE: "Quarantine",
    EXTRAWITHPAY: "Extra With Pay",
    EXTRAWITHOUTPAY: "Extra Without Pay",
  };

  // Get projection months that show changes
  const significantMonths = projection.projections.filter(
    (p) => p.accrued > 0 || p.used > 0 || p.planned > 0 || p.expiring > 0
  );

  // Calculate peak and lowest balance from projections
  const peakBalance = projection.projections.length > 0
    ? Math.max(...projection.projections.map(p => p.projected), projection.currentBalance)
    : projection.currentBalance;

  const lowestBalance = projection.projections.length > 0
    ? Math.min(...projection.projections.map(p => p.projected), projection.currentBalance)
    : projection.currentBalance;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Balance Projection
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Learn about balance projections"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">
                  Shows your projected leave balance over the next 12 months,
                  including accruals and planned usage.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showSimulator ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowSimulator(!showSimulator)}
              className="h-7 text-xs"
            >
              {showSimulator ? "Hide Simulator" : "What-if Simulator"}
            </Button>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as LeaveType)}
              className="text-xs border border-border rounded px-2 py-1 bg-background"
            >
              {Object.entries(leaveTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulator Controls */}
        {showSimulator && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Simulate a future leave:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">Start Date</label>
                <input
                  type="date"
                  className="w-full text-xs p-1 border rounded bg-background"
                  onChange={(e) => setSimulateStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">End Date</label>
                <input
                  type="date"
                  className="w-full text-xs p-1 border rounded bg-background"
                  onChange={(e) => setSimulateEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground">Working Days</label>
              <input
                type="number"
                min="1"
                value={simulateWorkingDays}
                onChange={(e) => setSimulateWorkingDays(parseInt(e.target.value) || 1)}
                className="w-full text-xs p-1 border rounded bg-background"
              />
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">
              {projection.currentBalance.toFixed(1)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Peak (12mo)</p>
            <p className="text-lg font-semibold text-green-600">
              {peakBalance.toFixed(1)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Lowest (12mo)</p>
            <p className="text-lg font-semibold text-orange-600">
              {lowestBalance.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {projection.warnings.length > 0 && (
          <div className="space-y-2">
            {projection.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
              >
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                    {warning.type === "expiry"
                      ? "Balance Expiry"
                      : warning.type === "deficit"
                        ? "Deficit Warning"
                        : "Low Balance"}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {warning.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Changes */}
        {significantMonths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Next 3 Months
            </p>
            {significantMonths.slice(0, 3).map((month, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
              >
                <span className="font-medium">
                  {new Date(month.month).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {month.accrued > 0 && (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />+{month.accrued.toFixed(1)}
                    </span>
                  )}
                  <span className="font-semibold">
                    {month.projected.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {projection.recommendations.length > 0 && (
          <div className="space-y-1 p-3 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Recommendations
            </p>
            {projection.recommendations.slice(0, 2).map((rec, idx) => (
              <p
                key={idx}
                className="text-xs text-blue-700 dark:text-blue-300"
              >
                • {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
