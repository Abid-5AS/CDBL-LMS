/**
 * Chart Adapters
 * Convert various data formats to TrendPoint[] and Slice[] for charts
 */

import type { TrendPoint } from "./TrendChart";
import type { Slice } from "./TypePie";

// Month abbreviations
const MONTH_ABBREV = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Adapter: fromReportsSummary
 * Converts reports summary data to TrendPoint[] and Slice[]
 */
export function fromReportsSummary(summary: {
  monthlyTrend?: Array<{ month: string; leaves: number }>;
  typeDistribution?: Array<{ name: string; value: number }>;
}): {
  trend: TrendPoint[];
  slices: Slice[];
} {
  const trend: TrendPoint[] =
    summary.monthlyTrend?.map((item) => ({
      month: item.month,
      approved: item.leaves || 0,
    })) || [];

  const slices: Slice[] =
    summary.typeDistribution
      ?.filter((item) => {
        // Match by name (could be "Earned Leave", "Casual Leave", etc.) or type code
        const nameUpper = item.name.toUpperCase();
        return (
          nameUpper.includes("CASUAL") ||
          nameUpper.includes("EARNED") ||
          nameUpper.includes("MEDICAL")
        );
      })
      .map((item) => {
        // Map name to type
        const nameUpper = item.name.toUpperCase();
        let type: Slice["type"] = "CASUAL";
        if (nameUpper.includes("EARNED")) type = "EARNED";
        else if (nameUpper.includes("MEDICAL") || nameUpper.includes("SICK")) type = "MEDICAL";
        return {
          type,
          value: item.value,
        };
      })
      .reduce((acc, slice) => {
        // Combine duplicates
        const existing = acc.find((s) => s.type === slice.type);
        if (existing) {
          existing.value += slice.value;
        } else {
          acc.push(slice);
        }
        return acc;
      }, [] as Slice[]) || [];

  return { trend, slices };
}

/**
 * Adapter: fromDashboardAgg
 * Converts dashboard aggregation data to TrendPoint[] and Slice[]
 */
export function fromDashboardAgg(agg: {
  monthlyTrend?: Array<{ month: string; approved: number; pending?: number }>;
  typeDistribution?: Array<{ type: string; count: number }>;
}): {
  trend: TrendPoint[];
  slices: Slice[];
} {
  const trend: TrendPoint[] =
    agg.monthlyTrend?.map((item) => ({
      month: item.month,
      approved: item.approved,
      pending: item.pending,
    })) || [];

  const slices: Slice[] =
    agg.typeDistribution
      ?.filter((item) => ["CASUAL", "EARNED", "MEDICAL"].includes(item.type))
      .map((item) => ({
        type: item.type as Slice["type"],
        value: item.count,
      })) || [];

  return { trend, slices };
}

/**
 * Fallback: compute by grouping history
 * Computes charts from leave history if summaries absent
 */
export function computeFromHistory(
  leaves: Array<{
    type: string;
    workingDays: number;
    status: string;
    startDate: string;
  }>,
  year?: number
): {
  trend: TrendPoint[];
  slices: Slice[];
} {
  const currentYear = year ?? new Date().getFullYear();

  // Initialize trend data for all months
  const trendMap = new Map<string, { approved: number; pending: number }>();
  MONTH_ABBREV.forEach((month) => {
    trendMap.set(month, { approved: 0, pending: 0 });
  });

  // Initialize slice data
  const sliceMap = new Map<Slice["type"], number>();
  (["CASUAL", "EARNED", "MEDICAL"] as Slice["type"][]).forEach((type) => {
    sliceMap.set(type, 0);
  });

  // Process leaves
  leaves.forEach((leave) => {
    const leaveYear = new Date(leave.startDate).getFullYear();
    if (leaveYear !== currentYear) return;

    const monthIndex = new Date(leave.startDate).getMonth();
    const month = MONTH_ABBREV[monthIndex];

    // Update trend
    if (leave.status === "APPROVED") {
      const current = trendMap.get(month) || { approved: 0, pending: 0 };
      current.approved += leave.workingDays || 0;
      trendMap.set(month, current);
    } else if (leave.status === "PENDING" || leave.status === "SUBMITTED") {
      const current = trendMap.get(month) || { approved: 0, pending: 0 };
      current.pending += leave.workingDays || 0;
      trendMap.set(month, current);
    }

    // Update slices
    if (
      (leave.status === "APPROVED" || leave.status === "PENDING") &&
      ["CASUAL", "EARNED", "MEDICAL"].includes(leave.type)
    ) {
      const type = leave.type as Slice["type"];
      const current = sliceMap.get(type) || 0;
      sliceMap.set(type, current + (leave.workingDays || 0));
    }
  });

  const trend: TrendPoint[] = MONTH_ABBREV.map((month) => {
    const data = trendMap.get(month) || { approved: 0, pending: 0 };
    return {
      month,
      approved: data.approved,
      pending: data.pending,
    };
  });

  const slices: Slice[] = Array.from(sliceMap.entries()).map(([type, value]) => ({
    type,
    value,
  }));

  return { trend, slices };
}

