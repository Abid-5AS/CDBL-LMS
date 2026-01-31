/**
 * Leave Balance Report Generator
 * Generates current leave balance status for all employees
 */

import { prisma } from '@/lib/prisma';
import { BaseReportGenerator } from './base';
import type { ReportFilters, ReportContext, ReportData, TableSection, MetricsSection } from '../types';

export class LeaveBalanceGenerator extends BaseReportGenerator {
  readonly reportType = 'LEAVE_BALANCE' as const;

  async generate(filters: ReportFilters, context: ReportContext): Promise<ReportData> {
    const currentYear = new Date().getFullYear();

    // Fetch all balances for current year
    const balances = await prisma.balance.findMany({
      where: {
        year: currentYear,
        ...(filters.department && {
          user: {
            department: filters.department,
          },
        }),
        ...(filters.leaveType && {
          type: filters.leaveType as any,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            empCode: true,
            name: true,
            department: true,
          },
        },
      },
      orderBy: [
        { user: { department: 'asc' } },
        { user: { name: 'asc' } },
        { type: 'asc' },
      ],
    });

    // Group by employee
    const employeeMap = new Map<number, any>();

    balances.forEach((balance) => {
      if (!employeeMap.has(balance.userId)) {
        employeeMap.set(balance.userId, {
          empCode: balance.user.empCode || 'N/A',
          name: balance.user.name,
          department: balance.user.department || 'Unassigned',
          balances: [],
        });
      }

      const employee = employeeMap.get(balance.userId)!;
      const allocated = balance.opening + balance.accrued;
      const utilizationPercent = allocated > 0
        ? Math.round((balance.used / allocated) * 100 * 10) / 10
        : 0;

      employee.balances.push({
        type: balance.type,
        opening: balance.opening,
        accrued: balance.accrued,
        used: balance.used,
        closing: balance.closing,
        utilizationPercent,
      });
    });

    const employees = Array.from(employeeMap.values());

    // Calculate overall statistics
    const totalAllocated = balances.reduce((sum, b) => sum + b.opening + b.accrued, 0);
    const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
    const totalRemaining = balances.reduce((sum, b) => sum + b.closing, 0);
    const averageUtilization = totalAllocated > 0
      ? Math.round((totalUsed / totalAllocated) * 100 * 10) / 10
      : 0;

    // Create sections
    const sections: (TableSection | MetricsSection)[] = [];

    // Key Metrics
    sections.push({
      title: 'Overall Statistics',
      type: 'metrics',
      data: [
        {
          label: 'Total Employees',
          value: employees.length,
        },
        {
          label: 'Total Allocated',
          value: `${totalAllocated} days`,
        },
        {
          label: 'Total Used',
          value: `${totalUsed} days`,
        },
        {
          label: 'Total Remaining',
          value: `${totalRemaining} days`,
        },
        {
          label: 'Average Utilization',
          value: `${averageUtilization}%`,
        },
      ],
    } as MetricsSection);

    // Employee Balance Table
    const balanceRows: any[][] = [];
    employees.forEach((emp) => {
      emp.balances.forEach((bal: any, idx: number) => {
        balanceRows.push([
          idx === 0 ? emp.empCode : '',
          idx === 0 ? emp.name : '',
          idx === 0 ? emp.department : '',
          bal.type,
          bal.opening,
          bal.accrued,
          bal.opening + bal.accrued,
          bal.used,
          bal.closing,
          `${bal.utilizationPercent}%`,
        ]);
      });
    });

    sections.push({
      title: 'Employee Leave Balances',
      type: 'table',
      data: {
        headers: [
          'Emp Code',
          'Name',
          'Department',
          'Leave Type',
          'Opening',
          'Accrued',
          'Allocated',
          'Used',
          'Remaining',
          'Utilization',
        ],
        rows: balanceRows,
      },
    } as TableSection);

    // Low Balance Warning Table (< 5 days)
    const lowBalanceEmployees = employees
      .map((emp) => ({
        ...emp,
        lowBalances: emp.balances.filter((b: any) => b.closing < 5 && b.closing >= 0),
      }))
      .filter((emp) => emp.lowBalances.length > 0);

    if (lowBalanceEmployees.length > 0) {
      sections.push({
        title: 'Low Balance Alert (< 5 days)',
        type: 'table',
        description: 'Employees with leave balance below 5 days',
        data: {
          headers: ['Emp Code', 'Name', 'Department', 'Leave Type', 'Remaining'],
          rows: lowBalanceEmployees.flatMap((emp) =>
            emp.lowBalances.map((bal: any) => [
              emp.empCode,
              emp.name,
              emp.department,
              bal.type,
              bal.closing,
            ])
          ),
        },
      } as TableSection);
    }

    // High Balance Warning Table (> 20 days)
    const highBalanceEmployees = employees
      .map((emp) => ({
        ...emp,
        highBalances: emp.balances.filter((b: any) => b.closing > 20),
      }))
      .filter((emp) => emp.highBalances.length > 0);

    if (highBalanceEmployees.length > 0) {
      sections.push({
        title: 'High Balance Alert (> 20 days)',
        type: 'table',
        description: 'Employees with unused leave balance above 20 days - potential encashment liability',
        data: {
          headers: ['Emp Code', 'Name', 'Department', 'Leave Type', 'Remaining'],
          rows: highBalanceEmployees.flatMap((emp) =>
            emp.highBalances.map((bal: any) => [
              emp.empCode,
              emp.name,
              emp.department,
              bal.type,
              bal.closing,
            ])
          ),
        },
      } as TableSection);
    }

    return {
      title: 'Leave Balance Report',
      subtitle: `As of ${this.formatDate(new Date())} - Year ${currentYear}`,
      generatedAt: new Date(),
      filters,
      sections,
      summary: {
        totalEmployees: employees.length,
        totalAllocated,
        totalUsed,
        totalRemaining,
        averageUtilization,
        lowBalanceCount: lowBalanceEmployees.length,
        highBalanceCount: highBalanceEmployees.length,
      },
    };
  }
}
