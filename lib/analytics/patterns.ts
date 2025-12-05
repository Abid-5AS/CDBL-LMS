import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { addMonths, startOfMonth, getDay, differenceInDays, addDays } from 'date-fns';
import type { LeavePattern } from './types';

/**
 * Pattern Detection Engine
 * Detects suspicious leave patterns and potential abuse
 */
export class PatternDetector {
  /**
   * Detect Monday/Friday leave patterns (potential abuse)
   */
  static async detectMondayFridayPattern(
    lookbackMonths: number = 6,
    department?: string
  ): Promise<LeavePattern[]> {
    const startDate = addMonths(startOfMonth(new Date()), -lookbackMonths);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        type: {
          in: [LeaveType.CASUAL, LeaveType.EARNED],
        },
        startDate: {
          gte: startDate,
        },
        workingDays: {
          lte: 2, // Single day or 2-day leaves
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
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    // Group by employee and count Monday/Friday leaves
    const employeePatterns = new Map<
      number,
      {
        name: string;
        mondays: number;
        fridays: number;
        total: number;
      }
    >();

    for (const leave of leaves) {
      const dayOfWeek = getDay(leave.startDate); // 0 = Sunday, 1 = Monday, 5 = Friday

      if (!employeePatterns.has(leave.requesterId)) {
        employeePatterns.set(leave.requesterId, {
          name: leave.requester.name,
          mondays: 0,
          fridays: 0,
          total: 0,
        });
      }

      const pattern = employeePatterns.get(leave.requesterId)!;
      pattern.total++;

      if (dayOfWeek === 1) pattern.mondays++;
      if (dayOfWeek === 5) pattern.fridays++;
    }

    // Identify suspicious patterns (>40% of leaves on Mon/Fri)
    const patterns: LeavePattern[] = [];

    employeePatterns.forEach((data, employeeId) => {
      const monFriCount = data.mondays + data.fridays;
      const percentage = data.total > 0 ? (monFriCount / data.total) * 100 : 0;

      if (percentage > 40 && data.total >= 4) {
        patterns.push({
          employeeId,
          employeeName: data.name,
          patternType: 'monday_friday',
          occurrences: monFriCount,
          confidence: Math.min(percentage, 100),
          details: `${monFriCount} out of ${data.total} leaves (${Math.round(percentage)}%) taken on Mondays or Fridays`,
          riskLevel: percentage > 60 ? 'high' : percentage > 50 ? 'medium' : 'low',
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect long weekend extensions
   */
  static async detectLongWeekendPattern(
    lookbackMonths: number = 6,
    department?: string
  ): Promise<LeavePattern[]> {
    const startDate = addMonths(startOfMonth(new Date()), -lookbackMonths);

    // Get holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
      },
    });

    const holidayDates = new Set(holidays.map((h) => h.date.toDateString()));

    // Get approved leaves
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        type: {
          in: [LeaveType.CASUAL, LeaveType.EARNED],
        },
        startDate: {
          gte: startDate,
        },
        workingDays: {
          lte: 2,
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
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if leave is adjacent to a holiday or weekend
    const employeePatterns = new Map<number, { name: string; count: number }>();

    for (const leave of leaves) {
      const leaveDate = leave.startDate;
      let isLongWeekend = false;

      // Check 3 days before and after
      for (let offset = -3; offset <= 3; offset++) {
        if (offset === 0) continue;

        const checkDate = addDays(leaveDate, offset);
        const dayOfWeek = getDay(checkDate);

        // Check if adjacent to weekend or holiday
        if (
          dayOfWeek === 0 || // Sunday
          dayOfWeek === 6 || // Saturday
          holidayDates.has(checkDate.toDateString())
        ) {
          isLongWeekend = true;
          break;
        }
      }

      if (isLongWeekend) {
        if (!employeePatterns.has(leave.requesterId)) {
          employeePatterns.set(leave.requesterId, {
            name: leave.requester.name,
            count: 0,
          });
        }
        employeePatterns.get(leave.requesterId)!.count++;
      }
    }

    // Identify patterns (3+ long weekend extensions)
    const patterns: LeavePattern[] = [];

    employeePatterns.forEach((data, employeeId) => {
      if (data.count >= 3) {
        patterns.push({
          employeeId,
          employeeName: data.name,
          patternType: 'long_weekend',
          occurrences: data.count,
          confidence: Math.min(data.count * 25, 100),
          details: `${data.count} leaves taken adjacent to holidays or weekends`,
          riskLevel: data.count >= 5 ? 'high' : data.count >= 4 ? 'medium' : 'low',
        });
      }
    });

    return patterns.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Detect sick leave clustering (multiple sick leaves in short period)
   */
  static async detectSickLeaveClustering(
    lookbackMonths: number = 6,
    department?: string
  ): Promise<LeavePattern[]> {
    const startDate = addMonths(startOfMonth(new Date()), -lookbackMonths);

    const sickLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        type: LeaveType.MEDICAL,
        startDate: {
          gte: startDate,
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
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Group by employee
    const employeeLeaves = new Map<number, { name: string; leaves: Date[] }>();

    for (const leave of sickLeaves) {
      if (!employeeLeaves.has(leave.requesterId)) {
        employeeLeaves.set(leave.requesterId, {
          name: leave.requester.name,
          leaves: [],
        });
      }
      employeeLeaves.get(leave.requesterId)!.leaves.push(leave.startDate);
    }

    // Detect clustering (3+ sick leaves within 60 days)
    const patterns: LeavePattern[] = [];

    employeeLeaves.forEach((data, employeeId) => {
      if (data.leaves.length < 3) return;

      // Check for clusters
      for (let i = 0; i < data.leaves.length - 2; i++) {
        const windowEnd = addDays(data.leaves[i], 60);
        let clusterCount = 1;

        for (let j = i + 1; j < data.leaves.length; j++) {
          if (data.leaves[j] <= windowEnd) {
            clusterCount++;
          } else {
            break;
          }
        }

        if (clusterCount >= 3) {
          patterns.push({
            employeeId,
            employeeName: data.name,
            patternType: 'sick_clustering',
            occurrences: clusterCount,
            confidence: Math.min(clusterCount * 20, 100),
            details: `${clusterCount} sick leaves within a 60-day period`,
            riskLevel: clusterCount >= 5 ? 'high' : clusterCount >= 4 ? 'medium' : 'low',
          });
          break; // Only report once per employee
        }
      }
    });

    return patterns;
  }

  /**
   * Get all detected patterns for an employee
   */
  static async getEmployeePatterns(
    employeeId: number,
    lookbackMonths: number = 6
  ): Promise<LeavePattern[]> {
    const patterns: LeavePattern[] = [];

    // Run all detections
    const [mondayFriday, longWeekend, sickClustering] = await Promise.all([
      this.detectMondayFridayPattern(lookbackMonths),
      this.detectLongWeekendPattern(lookbackMonths),
      this.detectSickLeaveClustering(lookbackMonths),
    ]);

    // Filter for specific employee
    patterns.push(
      ...mondayFriday.filter((p) => p.employeeId === employeeId),
      ...longWeekend.filter((p) => p.employeeId === employeeId),
      ...sickClustering.filter((p) => p.employeeId === employeeId)
    );

    return patterns;
  }
}
