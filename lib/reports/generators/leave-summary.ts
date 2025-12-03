/**
 * Leave Summary Report Generator
 * Generates comprehensive leave statistics for a given period
 */

import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { BaseReportGenerator } from './base';
import type { ReportFilters, ReportContext, ReportData, TableSection, MetricsSection } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export class LeaveSummaryGenerator extends BaseReportGenerator {
  readonly reportType = 'LEAVE_SUMMARY' as const;

  async generate(filters: ReportFilters, context: ReportContext): Promise<ReportData> {
    const startDate = this.parseDate(filters.startDate) || startOfMonth(new Date());
    const endDate = this.parseDate(filters.endDate) || endOfMonth(new Date());

    // Fetch all approved leaves in period
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.department && {
          requester: {
            department: filters.department,
          },
        }),
        ...(filters.leaveType && {
          type: filters.leaveType as any,
        }),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalLeaves = leaves.length;
    const totalDays = leaves.reduce((sum, leave) => sum + leave.workingDays, 0);

    // Group by type
    const byType = new Map<string, { count: number; days: number }>();
    leaves.forEach((leave) => {
      const current = byType.get(leave.type) || { count: 0, days: 0 };
      byType.set(leave.type, {
        count: current.count + 1,
        days: current.days + leave.workingDays,
      });
    });

    // Group by department
    const byDepartment = new Map<string, { count: number; days: number }>();
    leaves.forEach((leave) => {
      const dept = leave.requester.department || 'Unassigned';
      const current = byDepartment.get(dept) || { count: 0, days: 0 };
      byDepartment.set(dept, {
        count: current.count + 1,
        days: current.days + leave.workingDays,
      });
    });

    // Group by month for trend
    const byMonth = new Map<string, { count: number; days: number }>();
    leaves.forEach((leave) => {
      const month = format(leave.startDate, 'yyyy-MM');
      const current = byMonth.get(month) || { count: 0, days: 0 };
      byMonth.set(month, {
        count: current.count + 1,
        days: current.days + leave.workingDays,
      });
    });

    // Create report sections
    const sections: (TableSection | MetricsSection)[] = [];

    // Key Metrics Section
    sections.push({
      title: 'Key Metrics',
      type: 'metrics',
      data: [
        {
          label: 'Total Leaves',
          value: totalLeaves,
        },
        {
          label: 'Total Days',
          value: totalDays,
        },
        {
          label: 'Average Duration',
          value: totalLeaves > 0 ? `${(totalDays / totalLeaves).toFixed(1)} days` : '0 days',
        },
        {
          label: 'Unique Employees',
          value: new Set(leaves.map((l) => l.requesterId)).size,
        },
      ],
    } as MetricsSection);

    // Leave by Type Table
    sections.push({
      title: 'Leaves by Type',
      type: 'table',
      data: {
        headers: ['Leave Type', 'Count', 'Total Days', 'Avg Days', 'Percentage'],
        rows: Array.from(byType.entries()).map(([type, data]) => [
          type,
          data.count,
          data.days,
          (data.days / data.count).toFixed(1),
          `${this.calculatePercentage(data.count, totalLeaves)}%`,
        ]),
        totals: ['Total', totalLeaves, totalDays, '', '100%'],
      },
    } as TableSection);

    // Leave by Department Table
    sections.push({
      title: 'Leaves by Department',
      type: 'table',
      data: {
        headers: ['Department', 'Count', 'Total Days', 'Avg Days', 'Percentage'],
        rows: Array.from(byDepartment.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .map(([dept, data]) => [
            dept,
            data.count,
            data.days,
            (data.days / data.count).toFixed(1),
            `${this.calculatePercentage(data.count, totalLeaves)}%`,
          ]),
        totals: ['Total', totalLeaves, totalDays, '', '100%'],
      },
    } as TableSection);

    // Monthly Trend Table
    if (byMonth.size > 1) {
      sections.push({
        title: 'Monthly Trend',
        type: 'table',
        data: {
          headers: ['Month', 'Count', 'Total Days', 'Avg Days'],
          rows: Array.from(byMonth.entries())
            .sort()
            .map(([month, data]) => [
              format(new Date(month + '-01'), 'MMM yyyy'),
              data.count,
              data.days,
              (data.days / data.count).toFixed(1),
            ]),
        },
      } as TableSection);
    }

    return {
      title: 'Leave Summary Report',
      subtitle: this.formatDateRange(startDate, endDate),
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      filters,
      sections,
      summary: {
        totalLeaves,
        totalDays,
        averageDuration: totalLeaves > 0 ? totalDays / totalLeaves : 0,
        uniqueEmployees: new Set(leaves.map((l) => l.requesterId)).size,
      },
    };
  }
}
