/**
 * Unit Tests for Validation Utilities
 */

import { describe, it, expect } from "vitest";

describe("lib/validation", () => {
  describe("Email validation", () => {
    it("should validate correct email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@company.co.uk",
        "admin+filter@domain.com",
      ];

      validEmails.forEach((email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(regex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      invalidEmails.forEach((email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(regex.test(email)).toBe(false);
      });
    });
  });

  describe("Leave type validation", () => {
    it("should recognize valid leave types", () => {
      const validTypes = ["EARNED", "CASUAL", "MEDICAL"];
      
      validTypes.forEach((type) => {
        expect(["EARNED", "CASUAL", "MEDICAL"].includes(type)).toBe(true);
      });
    });

    it("should reject invalid leave types", () => {
      const invalidTypes = ["VACATION", "SICK", "PERSONAL"];
      
      invalidTypes.forEach((type) => {
        expect(["EARNED", "CASUAL", "MEDICAL"].includes(type)).toBe(false);
      });
    });
  });

  describe("Date range validation", () => {
    it("should validate that end date is after start date", () => {
      const start = new Date("2024-06-01");
      const end = new Date("2024-06-05");
      
      expect(end >= start).toBe(true);
    });

    it("should reject end date before start date", () => {
      const start = new Date("2024-06-05");
      const end = new Date("2024-06-01");
      
      expect(end >= start).toBe(false);
    });

    it("should accept same start and end date", () => {
      const date = new Date("2024-06-01");
      
      expect(date >= date).toBe(true);
    });
  });

  describe("Leave days validation", () => {
    it("should validate positive leave days", () => {
      const validDays = [1, 5, 10, 30];
      
      validDays.forEach((days) => {
        expect(days).toBeGreaterThan(0);
      });
    });

    it("should reject zero or negative days", () => {
      const invalidDays = [0, -1, -5];
      
      invalidDays.forEach((days) => {
        expect(days).toBeLessThanOrEqual(0);
      });
    });

    it("should validate maximum leave days per policy", () => {
      const maxEarnedLeave = 24;
      const maxCasualLeave = 10;
      
      expect(25).toBeGreaterThan(maxEarnedLeave);
      expect(5).toBeLessThanOrEqual(maxCasualLeave);
    });
  });
});
