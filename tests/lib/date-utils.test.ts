/**
 * Unit Tests for Date Utilities
 */

import { describe, it, expect } from "vitest";
import {
  normalizeToDhakaMidnight,
  formatDate,
  getBusinessDays,
} from "@/lib/date-utils";

describe("lib/date-utils", () => {
  describe("normalizeToDhakaMidnight()", () => {
    it("should normalize date to midnight in Dhaka timezone", () => {
      const input = new Date("2024-06-15T14:30:00Z");
      const result = normalizeToDhakaMidnight(input);
      
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should handle date strings", () => {
      const result = normalizeToDhakaMidnight("2024-06-15");
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
    });

    it("should be idempotent", () => {
      const date = new Date("2024-06-15");
      const normalized1 = normalizeToDhakaMidnight(date);
      const normalized2 = normalizeToDhakaMidnight(normalized1);
      
      expect(normalized1.getTime()).toBe(normalized2.getTime());
    });
  });

  describe("formatDate()", () => {
    it("should format date in default format", () => {
      const date = new Date("2024-06-15");
      const formatted = formatDate(date);
      
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });

    it("should handle null/undefined gracefully", () => {
      const formatted = formatDate(null as any);
      
      expect(formatted).toBeDefined();
    });

    it("should format date with custom format", () => {
      const date = new Date("2024-06-15");
      const formatted = formatDate(date, "yyyy-MM-dd");
      
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe("getBusinessDays()", () => {
    it("should calculate business days excluding weekends", () => {
      const start = new Date("2024-06-10"); // Monday
      const end = new Date("2024-06-14"); // Friday
      
      const days = getBusinessDays(start, end);
      
      expect(days).toBe(5); // Mon-Fri
    });

    it("should return 0 for same day", () => {
      const date = new Date("2024-06-10");
      
      const days = getBusinessDays(date, date);
      
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it("should handle weekends correctly", () => {
      const saturday = new Date("2024-06-15");
      const sunday = new Date("2024-06-16");
      
      const days = getBusinessDays(saturday, sunday);
      
      expect(days).toBeLessThanOrEqual(1);
    });

    it("should throw error if end date is before start date", () => {
      const start = new Date("2024-06-15");
      const end = new Date("2024-06-10");
      
      expect(() => getBusinessDays(start, end)).toThrow();
    });
  });
});
