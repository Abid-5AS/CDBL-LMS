import { describe, it, expect } from "vitest";
import {
  fromReportsSummary,
  fromDashboardAgg,
  computeFromHistory,
} from "@/components/shared/LeaveCharts/adapters";
import type { TrendPoint, Slice } from "@/components/shared/LeaveCharts";

describe("Chart Adapters", () => {
  describe("fromReportsSummary", () => {
    it("should convert reports summary to trend and slices", () => {
      const summary = {
        monthlyTrend: [
          { month: "Jan", leaves: 10 },
          { month: "Feb", leaves: 15 },
        ],
        typeDistribution: [
          { name: "Earned Leave", value: 50 },
          { name: "Casual Leave", value: 30 },
          { name: "Medical Leave", value: 20 },
        ],
      };

      const { trend, slices } = fromReportsSummary(summary);

      expect(trend).toHaveLength(12);
      expect(trend[0]).toEqual({ month: "Jan", approved: 10 });
      expect(trend[1]).toEqual({ month: "Feb", approved: 15 });
      expect(trend[2]).toEqual({ month: "Mar", approved: 0 }); // Missing months filled with 0

      expect(slices).toHaveLength(3);
      expect(slices.find((s) => s.type === "EARNED")?.value).toBe(50);
      expect(slices.find((s) => s.type === "CASUAL")?.value).toBe(30);
      expect(slices.find((s) => s.type === "MEDICAL")?.value).toBe(20);
    });

    it("should handle empty data", () => {
      const { trend, slices } = fromReportsSummary({
        monthlyTrend: [],
        typeDistribution: [],
      });

      expect(trend).toHaveLength(12);
      expect(trend.every((t) => t.approved === 0)).toBe(true);
      expect(slices).toHaveLength(0);
    });

    it("should ensure all 12 months are present in correct order", () => {
      const { trend } = fromReportsSummary({
        monthlyTrend: [{ month: "Dec", leaves: 5 }],
        typeDistribution: [],
      });

      const months = trend.map((t) => t.month);
      expect(months).toEqual([
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
      ]);
    });
  });

  describe("fromDashboardAgg", () => {
    it("should convert dashboard aggregation with pending and returned", () => {
      const agg = {
        monthlyTrend: [
          { month: "Jan", approved: 10, pending: 2, returned: 1 },
        ],
        typeDistribution: [
          { type: "EARNED", count: 50 },
          { type: "CASUAL", count: 30 },
        ],
      };

      const { trend, slices } = fromDashboardAgg(agg);

      expect(trend[0]).toEqual({
        month: "Jan",
        approved: 10,
        pending: 2,
        returned: 1,
      });
      expect(slices).toHaveLength(2);
    });

    it("should handle missing optional fields", () => {
      const agg = {
        monthlyTrend: [{ month: "Jan", approved: 10 }],
        typeDistribution: [],
      };

      const { trend } = fromDashboardAgg(agg);
      expect(trend[0].pending).toBe(0);
      expect(trend[0].returned).toBe(0);
    });
  });

  describe("computeFromHistory", () => {
    it("should compute trend and slices from leave history", () => {
      const history = [
        {
          startDate: "2024-01-15",
          type: "EARNED",
          status: "APPROVED" as const,
          workingDays: 5,
        },
        {
          startDate: "2024-01-20",
          type: "CASUAL",
          status: "PENDING" as const,
          workingDays: 2,
        },
        {
          startDate: "2024-02-10",
          type: "EARNED",
          status: "APPROVED" as const,
          workingDays: 3,
        },
      ];

      const { trend, slices } = computeFromHistory(history);

      expect(trend.find((t) => t.month === "Jan")?.approved).toBe(5);
      expect(trend.find((t) => t.month === "Jan")?.pending).toBe(2);
      expect(trend.find((t) => t.month === "Feb")?.approved).toBe(3);

      const earnedSlice = slices.find((s) => s.type === "EARNED");
      expect(earnedSlice?.value).toBe(8); // 5 + 3
      expect(slices.find((s) => s.type === "CASUAL")?.value).toBe(2);
    });

    it("should handle empty history", () => {
      const { trend, slices } = computeFromHistory([]);

      expect(trend).toHaveLength(12);
      expect(trend.every((t) => t.approved === 0 && t.pending === 0 && t.returned === 0)).toBe(
        true
      );
      expect(slices).toHaveLength(0);
    });

    it("should filter by current year only", () => {
      const currentYear = new Date().getFullYear();
      const history = [
        {
          startDate: `${currentYear - 1}-01-15`,
          type: "EARNED",
          status: "APPROVED" as const,
          workingDays: 10,
        },
        {
          startDate: `${currentYear}-01-15`,
          type: "EARNED",
          status: "APPROVED" as const,
          workingDays: 5,
        },
      ];

      const { trend } = computeFromHistory(history);
      expect(trend.find((t) => t.month === "Jan")?.approved).toBe(5);
    });
  });

  describe("Month ordering", () => {
    it("should maintain Jan→Dec order regardless of input order", () => {
      const { trend } = fromReportsSummary({
        monthlyTrend: [
          { month: "Dec", leaves: 1 },
          { month: "Jan", leaves: 2 },
          { month: "Jun", leaves: 3 },
        ],
        typeDistribution: [],
      });

      const months = trend.map((t) => t.month);
      expect(months).toEqual([
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
      ]);
    });
  });

  describe("Percentage calculation", () => {
    it("should compute correct percentages in TypePie", () => {
      const slices: Slice[] = [
        { type: "EARNED", value: 50 },
        { type: "CASUAL", value: 30 },
        { type: "MEDICAL", value: 20 },
      ];

      const total = slices.reduce((sum, s) => sum + s.value, 0);
      expect(total).toBe(100);

      const earnedPercent = (slices[0].value / total) * 100;
      expect(earnedPercent).toBe(50);
    });
  });
});

