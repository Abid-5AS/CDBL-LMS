/**
 * Approval Times Report Generator
 * Analyzes leave approval efficiency and response times
 */

import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { BaseReportGenerator } from './base';
import type { ReportFilters, ReportContext, ReportData, TableSection, MetricsSection } from '../types';
import { startOfMonth, endOfMonth } from 'date-fns';

export class ApprovalTimesGenerator extends BaseReportGenerator {
  readonly reportType = 'APPROVAL_TIMES' as const;

  async generate(filters: ReportFilters, context: ReportContext): Promise<ReportData> {
    const startDate = this.parseDate(filters.startDate) || startOfMonth(new Date());
    const endDate = this.parseDate(filters.endDate) || endOfMonth(new Date());

    // Fetch approved leaves with approval details
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.department && {
          requester: {
            department: filters.department,
          },
        }),
      },
      include: {
        requester: {
          select: {
            department: true,
          },
        },
        approvals: {
          where: {
            decision: 'APPROVED',
            decidedAt: {
              not: null,
            },
          },
          orderBy: {
            decidedAt: 'desc',
          },
          take: 1,
          include: {
            approver: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate approval times in hours
    const approvalTimes: number[] = [];
    const byDepartment = new Map<string, { total: number; count: number }>();
    const byApprover = new Map<string, { total: number; count: number }>();
    const distribution = {
      '0-24h': 0,
      '24-48h': 0,
      '48-72h': 0,
      '3-7d': 0,
      '7d+': 0,
    };

    leaves.forEach((leave) => {
      if (leave.approvals.length > 0 && leave.approvals[0].decidedAt) {
        const approvalTimeMs =
          leave.approvals[0].decidedAt.getTime() - leave.createdAt.getTime();
        const approvalTimeHours = approvalTimeMs / (1000 * 60 * 60);
        approvalTimes.push(approvalTimeHours);

        // By Department
        const dept = leave.requester.department || 'Unassigned';
        const deptData = byDepartment.get(dept) || { total: 0, count: 0 };
        deptData.total += approvalTimeHours;
        deptData.count += 1;
        byDepartment.set(dept, deptData);

        // By Approver
        const approverName = leave.approvals[0].approver.name;
        const approverData = byApprover.get(approverName) || { total: 0, count: 0 };
        approverData.total += approvalTimeHours;
        approverData.count += 1;
        byApprover.set(approverName, approverData);

        // Distribution
        if (approvalTimeHours <= 24) {
          distribution['0-24h']++;
        } else if (approvalTimeHours <= 48) {
          distribution['24-48h']++;
        } else if (approvalTimeHours <= 72) {
          distribution['48-72h']++;
        } else if (approvalTimeHours <= 168) {
          distribution['3-7d']++;
        } else {
          distribution['7d+']++;
        }
      }
    });

    // Calculate statistics
    const totalCount = approvalTimes.length;
    const averageHours =
      totalCount > 0
        ? approvalTimes.reduce((sum, t) => sum + t, 0) / totalCount
        : 0;

    const sortedTimes = [...approvalTimes].sort((a, b) => a - b);
    const medianHours =
      sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)]
        : 0;
    const fastestHours = sortedTimes.length > 0 ? sortedTimes[0] : 0;
    const slowestHours = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;

    // Create sections
    const sections: (TableSection | MetricsSection)[] = [];

    // Key Metrics
    sections.push({
      title: 'Overall Performance',
      type: 'metrics',
      data: [
        {
          label: 'Average Approval Time',
          value: `${averageHours.toFixed(1)} hours`,
        },
        {
          label: 'Median Approval Time',
          value: `${medianHours.toFixed(1)} hours`,
        },
        {
          label: 'Fastest Approval',
          value: `${fastestHours.toFixed(1)} hours`,
        },
        {
          label: 'Slowest Approval',
          value: `${slowestHours.toFixed(1)} hours`,
        },
        {
          label: 'Total Approvals',
          value: totalCount,
        },
      ],
    } as MetricsSection);

    // By Department Table
    sections.push({
      title: 'Approval Time by Department',
      type: 'table',
      data: {
        headers: ['Department', 'Count', 'Avg Hours', 'Avg Days'],
        rows: Array.from(byDepartment.entries())
          .sort((a, b) => a[1].total / a[1].count - b[1].total / b[1].count)
          .map(([dept, data]) => {
            const avgHours = data.total / data.count;
            return [
              dept,
              data.count,
              avgHours.toFixed(1),
              (avgHours / 24).toFixed(1),
            ];
          }),
      },
    } as TableSection);

    // By Approver Table
    const approverRows = Array.from(byApprover.entries())
      .sort((a, b) => a[1].total / a[1].count - b[1].total / b[1].count)
      .slice(0, 20) // Top 20
      .map(([name, data]) => {
        const avgHours = data.total / data.count;
        return [name, data.count, avgHours.toFixed(1), (avgHours / 24).toFixed(1)];
      });

    sections.push({
      title: 'Approval Time by Approver',
      type: 'table',
      description: 'Top 20 approvers by average response time',
      data: {
        headers: ['Approver', 'Count', 'Avg Hours', 'Avg Days'],
        rows: approverRows,
      },
    } as TableSection);

    // Distribution Table
    sections.push({
      title: 'Approval Time Distribution',
      type: 'table',
      data: {
        headers: ['Time Range', 'Count', 'Percentage'],
        rows: Object.entries(distribution).map(([range, count]) => [
          range,
          count,
          `${this.calculatePercentage(count, totalCount)}%`,
        ]),
        totals: ['Total', totalCount, '100%'],
      },
    } as TableSection);

    return {
      title: 'Approval Times Report',
      subtitle: this.formatDateRange(startDate, endDate),
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      filters,
      sections,
      summary: {
        totalCount,
        averageHours: Math.round(averageHours * 10) / 10,
        medianHours: Math.round(medianHours * 10) / 10,
        fastestHours: Math.round(fastestHours * 10) / 10,
        slowestHours: Math.round(slowestHours * 10) / 10,
      },
    };
  }
}
