/**
 * Email Delivery Service for Reports
 * Handles sending generated reports via email
 */

import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import type { EmailDeliveryResult } from './types';
import type { ReportFormat } from '@prisma/client';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Configure based on environment variables
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // For development without SMTP configured
    if (!config.auth.user || !config.auth.pass) {
      console.warn('[Email] SMTP credentials not configured. Using ethereal for testing.');
      // In production, throw an error instead
      // throw new Error('SMTP credentials not configured');
    }

    this.transporter = nodemailer.createTransport(config);
    return this.transporter;
  }

  /**
   * Send report via email
   */
  static async sendReport(
    recipients: string[],
    reportName: string,
    reportType: string,
    format: ReportFormat,
    filePath: string,
    generatedAt: Date
  ): Promise<EmailDeliveryResult> {
    const sentTo: string[] = [];
    const failedTo: string[] = [];
    const errors: string[] = [];

    try {
      const transporter = this.getTransporter();

      // Verify connection
      try {
        await transporter.verify();
      } catch (error) {
        console.error('[Email] SMTP connection failed:', error);
        return {
          success: false,
          sentTo: [],
          failedTo: recipients,
          errors: ['SMTP connection failed. Please check email configuration.'],
        };
      }

      // Read file
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      // Email content
      const subject = `Report: ${reportName}`;
      const html = this.generateEmailHTML(reportName, reportType, format, generatedAt);

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient,
            subject,
            html,
            attachments: [
              {
                filename: fileName,
                content: fileBuffer,
                contentType: this.getMimeType(format),
              },
            ],
          });

          sentTo.push(recipient);
        } catch (error) {
          failedTo.push(recipient);
          errors.push(`Failed to send to ${recipient}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: sentTo.length > 0,
        sentTo,
        failedTo,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        sentTo,
        failedTo: recipients,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Generate email HTML content
   */
  private static generateEmailHTML(
    reportName: string,
    reportType: string,
    format: ReportFormat,
    generatedAt: Date
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      border-radius: 5px 5px 0 0;
      text-align: center;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .info-label {
      font-weight: bold;
      width: 150px;
      color: #666;
    }
    .info-value {
      flex: 1;
      color: #333;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Report Generated</h1>
  </div>
  <div class="content">
    <p>Your scheduled report has been generated and is attached to this email.</p>

    <div class="info-row">
      <div class="info-label">Report Name:</div>
      <div class="info-value">${reportName}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Report Type:</div>
      <div class="info-value">${this.formatReportType(reportType)}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Format:</div>
      <div class="info-value">${format}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Generated At:</div>
      <div class="info-value">${generatedAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</div>
    </div>

    <p style="margin-top: 20px;">
      <strong>Note:</strong> The report is attached to this email.
      Please download and open the attachment to view the full report.
    </p>
  </div>

  <div class="footer">
    <p>
      This is an automated email from CDBL Leave Management System.<br>
      Please do not reply to this email.
    </p>
    <p style="color: #999; font-size: 11px;">
      © ${new Date().getFullYear()} CDBL. All rights reserved.
    </p>
  </div>
</body>
</html>
`;
  }

  /**
   * Format report type for display
   */
  private static formatReportType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: ReportFormat): string {
    const mimeTypes: Record<ReportFormat, string> = {
      PDF: 'application/pdf',
      EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV: 'text/csv',
      JSON: 'application/json',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('[Email] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Send test email
   */
  static async sendTestEmail(recipient: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient,
        subject: 'Test Email - CDBL LMS Reports',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from the CDBL Leave Management System.</p>
          <p>If you received this email, the email configuration is working correctly.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        `,
      });

      return true;
    } catch (error) {
      console.error('[Email] Test email failed:', error);
      return false;
    }
  }
}
