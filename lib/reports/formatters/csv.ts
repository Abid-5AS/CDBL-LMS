/**
 * CSV Report Formatter
 * Formats report data as CSV files
 */

import fs from 'fs/promises';
import path from 'path';
import { BaseReportFormatter } from './base';
import type { ReportData, TableSection } from '../types';

export class CSVFormatter extends BaseReportFormatter {
  readonly format = 'CSV' as const;

  async format(data: ReportData, outputPath: string): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    let csvContent = '';

    // Header
    csvContent += `"${data.title}"\n`;
    if (data.subtitle) {
      csvContent += `"${data.subtitle}"\n`;
    }
    csvContent += `"Generated: ${this.formatDateTime(data.generatedAt)}"\n`;
    csvContent += '\n';

    // Process each section
    for (const section of data.sections) {
      csvContent += `"${section.title}"\n`;

      if (section.description) {
        csvContent += `"${section.description}"\n`;
      }

      if (section.type === 'table') {
        const tableSection = section as TableSection;

        // Headers
        csvContent += tableSection.data.headers
          .map((h) => `"${h}"`)
          .join(',');
        csvContent += '\n';

        // Rows
        for (const row of tableSection.data.rows) {
          csvContent += row.map((cell) => `"${cell}"`).join(',');
          csvContent += '\n';
        }

        // Totals if present
        if (tableSection.data.totals) {
          csvContent += tableSection.data.totals
            .map((cell) => `"${cell}"`)
            .join(',');
          csvContent += '\n';
        }
      } else if (section.type === 'metrics') {
        // Metrics as key-value pairs
        csvContent += '"Metric","Value"\n';
        for (const metric of section.data) {
          csvContent += `"${metric.label}","${metric.value}"\n`;
        }
      }

      csvContent += '\n';
    }

    // Write to file
    await fs.writeFile(outputPath, csvContent, 'utf-8');

    return outputPath;
  }

  getFileExtension(): string {
    return '.csv';
  }

  getMimeType(): string {
    return 'text/csv';
  }
}
