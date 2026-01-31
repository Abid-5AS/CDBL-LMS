/**
 * Report Generator Registry
 * Central registry for all report generators
 */

import type { ReportType } from '@prisma/client';
import type { IReportGenerator } from '../types';
import { LeaveSummaryGenerator } from './leave-summary';
import { LeaveBalanceGenerator } from './leave-balance';
import { ApprovalTimesGenerator } from './approval-times';

/**
 * Registry of all report generators
 */
const generators = new Map<ReportType, IReportGenerator>();

// Register all generators
generators.set('LEAVE_SUMMARY', new LeaveSummaryGenerator());
generators.set('LEAVE_BALANCE', new LeaveBalanceGenerator());
generators.set('APPROVAL_TIMES', new ApprovalTimesGenerator());

/**
 * Get generator for a specific report type
 */
export function getGenerator(reportType: ReportType): IReportGenerator {
  const generator = generators.get(reportType);

  if (!generator) {
    throw new Error(`No generator found for report type: ${reportType}`);
  }

  return generator;
}

/**
 * Get all available report types
 */
export function getAvailableReportTypes(): ReportType[] {
  return Array.from(generators.keys());
}

/**
 * Check if a report type has a generator
 */
export function hasGenerator(reportType: ReportType): boolean {
  return generators.has(reportType);
}

// Export all generators
export { LeaveSummaryGenerator, LeaveBalanceGenerator, ApprovalTimesGenerator };
