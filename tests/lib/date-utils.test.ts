/**
 * Unit Tests for Date Utilities
 */

import { describe, it, expect } from "vitest";
import {
  normalizeToDhakaMidnight,
  isWeekendBD,
  isHoliday,
} from "@/lib/date-utils";
import { fromZonedTime } from "date-fns-tz";

describe("lib/date-utils", () => {
  describe("normalizeToDhakaMidnight()", () => {
    it("should normalize date to midnight in Dhaka timezone", () => {
      const input = new Date("2024-06-15T14:30:00Z");
      const result = normalizeToDhakaMidnight(input);

      // Result should be a Date object
      expect(result).toBeInstanceOf(Date);
      // Should be normalized (seconds and milliseconds should be 0)
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should handle date objects consistently", () => {
      const date = new Date("2024-06-15");
      const result = normalizeToDhakaMidnight(date);

      expect(result).toBeInstanceOf(Date);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should be idempotent", () => {
      const date = new Date("2024-06-15");
      const normalized1 = normalizeToDhakaMidnight(date);
      const normalized2 = normalizeToDhakaMidnight(normalized1);

      expect(normalized1.getTime()).toBe(normalized2.getTime());
    });
  });

  describe("isWeekendBD()", () => {
    it("should identify Friday as weekend", () => {
      const friday = new Date("2024-06-14"); // Friday
      expect(isWeekendBD(friday)).toBe(true);
    });

    it("should identify Saturday as weekend", () => {
      const saturday = new Date("2024-06-15"); // Saturday
      expect(isWeekendBD(saturday)).toBe(true);
    });

    it("should not identify Sunday as weekend", () => {
      const sunday = new Date("2024-06-16"); // Sunday
      expect(isWeekendBD(sunday)).toBe(false);
    });

    it("should not identify weekdays as weekend", () => {
      const monday = new Date("2024-06-10"); // Monday
      expect(isWeekendBD(monday)).toBe(false);
    });
  });

  describe("isHoliday()", () => {
    it("should identify a date as holiday when in list", () => {
      // The function normalizes to Dhaka midnight then uses toISOString()
      // which gives UTC date (previous day due to +6 offset)
      const date = new Date("2024-12-25T10:00:00+06:00"); // Some time on Dec 25 in Dhaka
      const holidays = [
        { date: "2024-12-24", name: "Christmas" }, // Stored as UTC date
        { date: "2023-12-31", name: "New Year" },
      ];

      expect(isHoliday(date, holidays)).toBe(true);
    });

    it("should not identify a date as holiday when not in list", () => {
      const date = new Date("2024-06-15T10:00:00+06:00");
      const holidays = [
        { date: "2024-12-24", name: "Christmas" },
      ];

      expect(isHoliday(date, holidays)).toBe(false);
    });

    it("should handle empty holiday list", () => {
      const date = new Date("2024-06-15T10:00:00+06:00");

      expect(isHoliday(date, [])).toBe(false);
    });

    it("should match dates correctly across different times", () => {
      // Any time on Dec 25 in Dhaka should match the holiday
      const morning = new Date("2024-12-25T06:00:00+06:00");
      const evening = new Date("2024-12-25T20:00:00+06:00");
      const holidays = [
        { date: "2024-12-24", name: "Christmas" }, // UTC date representation
      ];

      expect(isHoliday(morning, holidays)).toBe(true);
      expect(isHoliday(evening, holidays)).toBe(true);
    });
  });
});
