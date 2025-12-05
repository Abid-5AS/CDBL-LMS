import { describe, it, expect } from 'vitest';
import { policy } from '@/lib/policy';

describe('Accrual Logic', () => {
  describe('Configuration', () => {
    it('should have correct accrual rates', () => {
      expect(policy.accrual.EL_PER_YEAR).toBe(24);
      expect(policy.accrual.CL_PER_YEAR).toBe(10);
      expect(policy.accrual.ML_PER_YEAR).toBe(14);
    });

    it('should have correct monthly accrual for EL', () => {
      expect(policy.elAccrualPerMonth).toBe(2);
    });

    it('should have correct carry forward caps', () => {
      expect(policy.carryForwardCap.EL).toBe(60);
    });
  });

  describe('Accrual Calculation', () => {
    it('should calculate yearly EL accrual correctly', () => {
      const months = 12;
      const accrued = months * policy.elAccrualPerMonth;
      expect(accrued).toBe(policy.accrual.EL_PER_YEAR);
    });

    it('should calculate partial year accrual correctly', () => {
      const months = 6;
      const accrued = months * policy.elAccrualPerMonth;
      expect(accrued).toBe(12);
    });
  });
});
