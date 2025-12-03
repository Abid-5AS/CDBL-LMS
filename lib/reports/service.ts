/**
 * Report Service
 * Main service for report generation and management
 */

import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';
import { getGenerator } from './generators';
import { getFormatter } from './formatters';
import type {
  ReportConfig,
  ReportContext,
  ReportGenerationResult,
  ReportFilters,
  ScheduledReportSummary,
  ReportExecutionSummary,
} from './types';
import type { ReportType, ReportFormat, ExecutionStatus } from '@prisma/client';

export class ReportService {
  private static readonly REPORTS_DIR = path.join(process.cwd(), 'reports');

  /**
   * Generate a report immediately
   */
  static async generateReport(
    reportId: number,
    userId?: number
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();

    try {
      // Fetch report configuration
      const report = await prisma.scheduledReport.findUnique({
        where: { id: reportId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }

      // Create execution record
      const execution = await prisma.reportExecution.create({
        data: {
          reportId,
          status: 'RUNNING',
        },
      });

      try {
        // Parse filters
        const filters: ReportFilters = (report.filters as any) || {};

        // Create context
        const context: ReportContext = {
          reportId: report.id,
          executionId: execution.id,
          config: {
            id: report.id,
            name: report.name,
            reportType: report.reportType,
            format: report.format,
            frequency: report.frequency,
            recipients: (report.recipients as any) as string[],
            filters,
            scheduleTime: report.scheduleTime || undefined,
            scheduleDay: report.scheduleDay || undefined,
            isActive: report.isActive,
          },
          generatedAt: new Date(),
          generatedBy: userId ? `User ${userId}` : report.creator.name,
        };

        // Generate report data
        const generator = getGenerator(report.reportType);
        const reportData = await generator.generate(filters, context);

        // Format report to file
        const formatter = getFormatter(report.format);
        const fileName = this.generateFileName(
          report.name,
          report.reportType,
          report.format
        );
        const outputPath = path.join(this.REPORTS_DIR, fileName);

        // Ensure reports directory exists
        await fs.mkdir(this.REPORTS_DIR, { recursive: true });

        // Generate file
        const filePath = await formatter.format(reportData, outputPath);

        // Get file stats
        const stats = await fs.stat(filePath);
        const recordCount = this.extractRecordCount(reportData);

        // Update execution record
        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            fileUrl: filePath,
            fileSize: stats.size,
            recordCount,
          },
        });

        // Update report last run time
        await prisma.scheduledReport.update({
          where: { id: reportId },
          data: {
            lastRunAt: new Date(),
          },
        });

        const duration = Date.now() - startTime;

        return {
          success: true,
          executionId: execution.id,
          filePath,
          fileSize: stats.size,
          recordCount,
          duration,
        };
      } catch (error) {
        // Update execution record with error
        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorLog: error instanceof Error ? error.message : String(error),
          },
        });

        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        executionId: 0,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(
    config: ReportConfig,
    userId: number
  ): Promise<number> {
    const report = await prisma.scheduledReport.create({
      data: {
        name: config.name,
        reportType: config.reportType,
        format: config.format,
        frequency: config.frequency,
        recipients: config.recipients as any,
        filters: (config.filters as any) || {},
        scheduleTime: config.scheduleTime,
        scheduleDay: config.scheduleDay,
        isActive: config.isActive ?? true,
        createdBy: userId,
        nextRunAt: this.calculateNextRunTime(
          config.frequency,
          config.scheduleTime,
          config.scheduleDay
        ),
      },
    });

    return report.id;
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    reportId: number,
    config: Partial<ReportConfig>
  ): Promise<void> {
    const updateData: any = {};

    if (config.name !== undefined) updateData.name = config.name;
    if (config.reportType !== undefined) updateData.reportType = config.reportType;
    if (config.format !== undefined) updateData.format = config.format;
    if (config.frequency !== undefined) updateData.frequency = config.frequency;
    if (config.recipients !== undefined) updateData.recipients = config.recipients;
    if (config.filters !== undefined) updateData.filters = config.filters;
    if (config.scheduleTime !== undefined) updateData.scheduleTime = config.scheduleTime;
    if (config.scheduleDay !== undefined) updateData.scheduleDay = config.scheduleDay;
    if (config.isActive !== undefined) updateData.isActive = config.isActive;

    // Recalculate next run time if schedule changed
    if (
      config.frequency !== undefined ||
      config.scheduleTime !== undefined ||
      config.scheduleDay !== undefined
    ) {
      const report = await prisma.scheduledReport.findUnique({
        where: { id: reportId },
      });

      if (report) {
        updateData.nextRunAt = this.calculateNextRunTime(
          config.frequency || report.frequency,
          config.scheduleTime !== undefined ? config.scheduleTime : report.scheduleTime,
          config.scheduleDay !== undefined ? config.scheduleDay : report.scheduleDay
        );
      }
    }

    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: updateData,
    });
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(reportId: number): Promise<void> {
    await prisma.scheduledReport.delete({
      where: { id: reportId },
    });
  }

  /**
   * Get all scheduled reports
   */
  static async getScheduledReports(
    filters?: {
      isActive?: boolean;
      reportType?: ReportType;
      createdBy?: number;
    }
  ): Promise<ScheduledReportSummary[]> {
    const reports = await prisma.scheduledReport.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.reportType && { reportType: filters.reportType }),
        ...(filters?.createdBy && { createdBy: filters.createdBy }),
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => ({
      id: report.id,
      name: report.name,
      reportType: report.reportType,
      format: report.format,
      frequency: report.frequency,
      isActive: report.isActive,
      lastRunAt: report.lastRunAt || undefined,
      nextRunAt: report.nextRunAt || undefined,
      createdBy: {
        id: report.creator.id,
        name: report.creator.name,
      },
      lastExecution: report.executions[0]
        ? {
          status: report.executions[0].status as ExecutionStatus,
          completedAt: report.executions[0].completedAt || undefined,
          recordCount: report.executions[0].recordCount || undefined,
        }
        : undefined,
    }));
  }

  /**
   * Get report execution history
   */
  static async getExecutionHistory(
    reportId: number,
    limit: number = 50
  ): Promise<ReportExecutionSummary[]> {
    const executions = await prisma.reportExecution.findMany({
      where: { reportId },
      include: {
        report: {
          select: { name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return executions.map((execution) => ({
      id: execution.id,
      reportId: execution.reportId,
      reportName: execution.report.name,
      status: execution.status as ExecutionStatus,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt || undefined,
      fileUrl: execution.fileUrl || undefined,
      fileSize: execution.fileSize || undefined,
      recordCount: execution.recordCount || undefined,
      errorLog: execution.errorLog || undefined,
      duration: execution.completedAt
        ? execution.completedAt.getTime() - execution.startedAt.getTime()
        : undefined,
    }));
  }

  /**
   * Calculate next run time based on frequency
   */
  private static calculateNextRunTime(
    frequency: string,
    scheduleTime?: string | null,
    scheduleDay?: number | null
  ): Date {
    const now = new Date();
    const next = new Date(now);

    // Parse schedule time (HH:MM format)
    let hours = 9; // Default 9 AM
    let minutes = 0;

    if (scheduleTime) {
      const [h, m] = scheduleTime.split(':').map(Number);
      hours = h;
      minutes = m;
    }

    next.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'DAILY':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case 'WEEKLY':
        const targetDay = scheduleDay || 1; // Default Monday
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        next.setDate(next.getDate() + (daysUntilTarget || 7));
        break;

      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;

      case 'MONTHLY':
        const targetDate = scheduleDay || 1; // Default 1st of month
        next.setDate(targetDate);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;

      case 'QUARTERLY':
        next.setMonth(Math.floor(now.getMonth() / 3) * 3 + 3);
        next.setDate(1);
        break;

      case 'YEARLY':
        next.setMonth(0); // January
        next.setDate(1);
        if (next <= now) {
          next.setFullYear(next.getFullYear() + 1);
        }
        break;

      default:
        // Default to next day
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Generate filename for report
   */
  private static generateFileName(
    reportName: string,
    reportType: ReportType,
    format: ReportFormat
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const sanitized = reportName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const extension = this.getFileExtension(format);
    return `${sanitized}_${timestamp}${extension}`;
  }

  /**
   * Get file extension for format
   */
  private static getFileExtension(format: ReportFormat): string {
    const extensions: Record<ReportFormat, string> = {
      PDF: '.pdf',
      EXCEL: '.xlsx',
      CSV: '.csv',
      JSON: '.json',
    };
    return extensions[format] || '.txt';
  }

  /**
   * Extract record count from report data
   */
  private static extractRecordCount(reportData: any): number {
    if (reportData.summary?.totalLeaves) {
      return reportData.summary.totalLeaves;
    }
    if (reportData.summary?.totalEmployees) {
      return reportData.summary.totalEmployees;
    }
    if (reportData.summary?.totalCount) {
      return reportData.summary.totalCount;
    }
    return 0;
  }
}
