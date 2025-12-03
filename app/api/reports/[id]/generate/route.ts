/**
 * Report Generation API
 * Endpoint for generating reports on demand
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ReportService } from '@/lib/reports/service';
import { EmailService } from '@/lib/reports/email-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reports/[id]/generate
 * Generate a report immediately
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    // Get report configuration
    const report = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if email should be sent
    const body = await request.json().catch(() => ({}));
    const sendEmail = body.sendEmail !== false; // Default true

    // Generate report
    const result = await ReportService.generateReport(reportId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Report generation failed' },
        { status: 500 }
      );
    }

    // Send email if requested and configured
    let emailResult;
    if (sendEmail && result.filePath) {
      const recipients = (report.recipients as any) as string[];

      emailResult = await EmailService.sendReport(
        recipients,
        report.name,
        report.reportType,
        report.format,
        result.filePath,
        new Date()
      );

      // Update execution record with email status
      if (emailResult.sentTo.length > 0) {
        await prisma.reportExecution.update({
          where: { id: result.executionId },
          data: {
            sentTo: emailResult.sentTo as any,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      execution: {
        id: result.executionId,
        filePath: result.filePath,
        fileSize: result.fileSize,
        recordCount: result.recordCount,
        duration: result.duration,
      },
      email: emailResult
        ? {
          sent: emailResult.success,
          sentTo: emailResult.sentTo,
          failedTo: emailResult.failedTo,
          errors: emailResult.errors,
        }
        : undefined,
    });
  } catch (error) {
    console.error('[API] Error generating report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
