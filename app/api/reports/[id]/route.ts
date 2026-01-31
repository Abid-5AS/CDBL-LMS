/**
 * Individual Report API
 * Endpoints for managing individual scheduled reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ReportService } from '@/lib/reports/service';
import type { ReportConfig } from '@/lib/reports/types';
import { ReportType, ReportFormat, ReportFrequency } from '@prisma/client';

/**
 * GET /api/reports/[id]
 * Get execution history for a report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD', 'CEO'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await ReportService.getExecutionHistory(reportId, limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[API] Error fetching execution history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[id]
 * Update a scheduled report
 */
export async function PATCH(
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

    const body = await request.json();

    const config: Partial<ReportConfig> = {};

    if (body.name !== undefined) config.name = body.name;
    if (body.reportType !== undefined) config.reportType = body.reportType as ReportType;
    if (body.format !== undefined) config.format = body.format as ReportFormat;
    if (body.frequency !== undefined) config.frequency = body.frequency as ReportFrequency;
    if (body.recipients !== undefined) config.recipients = body.recipients;
    if (body.filters !== undefined) config.filters = body.filters;
    if (body.scheduleTime !== undefined) config.scheduleTime = body.scheduleTime;
    if (body.scheduleDay !== undefined) {
      config.scheduleDay = body.scheduleDay ? parseInt(body.scheduleDay) : undefined;
    }
    if (body.isActive !== undefined) config.isActive = body.isActive;

    await ReportService.updateScheduledReport(reportId, config);

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('[API] Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a scheduled report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reportId = parseInt(params.id);

    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    await ReportService.deleteScheduledReport(reportId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
