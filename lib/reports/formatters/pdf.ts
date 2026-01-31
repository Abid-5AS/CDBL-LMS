/**
 * PDF Report Formatter
 * Formats report data as PDF files
 *
 * NOTE: This is a simplified implementation using HTML-to-PDF approach
 * For production, consider using libraries like:
 * - pdfkit
 * - puppeteer
 * - jsPDF
 *
 * Current implementation requires html-pdf-node
 * Install with: npm install html-pdf-node
 */

import fs from 'fs/promises';
import path from 'path';
import { BaseReportFormatter } from './base';
import type { ReportData, TableSection, MetricsSection } from '../types';

// Dynamic import to avoid build errors
let htmlPdf: any;
try {
  htmlPdf = require('html-pdf-node');
} catch (error) {
  console.warn('html-pdf-node package not installed. PDF export will not work.');
}

export class PDFFormatter extends BaseReportFormatter {
  readonly format = 'PDF' as const;

  async format(data: ReportData, outputPath: string): Promise<string> {
    if (!htmlPdf) {
      throw new Error('html-pdf-node package is not installed. Run: npm install html-pdf-node');
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Generate HTML content
    const html = this.generateHTML(data);

    // PDF options
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    };

    // Generate PDF
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    // Write to file
    await fs.writeFile(outputPath, pdfBuffer);

    return outputPath;
  }

  getFileExtension(): string {
    return '.pdf';
  }

  getMimeType(): string {
    return 'application/pdf';
  }

  /**
   * Generate HTML content for PDF
   */
  private generateHTML(data: ReportData): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    h1 {
      color: #0066cc;
      font-size: 24pt;
      margin: 0 0 5px 0;
    }
    .subtitle {
      color: #666;
      font-size: 12pt;
      margin: 5px 0;
    }
    .generated {
      color: #999;
      font-size: 9pt;
      margin: 5px 0;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .description {
      font-size: 9pt;
      color: #666;
      margin-bottom: 10px;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: bold;
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .totals {
      font-weight: bold;
      background-color: #f0f0f0 !important;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 10px 0;
    }
    .metric-card {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    .metric-label {
      font-size: 9pt;
      color: #666;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 18pt;
      font-weight: bold;
      color: #0066cc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(data.title)}</h1>
    ${data.subtitle ? `<div class="subtitle">${this.escapeHtml(data.subtitle)}</div>` : ''}
    <div class="generated">Generated: ${this.formatDateTime(data.generatedAt)}</div>
  </div>
`;

    // Add sections
    for (const section of data.sections) {
      html += `<div class="section">`;
      html += `<div class="section-title">${this.escapeHtml(section.title)}</div>`;

      if (section.description) {
        html += `<div class="description">${this.escapeHtml(section.description)}</div>`;
      }

      if (section.type === 'table') {
        html += this.renderTableSection(section as TableSection);
      } else if (section.type === 'metrics') {
        html += this.renderMetricsSection(section as MetricsSection);
      }

      html += `</div>`;
    }

    html += `
  <div class="footer">
    CDBL Leave Management System - Report Generated on ${this.formatDateTime(new Date())}
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Render table section as HTML
   */
  private renderTableSection(section: TableSection): string {
    let html = '<table>';

    // Headers
    html += '<thead><tr>';
    for (const header of section.data.headers) {
      html += `<th>${this.escapeHtml(String(header))}</th>`;
    }
    html += '</tr></thead>';

    // Body
    html += '<tbody>';
    for (const row of section.data.rows) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${this.escapeHtml(String(cell))}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';

    // Totals
    if (section.data.totals) {
      html += '<tfoot><tr class="totals">';
      for (const cell of section.data.totals) {
        html += `<td>${this.escapeHtml(String(cell))}</td>`;
      }
      html += '</tr></tfoot>';
    }

    html += '</table>';
    return html;
  }

  /**
   * Render metrics section as HTML
   */
  private renderMetricsSection(section: MetricsSection): string {
    let html = '<div class="metrics">';

    for (const metric of section.data) {
      html += '<div class="metric-card">';
      html += `<div class="metric-label">${this.escapeHtml(metric.label)}</div>`;
      html += `<div class="metric-value">${this.escapeHtml(String(metric.value))}</div>`;
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
