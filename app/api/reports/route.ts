/**
 * Reports API
 * Endpoints for managing scheduled reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ReportService } from '@/lib/reports/service';
import type { ReportConfig } from '@/lib/reports/types';
import { ReportType, ReportFormat, ReportFrequency } from '@prisma/client';

/**
 * GET /api/reports
 * Get all scheduled reports
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and managers can view reports
    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD', 'CEO'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const reportType = searchParams.get('reportType') as ReportType | null;

    const filters: any = {};
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }
    if (reportType) {
      filters.reportType = reportType;
    }

    // Non-admins can only see their own reports
    if (!['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD'].includes(user.role)) {
      filters.createdBy = user.id;
    }

    const reports = await ReportService.getScheduledReports(filters);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('[API] Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new scheduled report
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and managers can create reports
    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.reportType || !body.format || !body.frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, reportType, format, frequency' },
        { status: 400 }
      );
    }

    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient email is required' },
        { status: 400 }
      );
    }

    const config: ReportConfig = {
      name: body.name,
      reportType: body.reportType as ReportType,
      format: body.format as ReportFormat,
      frequency: body.frequency as ReportFrequency,
      recipients: body.recipients,
      filters: body.filters || {},
      scheduleTime: body.scheduleTime,
      scheduleDay: body.scheduleDay ? parseInt(body.scheduleDay) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    const reportId = await ReportService.createScheduledReport(config, user.id);

    return NextResponse.json(
      { success: true, reportId, message: 'Report scheduled successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
