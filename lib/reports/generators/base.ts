/**
 * Base Report Generator
 * Abstract base class for all report generators
 */

import type {
  IReportGenerator,
  ReportFilters,
  ReportContext,
  ReportData,
} from '../types';
import type { ReportType } from '@prisma/client';

export abstract class BaseReportGenerator implements IReportGenerator {
  abstract readonly reportType: ReportType;

  /**
   * Generate report - must be implemented by subclasses
   */
  abstract generate(
    filters: ReportFilters,
    context: ReportContext
  ): Promise<ReportData>;

  /**
   * Validate filters - can be overridden
   */
  validateFilters(filters: ReportFilters): boolean {
    // Basic validation
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start > end) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get default filters - can be overridden
   */
  getDefaultFilters(): ReportFilters {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: firstDayOfMonth,
      endDate: lastDayOfMonth,
      includeInactive: false,
    };
  }

  /**
   * Format date for display
   */
  protected formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format date range for display
   */
  protected formatDateRange(start: Date, end: Date): string {
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  /**
   * Calculate percentage
   */
  protected calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 10) / 10;
  }

  /**
   * Parse date filter
   */
  protected parseDate(date: Date | string | undefined): Date | undefined {
    if (!date) return undefined;
    return typeof date === 'string' ? new Date(date) : date;
  }
}
