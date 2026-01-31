/**
 * Excel Report Formatter
 * Formats report data as Excel (.xlsx) files
 *
 * NOTE: Requires 'xlsx' package to be installed
 * Install with: npm install xlsx
 */

import fs from 'fs/promises';
import path from 'path';
import { BaseReportFormatter } from './base';
import type { ReportData, TableSection, MetricsSection } from '../types';

// Dynamic import to avoid build errors if xlsx is not installed
let XLSX: any;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.warn('xlsx package not installed. Excel export will not work.');
}

export class ExcelFormatter extends BaseReportFormatter {
  readonly format = 'EXCEL' as const;

  async format(data: ReportData, outputPath: string): Promise<string> {
    if (!XLSX) {
      throw new Error('xlsx package is not installed. Run: npm install xlsx');
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create summary sheet
    const summaryData: any[][] = [
      [data.title],
      [data.subtitle || ''],
      [`Generated: ${this.formatDateTime(data.generatedAt)}`],
      [],
    ];

    if (data.period) {
      summaryData.push([
        'Period:',
        `${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}`,
      ]);
      summaryData.push([]);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create sheet for each section
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i];
      const sheetName = this.sanitizeSheetName(section.title, i);

      if (section.type === 'table') {
        const tableSection = section as TableSection;
        const sheetData: any[][] = [
          [section.title],
          [],
        ];

        if (section.description) {
          sheetData.push([section.description]);
          sheetData.push([]);
        }

        // Headers
        sheetData.push(tableSection.data.headers);

        // Rows
        for (const row of tableSection.data.rows) {
          sheetData.push(row);
        }

        // Totals
        if (tableSection.data.totals) {
          sheetData.push([]);
          sheetData.push(tableSection.data.totals);
        }

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Style headers (bold)
        const headerRow = section.description ? 3 : 1;
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
          if (!sheet[cellAddress]) continue;
          sheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'EFEFEF' } },
          };
        }

        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      } else if (section.type === 'metrics') {
        const metricsSection = section as MetricsSection;
        const sheetData: any[][] = [
          [section.title],
          [],
          ['Metric', 'Value'],
        ];

        for (const metric of metricsSection.data) {
          sheetData.push([metric.label, metric.value]);
        }

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      }
    }

    // Write to file
    XLSX.writeFile(workbook, outputPath);

    return outputPath;
  }

  getFileExtension(): string {
    return '.xlsx';
  }

  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  /**
   * Sanitize sheet name for Excel (max 31 chars, no special chars)
   */
  private sanitizeSheetName(name: string, index: number): string {
    let sanitized = name
      .replace(/[:\\/?*[\]]/g, '')
      .substring(0, 28);

    if (sanitized.length < name.length) {
      sanitized += `_${index + 1}`;
    }

    return sanitized;
  }
}
