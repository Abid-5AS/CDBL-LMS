/**
 * Report Formatter Registry
 * Central registry for all report formatters
 */

import type { ReportFormat } from '@prisma/client';
import type { IReportFormatter } from '../types';
import { CSVFormatter } from './csv';
import { ExcelFormatter } from './excel';
import { PDFFormatter } from './pdf';

/**
 * Registry of all report formatters
 */
const formatters = new Map<ReportFormat, IReportFormatter>();

// Register all formatters
formatters.set('CSV', new CSVFormatter());
formatters.set('EXCEL', new ExcelFormatter());
formatters.set('PDF', new PDFFormatter());

// JSON formatter is handled specially (no file conversion needed)
// formatters.set('JSON', new JSONFormatter());

/**
 * Get formatter for a specific format
 */
export function getFormatter(format: ReportFormat): IReportFormatter {
  const formatter = formatters.get(format);

  if (!formatter) {
    throw new Error(`No formatter found for format: ${format}`);
  }

  return formatter;
}

/**
 * Get all available formats
 */
export function getAvailableFormats(): ReportFormat[] {
  return Array.from(formatters.keys());
}

/**
 * Check if a format has a formatter
 */
export function hasFormatter(format: ReportFormat): boolean {
  return formatters.has(format);
}

// Export all formatters
export { CSVFormatter, ExcelFormatter, PDFFormatter };
