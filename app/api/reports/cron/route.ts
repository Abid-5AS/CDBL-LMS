/**
 * Report Scheduler Cron Job
 * This endpoint should be called by a cron service (e.g., cron-job.org, GitHub Actions)
 * to check and execute scheduled reports
 *
 * Security: Use CRON_SECRET environment variable to authenticate requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReportService } from '@/lib/reports/service';
import { EmailService } from '@/lib/reports/email-service';

/**
 * GET /api/reports/cron
 * Check and execute pending reports
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const executed: number[] = [];
    const failed: number[] = [];

    // Find reports that should run now
    const dueReports = await prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
    });

    console.log(`[Cron] Found ${dueReports.length} reports to execute`);

    // Execute each report
    for (const report of dueReports) {
      try {
        console.log(`[Cron] Executing report: ${report.name} (ID: ${report.id})`);

        // Generate report
        const result = await ReportService.generateReport(report.id);

        if (result.success && result.filePath) {
          // Send email
          const recipients = (report.recipients as any) as string[];
          const emailResult = await EmailService.sendReport(
            recipients,
            report.name,
            report.reportType,
            report.format,
            result.filePath,
            new Date()
          );

          // Update execution with email status
          if (emailResult.sentTo.length > 0) {
            await prisma.reportExecution.update({
              where: { id: result.executionId },
              data: {
                sentTo: emailResult.sentTo as any,
              },
            });
          }

          executed.push(report.id);
          console.log(`[Cron] ✓ Report ${report.id} executed successfully`);
        } else {
          failed.push(report.id);
          console.error(`[Cron] ✗ Report ${report.id} failed:`, result.error);
        }

        // Update next run time
        const nextRunAt = calculateNextRunTime(
          report.frequency,
          report.scheduleTime || null,
          report.scheduleDay || null
        );

        await prisma.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        });
      } catch (error) {
        failed.push(report.id);
        console.error(`[Cron] Error executing report ${report.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalReports: dueReports.length,
      executed: executed.length,
      failed: failed.length,
      executedIds: executed,
      failedIds: failed,
    });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(
  frequency: string,
  scheduleTime: string | null,
  scheduleDay: number | null
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
      next.setDate(next.getDate() + 1);
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
      next.setMonth(next.getMonth() + 1);
      break;

    case 'QUARTERLY':
      next.setMonth(Math.floor(now.getMonth() / 3) * 3 + 3);
      next.setDate(1);
      break;

    case 'YEARLY':
      next.setMonth(0); // January
      next.setDate(1);
      next.setFullYear(next.getFullYear() + 1);
      break;

    default:
      // Default to next day
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * POST /api/reports/cron
 * Alternative method for POST-based cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
