import { describe, it, expect } from "vitest";
import {
  policy,
  daysInclusive,
  needsMedicalCertificate,
  canBackdate,
  withinBackdateLimit,
  makeWarnings,
  elNoticeWarning,
  clNoticeWarning,
} from "@/lib/policy";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("lib/policy", () => {
  describe("policy constants", () => {
    it("should have correct EL_PER_YEAR", () => {
      expect(policy.accrual.EL_PER_YEAR).toBe(24);
    });

    it("should have correct elMinNoticeDays", () => {
      expect(policy.elMinNoticeDays).toBe(5);
    });

    it("should have correct elAccrualPerMonth", () => {
      expect(policy.elAccrualPerMonth).toBe(2);
    });

    it("should have correct carry forward cap", () => {
      expect(policy.carryForwardCap.EL).toBe(60);
    });

    it("should have correct CL max consecutive days", () => {
      expect(policy.clMaxConsecutiveDays).toBe(3);
    });

    it("should have policy version v2.0", () => {
      expect(policy.version).toBe("v2.0");
    });
  });

  describe("daysInclusive()", () => {
    it("should calculate days correctly for same date", () => {
      const date = new Date("2024-01-15");
      expect(daysInclusive(date, date)).toBe(1);
    });

    it("should calculate days correctly for range", () => {
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-17");
      expect(daysInclusive(start, end)).toBe(3);
    });
  });

  describe("needsMedicalCertificate()", () => {
    it("should return true for MEDICAL > 3 days", () => {
      expect(needsMedicalCertificate("MEDICAL", 4)).toBe(true);
      expect(needsMedicalCertificate("MEDICAL", 10)).toBe(true);
    });

    it("should return false for MEDICAL <= 3 days", () => {
      expect(needsMedicalCertificate("MEDICAL", 3)).toBe(false);
      expect(needsMedicalCertificate("MEDICAL", 1)).toBe(false);
    });

    it("should return false for non-medical leave types", () => {
      expect(needsMedicalCertificate("EARNED", 10)).toBe(false);
      expect(needsMedicalCertificate("CASUAL", 10)).toBe(false);
    });
  });

  describe("canBackdate()", () => {
    it("should allow backdate for EL and ML", () => {
      expect(canBackdate("EARNED")).toBe(true);
      expect(canBackdate("MEDICAL")).toBe(true);
    });

    it("should disallow backdate for CL", () => {
      expect(canBackdate("CASUAL")).toBe(false);
    });
  });

  describe("withinBackdateLimit()", () => {
    const today = normalizeToDhakaMidnight(new Date("2024-01-15"));
    
    it("should allow backdate within 30 days for EL", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-01")); // 14 days ago
      expect(withinBackdateLimit("EARNED", today, start)).toBe(true);
    });

    it("should reject backdate beyond 30 days for EL", () => {
      const start = normalizeToDhakaMidnight(new Date("2023-12-01")); // > 30 days ago
      expect(withinBackdateLimit("EARNED", today, start)).toBe(false);
    });

    it("should reject CL backdate", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-10")); // 5 days ago
      expect(withinBackdateLimit("CASUAL", today, start)).toBe(false);
    });

    it("should allow future dates", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-20")); // 5 days in future
      expect(withinBackdateLimit("EARNED", today, start)).toBe(true);
    });
  });

  describe("elNoticeWarning()", () => {
    const applyDate = normalizeToDhakaMidnight(new Date("2024-01-01"));
    
    it("should warn if less than 5 days notice", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-03")); // 2 days later
      expect(elNoticeWarning(applyDate, start)).toBe(true);
    });

    it("should not warn if >= 5 days notice", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-10")); // 9 days later
      expect(elNoticeWarning(applyDate, start)).toBe(false);
    });
  });

  describe("clNoticeWarning()", () => {
    const applyDate = normalizeToDhakaMidnight(new Date("2024-01-01"));
    
    it("should warn if less than 5 days notice", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-03")); // 2 days later
      expect(clNoticeWarning(applyDate, start)).toBe(true);
    });

    it("should not warn if >= 5 days notice", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-10")); // 9 days later
      expect(clNoticeWarning(applyDate, start)).toBe(false);
    });
  });

  describe("makeWarnings()", () => {
    const applyDate = normalizeToDhakaMidnight(new Date("2024-01-01"));
    
    it("should create CL short notice warning", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-03"));
      const warnings = makeWarnings("CASUAL", applyDate, start);
      expect(warnings.clShortNotice).toBe(true);
    });

    it("should create EL insufficient notice warning", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-03"));
      const warnings = makeWarnings("EARNED", applyDate, start);
      expect(warnings.elInsufficientNotice).toBe(true);
    });

    it("should not create warnings for sufficient notice", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-10"));
      const warnings = makeWarnings("EARNED", applyDate, start);
      expect(warnings.elInsufficientNotice).toBeUndefined();
    });
  });
});

