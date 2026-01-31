/**
 * Base Report Formatter
 * Abstract base class for all report formatters
 */

import type { IReportFormatter, ReportData } from '../types';
import type { ReportFormat } from '@prisma/client';

export abstract class BaseReportFormatter implements IReportFormatter {
  abstract readonly format: ReportFormat;

  /**
   * Format report data to file - must be implemented by subclasses
   */
  abstract format(data: ReportData, outputPath: string): Promise<string>;

  /**
   * Get file extension - must be implemented by subclasses
   */
  abstract getFileExtension(): string;

  /**
   * Get MIME type - must be implemented by subclasses
   */
  abstract getMimeType(): string;

  /**
   * Sanitize filename
   */
  protected sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Generate filename with timestamp
   */
  protected generateFilename(reportTitle: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const sanitized = this.sanitizeFilename(reportTitle);
    return `${sanitized}_${timestamp}${this.getFileExtension()}`;
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
   * Format datetime for display
   */
  protected formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
