import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import type { LeaveUtilization, LeaveTrend, AnalyticsFilters } from './types';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

/**
 * Analytics Calculator
 * Core analytics calculations and aggregations
 */
export class AnalyticsCalculator {
  /**
   * Calculate leave utilization for all employees
   */
  static async calculateLeaveUtilization(
    filters: AnalyticsFilters = {}
  ): Promise<LeaveUtilization[]> {
    const currentYear = filters.endDate?.getFullYear() || new Date().getFullYear();

    // Get all balances
    const balances = await prisma.balance.findMany({
      where: {
        year: currentYear,
        ...(filters.department && {
          user: {
            department: filters.department,
          },
        }),
        ...(filters.leaveType && {
          type: filters.leaveType as LeaveType,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    return balances.map((balance) => {
      const allocated = balance.opening + balance.accrued;
      const used = balance.used;
      const remaining = balance.closing;
      const utilizationPercentage = allocated > 0 ? (used / allocated) * 100 : 0;

      return {
        employeeId: balance.userId,
        employeeName: balance.user.name,
        department: balance.user.department || 'Unassigned',
        leaveType: balance.type,
        allocated,
        used,
        remaining,
        utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
      };
    });
  }

  /**
   * Calculate leave trends over time
   */
  static async calculateLeaveTrends(
    periodType: 'monthly' | 'quarterly' | 'yearly',
    filters: AnalyticsFilters = {}
  ): Promise<LeaveTrend[]> {
    const startDate = filters.startDate || startOfYear(new Date());
    const endDate = filters.endDate || endOfYear(new Date());

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
          type: filters.leaveType as LeaveType,
        }),
      },
      include: {
        requester: {
          select: {
            id: true,
            department: true,
          },
        },
      },
    });

    // Group by period and leave type
    const trendsMap = new Map<string, Map<string, { days: number; employees: Set<number> }>>();

    for (const leave of leaves) {
      let period: string;

      if (periodType === 'monthly') {
        period = format(leave.startDate, 'yyyy-MM');
      } else if (periodType === 'quarterly') {
        const quarter = Math.floor(leave.startDate.getMonth() / 3) + 1;
        period = `${leave.startDate.getFullYear()}-Q${quarter}`;
      } else {
        period = leave.startDate.getFullYear().toString();
      }

      if (!trendsMap.has(period)) {
        trendsMap.set(period, new Map());
      }

      const periodMap = trendsMap.get(period)!;

      if (!periodMap.has(leave.type)) {
        periodMap.set(leave.type, { days: 0, employees: new Set() });
      }

      const typeData = periodMap.get(leave.type)!;
      typeData.days += leave.workingDays;
      typeData.employees.add(leave.requesterId);
    }

    // Convert to array
    const trends: LeaveTrend[] = [];

    trendsMap.forEach((periodMap, period) => {
      periodMap.forEach((data, leaveType) => {
        trends.push({
          period,
          leaveType,
          totalDays: data.days,
          employeeCount: data.employees.size,
          averageDaysPerEmployee:
            data.employees.size > 0
              ? Math.round((data.days / data.employees.size) * 10) / 10
              : 0,
        });
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get key metrics summary
   */
  static async getKeyMetrics(filters: AnalyticsFilters = {}) {
    const currentYear = new Date().getFullYear();
    const startDate = filters.startDate || startOfYear(new Date());
    const endDate = filters.endDate || new Date();

    // Total leaves taken
    const totalLeaves = await prisma.leaveRequest.count({
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
      },
    });

    // Total leave days
    const leavesData = await prisma.leaveRequest.findMany({
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
      },
      select: {
        workingDays: true,
      },
    });

    const totalLeaveDays = leavesData.reduce((sum, leave) => sum + leave.workingDays, 0);

    // Average approval time
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        approvals: {
          where: {
            decision: 'APPROVED',
          },
          orderBy: {
            decidedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    let totalApprovalTime = 0;
    let validApprovals = 0;

    for (const leave of approvedLeaves) {
      if (leave.approvals.length > 0 && leave.approvals[0].decidedAt) {
        const approvalTime =
          leave.approvals[0].decidedAt.getTime() - leave.createdAt.getTime();
        totalApprovalTime += approvalTime;
        validApprovals++;
      }
    }

    const avgApprovalTimeHours =
      validApprovals > 0 ? totalApprovalTime / validApprovals / (1000 * 60 * 60) : 0;

    // Pending approvals
    const pendingApprovals = await prisma.leaveRequest.count({
      where: {
        status: LeaveStatus.PENDING,
      },
    });

    return {
      totalLeaves,
      totalLeaveDays,
      averageLeaveDuration: totalLeaves > 0 ? totalLeaveDays / totalLeaves : 0,
      averageApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10,
      pendingApprovals,
    };
  }
}
