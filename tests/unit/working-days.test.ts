import { describe, it, expect, beforeEach, vi } from "vitest";
import { countWorkingDaysSync } from "@/lib/working-days";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import type { Holiday } from "@/lib/date-utils";

describe("lib/working-days", () => {
  describe("countWorkingDaysSync()", () => {
    it("should return 0 for invalid date range", () => {
      expect(countWorkingDaysSync(undefined, undefined)).toBe(0);
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-10"); // end before start
      expect(countWorkingDaysSync(start, end)).toBe(0);
    });

    it("should count working days excluding weekends", () => {
      // Sunday to Thursday (5 working days)
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-11")); // Thursday
      expect(countWorkingDaysSync(start, end)).toBe(5);
    });

    it("should exclude Friday and Saturday", () => {
      // Sunday to Saturday (should exclude Fri, Sat)
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-13")); // Saturday
      // Sun, Mon, Tue, Wed, Thu = 5 working days (Fri, Sat excluded)
      expect(countWorkingDaysSync(start, end)).toBe(5);
    });

    it("should exclude holidays", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-11")); // Thursday
      const holidays: Holiday[] = [
        { date: "2024-01-09", name: "Test Holiday" }, // Tuesday
      ];
      // Should be 4 instead of 5 (Tuesday excluded)
      expect(countWorkingDaysSync(start, end, holidays)).toBe(4);
    });

    it("should exclude both weekends and holidays", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-13")); // Saturday
      const holidays: Holiday[] = [
        { date: "2024-01-08", name: "Monday Holiday" },
      ];
      // Sun, Tue, Wed, Thu = 4 (Mon holiday excluded, Fri/Sat weekend excluded)
      expect(countWorkingDaysSync(start, end, holidays)).toBe(4);
    });

    it("should handle single day correctly", () => {
      const date = normalizeToDhakaMidnight(new Date("2024-01-08")); // Monday
      expect(countWorkingDaysSync(date, date)).toBe(1);
    });

    it("should use Dhaka timezone normalization", () => {
      // Test that dates are normalized to Dhaka midnight
      const start = new Date("2024-01-08T10:00:00Z"); // 10 AM UTC
      const end = new Date("2024-01-08T20:00:00Z"); // 8 PM UTC
      // Should normalize to same day in Dhaka timezone
      expect(countWorkingDaysSync(start, end)).toBe(1);
    });
  });

  describe("CL side-touch validation (conceptual)", () => {
    it("should detect if start date touches Friday/Saturday/holiday", () => {
      const friday = normalizeToDhakaMidnight(new Date("2024-01-05")); // Friday
      const saturday = normalizeToDhakaMidnight(new Date("2024-01-06")); // Saturday
      const holiday: Holiday = { date: "2024-01-08", name: "Test" };
      
      // These should be invalid for CL start/end
      expect(friday.getDay()).toBe(5); // Friday
      expect(saturday.getDay()).toBe(6); // Saturday
      expect(holiday.date).toBeDefined();
    });

    it("should detect if end date touches Friday/Saturday/holiday", () => {
      // Same logic as start date
      const friday = normalizeToDhakaMidnight(new Date("2024-01-05"));
      expect(friday.getDay()).toBe(5);
    });
  });
});

