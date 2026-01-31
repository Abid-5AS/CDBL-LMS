import { describe, it, expect } from 'vitest';
import {
  daysInclusive,
  needsMedicalCertificate,
  canBackdate,
  withinBackdateLimit,
  elNoticeWarning,
  checkLeaveEligibility,
  calculateMaternityLeaveDays,
  validateQuarantineLeaveDuration,
  validateSpecialDisabilityDuration,
  validateExtraordinaryLeaveDuration,
  checkMedicalLeaveAnnualLimit,
  validateELEncashment,
  validateStudyLeaveDuration,
  validateStudyLeaveRetirement,
  calculateSpecialDisabilityPay,
  validateSpecialDisabilityIncidentDate,
  policy
} from '@/lib/policy';

describe('Policy Engine', () => {
  describe('daysInclusive', () => {
    it('should calculate days correctly', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-03');
      expect(daysInclusive(start, end)).toBe(3);
    });

    it('should return 1 for same day', () => {
      const date = new Date('2025-01-01');
      expect(daysInclusive(date, date)).toBe(1);
    });
  });

  describe('needsMedicalCertificate', () => {
    it('should require certificate for MEDICAL leave > 3 days', () => {
      expect(needsMedicalCertificate('MEDICAL', 4)).toBe(true);
    });

    it('should not require certificate for MEDICAL leave <= 3 days', () => {
      expect(needsMedicalCertificate('MEDICAL', 3)).toBe(false);
    });

    it('should not require certificate for other leave types', () => {
      expect(needsMedicalCertificate('EARNED', 5)).toBe(false);
    });
  });

  describe('canBackdate', () => {
    it('should allow backdating for EL and MEDICAL', () => {
      expect(canBackdate('EARNED')).toBe(true);
      expect(canBackdate('MEDICAL')).toBe(true);
    });

    it('should not allow backdating for CL', () => {
      expect(canBackdate('CASUAL')).toBe(false);
    });
  });

  describe('withinBackdateLimit', () => {
    it('should allow backdating within limit for EL', () => {
      const applyDate = new Date('2025-02-01');
      const start = new Date('2025-01-15'); // 17 days ago
      expect(withinBackdateLimit('EARNED', applyDate, start)).toBe(true);
    });

    it('should reject backdating beyond limit for EL', () => {
      const applyDate = new Date('2025-03-01');
      const start = new Date('2025-01-01'); // ~60 days ago
      expect(withinBackdateLimit('EARNED', applyDate, start)).toBe(false);
    });
  });

  describe('elNoticeWarning', () => {
    it('should warn if notice is less than 5 days for EL', () => {
      const applyDate = new Date('2025-01-01');
      const start = new Date('2025-01-03');
      expect(elNoticeWarning(applyDate, start)).toBe(true);
    });

    it('should not warn if notice is sufficient', () => {
      const applyDate = new Date('2025-01-01');
      const start = new Date('2025-01-10');
      expect(elNoticeWarning(applyDate, start)).toBe(false);
    });
  });

  describe('checkLeaveEligibility', () => {
    it('should allow EL after 1 year of service', () => {
      const joinDate = new Date();
      joinDate.setFullYear(joinDate.getFullYear() - 1.5);
      const result = checkLeaveEligibility('EARNED', joinDate);
      expect(result.eligible).toBe(true);
    });

    it('should reject EL before 1 year of service', () => {
      const joinDate = new Date();
      joinDate.setMonth(joinDate.getMonth() - 6);
      const result = checkLeaveEligibility('EARNED', joinDate);
      expect(result.eligible).toBe(false);
    });
  });

  describe('calculateMaternityLeaveDays', () => {
    it('should give full 56 days for > 6 months service', () => {
      const joinDate = new Date();
      joinDate.setMonth(joinDate.getMonth() - 7);
      const result = calculateMaternityLeaveDays(joinDate);
      expect(result.days).toBe(56);
      expect(result.isProrated).toBe(false);
    });

    it('should prorate for < 6 months service', () => {
      const joinDate = new Date();
      joinDate.setMonth(joinDate.getMonth() - 3);
      const result = calculateMaternityLeaveDays(joinDate);
      expect(result.days).toBeLessThan(56);
      expect(result.isProrated).toBe(true);
    });
  });

  describe('validateQuarantineLeaveDuration', () => {
    it('should allow up to 21 days without exceptional approval', () => {
      expect(validateQuarantineLeaveDuration(20).valid).toBe(true);
      expect(validateQuarantineLeaveDuration(20).requiresExceptionalApproval).toBe(false);
    });

    it('should require exceptional approval for 22-30 days', () => {
      const result = validateQuarantineLeaveDuration(25);
      expect(result.valid).toBe(true);
      expect(result.requiresExceptionalApproval).toBe(true);
    });

    it('should reject > 30 days', () => {
      expect(validateQuarantineLeaveDuration(31).valid).toBe(false);
    });
  });

  describe('checkMedicalLeaveAnnualLimit', () => {
    it('should allow if within annual limit', () => {
      const result = checkMedicalLeaveAnnualLimit(5, 5); // 10 total < 14
      expect(result.withinLimit).toBe(true);
    });

    it('should warn if exceeding annual limit', () => {
      const result = checkMedicalLeaveAnnualLimit(10, 5); // 15 total > 14
      expect(result.withinLimit).toBe(false);
      expect(result.exceedsDays).toBe(1);
    });
  });

  describe('validateELEncashment', () => {
    it('should allow encashment if balance > 10', () => {
      const result = validateELEncashment(15, 2);
      expect(result.valid).toBe(true);
      expect(result.remainingBalance).toBe(13);
    });

    it('should reject if balance <= 10', () => {
      const result = validateELEncashment(10, 1);
      expect(result.valid).toBe(false);
    });

    it('should reject if requested > max encashable', () => {
      const result = validateELEncashment(15, 6); // max 5
      expect(result.valid).toBe(false);
    });
  });
});
