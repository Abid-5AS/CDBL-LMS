import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { CostAnalysis } from './types';

/**
 * Financial Impact & Cost Analyzer
 * Calculates the financial impact of leave policies
 */
export class FinancialAnalyzer {
  // Default daily rate (can be customized per organization)
  private static DEFAULT_DAILY_RATE = 500; // BDT or USD

  /**
   * Calculate comprehensive cost analysis for a period
   */
  static async calculateCostAnalysis(
    startDate: Date,
    endDate: Date,
    department?: string
  ): Promise<CostAnalysis> {
    const period = `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;

    // Get all approved leaves in period
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(department && {
          requester: {
            department,
          },
        }),
      },
      include: {
        requester: {
          select: {
            department: true,
          },
        },
      },
    });

    // Calculate leave costs (paid leaves)
    let totalLeaveCost = 0;
    const departmentCosts = new Map<string, { cost: number; employeeCount: Set<number> }>();

    for (const leave of leaves) {
      // Estimate cost (working days * daily rate)
      // In real implementation, you'd get actual salary data
      const cost = leave.workingDays * this.DEFAULT_DAILY_RATE;

      // Only count paid leave types
      const isPaid = [
        LeaveType.EARNED,
        LeaveType.CASUAL,
        LeaveType.MEDICAL,
        LeaveType.MATERNITY,
        LeaveType.PATERNITY,
      ].includes(leave.type);

      if (isPaid) {
        totalLeaveCost += cost;

        const dept = leave.requester.department || 'Unassigned';
        if (!departmentCosts.has(dept)) {
          departmentCosts.set(dept, { cost: 0, employeeCount: new Set() });
        }

        const deptData = departmentCosts.get(dept)!;
        deptData.cost += cost;
        deptData.employeeCount.add(leave.requesterId);
      }
    }

    // Calculate encashment liability
    const year = startDate.getFullYear();
    const balances = await prisma.balance.findMany({
      where: {
        year,
        type: LeaveType.EARNED,
        closing: {
          gt: 0,
        },
        ...(department && {
          user: {
            department,
          },
        }),
      },
      select: {
        closing: true,
      },
    });

    const encashmentLiability = balances.reduce(
      (sum, b) => sum + b.closing * this.DEFAULT_DAILY_RATE,
      0
    );

    // Calculate LWP savings (unpaid leaves)
    const unpaidLeaves = leaves.filter((leave) =>
      [LeaveType.EXTRAWITHOUTPAY].includes(leave.type)
    );

    const lwpSavings = unpaidLeaves.reduce(
      (sum, leave) => sum + leave.workingDays * this.DEFAULT_DAILY_RATE,
      0
    );

    // Estimate replacement costs (assume 20% of leaves require temporary coverage)
    const replacementCosts = totalLeaveCost * 0.2;

    // Net impact
    const netImpact = totalLeaveCost + replacementCosts + encashmentLiability - lwpSavings;

    // Department breakdown
    const breakdown = Array.from(departmentCosts.entries()).map(([department, data]) => ({
      department,
      cost: Math.round(data.cost),
      employeeCount: data.employeeCount.size,
    }));

    return {
      period,
      totalLeaveCost: Math.round(totalLeaveCost),
      encashmentLiability: Math.round(encashmentLiability),
      lwpSavings: Math.round(lwpSavings),
      replacementCosts: Math.round(replacementCosts),
      netImpact: Math.round(netImpact),
      breakdown: breakdown.sort((a, b) => b.cost - a.cost),
    };
  }

  /**
   * Calculate cost per employee
   */
  static async calculatePerEmployeeCost(
    employeeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: employeeId,
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        workingDays: true,
        type: true,
      },
    });

    let totalCost = 0;

    for (const leave of leaves) {
      const isPaid = ![LeaveType.EXTRAWITHOUTPAY].includes(leave.type);
      if (isPaid) {
        totalCost += leave.workingDays * this.DEFAULT_DAILY_RATE;
      }
    }

    return Math.round(totalCost);
  }

  /**
   * Get monthly cost trend
   */
  static async getMonthlyCostTrend(
    months: number = 12,
    department?: string
  ): Promise<{ month: string; cost: number }[]> {
    const trends: { month: string; cost: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = startOfMonth(targetDate);
      const endDate = endOfMonth(targetDate);

      const analysis = await this.calculateCostAnalysis(startDate, endDate, department);

      trends.push({
        month: format(targetDate, 'MMM yyyy'),
        cost: analysis.totalLeaveCost,
      });
    }

    return trends;
  }
}
