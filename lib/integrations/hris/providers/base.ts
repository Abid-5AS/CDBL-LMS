import type { HRISProvider, HRISEmployee } from '../types';

/**
 * Base HRIS Provider
 * Abstract base class for all HRIS integrations
 */
export abstract class BaseHRISProvider implements HRISProvider {
  abstract name: string;

  /**
   * Fetch employees from HRIS
   */
  abstract sync(): Promise<HRISEmployee[]>;

  /**
   * Validate employee data
   */
  validate(data: HRISEmployee): boolean {
    // Basic validation
    if (!data.empCode || data.empCode.trim().length === 0) {
      return false;
    }
    if (!data.name || data.name.trim().length === 0) {
      return false;
    }
    if (!data.email || !this.isValidEmail(data.email)) {
      return false;
    }
    return true;
  }

  /**
   * Test connection to HRIS
   */
  abstract test(): Promise<boolean>;

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Normalize employee data
   */
  protected normalize(data: Partial<HRISEmployee>): HRISEmployee {
    return {
      empCode: (data.empCode || '').trim(),
      name: (data.name || '').trim(),
      email: (data.email || '').toLowerCase().trim(),
      department: data.department?.trim(),
      joinDate: data.joinDate,
      retirementDate: data.retirementDate,
      deptHeadEmpCode: data.deptHeadEmpCode?.trim(),
      status: data.status || 'active',
    };
  }
}
