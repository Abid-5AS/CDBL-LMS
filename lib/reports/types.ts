/**
 * Report Types and Interfaces
 * Comprehensive type system for scheduled reports
 */

import type { ReportType, ReportFormat, ReportFrequency, ExecutionStatus } from '@prisma/client';

/**
 * Report Filter Options
 */
export interface ReportFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  department?: string;
  leaveType?: string;
  employeeId?: number;
  status?: string;
  includeInactive?: boolean;
}

/**
 * Report Configuration
 */
export interface ReportConfig {
  id?: number;
  name: string;
  reportType: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  recipients: string[]; // Email addresses
  filters?: ReportFilters;
  scheduleTime?: string; // "HH:MM" format or cron expression
  scheduleDay?: number; // Day of month (1-31) or day of week (1-7)
  isActive?: boolean;
}

/**
 * Report Generation Context
 */
export interface ReportContext {
  reportId: number;
  executionId: number;
  config: ReportConfig;
  generatedAt: Date;
  generatedBy?: string;
}

/**
 * Report Data Structure
 */
export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  period?: {
    start: Date;
    end: Date;
  };
  filters?: ReportFilters;
  sections: ReportSection[];
  summary?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Report Section (for structured reports)
 */
export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text' | 'metrics' | 'list';
  data: any;
  description?: string;
}

/**
 * Table Report Section
 */
export interface TableSection extends ReportSection {
  type: 'table';
  data: {
    headers: string[];
    rows: any[][];
    totals?: any[];
  };
}

/**
 * Metrics Report Section
 */
export interface MetricsSection extends ReportSection {
  type: 'metrics';
  data: {
    label: string;
    value: string | number;
    change?: {
      value: number;
      direction: 'up' | 'down' | 'stable';
    };
    icon?: string;
  }[];
}

/**
 * Report Generation Result
 */
export interface ReportGenerationResult {
  success: boolean;
  executionId: number;
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  duration: number; // milliseconds
}

/**
 * Email Delivery Result
 */
export interface EmailDeliveryResult {
  success: boolean;
  sentTo: string[];
  failedTo: string[];
  errors: string[];
}

/**
 * Scheduled Report Summary (for list display)
 */
export interface ScheduledReportSummary {
  id: number;
  name: string;
  reportType: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: {
    id: number;
    name: string;
  };
  lastExecution?: {
    status: ExecutionStatus;
    completedAt?: Date;
    recordCount?: number;
  };
}

/**
 * Report Execution Summary (for history display)
 */
export interface ReportExecutionSummary {
  id: number;
  reportId: number;
  reportName: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  errorLog?: string;
  duration?: number; // milliseconds
}

/**
 * Report Generator Interface
 * All report generators must implement this interface
 */
export interface IReportGenerator {
  /**
   * Report type this generator handles
   */
  readonly reportType: ReportType;

  /**
   * Generate report data
   */
  generate(filters: ReportFilters, context: ReportContext): Promise<ReportData>;

  /**
   * Validate filters for this report type
   */
  validateFilters(filters: ReportFilters): boolean;

  /**
   * Get default filters for this report type
   */
  getDefaultFilters(): ReportFilters;
}

/**
 * Report Formatter Interface
 * Formats report data into specific output formats
 */
export interface IReportFormatter {
  /**
   * Format type this formatter handles
   */
  readonly format: ReportFormat;

  /**
   * Format report data to file
   */
  format(data: ReportData, outputPath: string): Promise<string>;

  /**
   * Get file extension for this format
   */
  getFileExtension(): string;

  /**
   * Get MIME type for this format
   */
  getMimeType(): string;
}

/**
 * Report Scheduler Interface
 */
export interface IReportScheduler {
  /**
   * Schedule a report
   */
  schedule(reportId: number): Promise<void>;

  /**
   * Unschedule a report
   */
  unschedule(reportId: number): Promise<void>;

  /**
   * Trigger immediate execution
   */
  executeNow(reportId: number): Promise<ReportGenerationResult>;

  /**
   * Get next scheduled run time
   */
  getNextRunTime(frequency: ReportFrequency, scheduleTime?: string, scheduleDay?: number): Date;
}

/**
 * Leave Summary Report Data
 */
export interface LeaveSummaryData {
  period: { start: Date; end: Date };
  totalLeaves: number;
  totalDays: number;
  byType: {
    type: string;
    count: number;
    days: number;
  }[];
  byDepartment: {
    department: string;
    count: number;
    days: number;
  }[];
  byStatus: {
    status: string;
    count: number;
  }[];
  trends: {
    month: string;
    count: number;
    days: number;
  }[];
}

/**
 * Leave Balance Report Data
 */
export interface LeaveBalanceData {
  asOfDate: Date;
  employees: {
    empCode: string;
    name: string;
    department: string;
    balances: {
      type: string;
      opening: number;
      accrued: number;
      used: number;
      closing: number;
      utilizationPercent: number;
    }[];
  }[];
  summary: {
    totalEmployees: number;
    totalAllocated: number;
    totalUsed: number;
    totalRemaining: number;
    averageUtilization: number;
  };
}

/**
 * Approval Times Report Data
 */
export interface ApprovalTimesData {
  period: { start: Date; end: Date };
  overall: {
    averageHours: number;
    medianHours: number;
    fastest: number;
    slowest: number;
  };
  byDepartment: {
    department: string;
    averageHours: number;
    count: number;
  }[];
  byApprover: {
    approverName: string;
    averageHours: number;
    count: number;
  }[];
  distribution: {
    range: string; // "0-24h", "24-48h", etc.
    count: number;
    percentage: number;
  }[];
}
