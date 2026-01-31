import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType } from "@/src/generated/prisma/client";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isWeekend,
  format,
  addDays,
} from "date-fns";

export interface TeamMemberLeave {
  userId: number;
  userName: string;
  leaveType: LeaveType;
  leaveId: number;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
}

export interface DayCapacity {
  date: Date;
  dateString: string; // "2025-12-01"
  totalTeamSize: number;
  onLeave: number;
  available: number;
  capacityPercentage: number;
  isWeekend: boolean;
  isHoliday: boolean;
  leaves: TeamMemberLeave[];
}

export interface TeamCapacityResult {
  startDate: Date;
  endDate: Date;
  department: string;
  totalTeamSize: number;
  dailyCapacity: DayCapacity[];
  criticalDays: DayCapacity[]; // Days with <50% capacity
  averageCapacity: number;
  minCapacity: number;
  maxCapacity: number;
}

/**
 * TeamCapacityService
 *
 * Calculates and tracks team capacity for DEPT_HEAD
 */
export class TeamCapacityService {
  /**
   * Get team capacity for a date range
   */
  static async getTeamCapacity(
    deptHeadId: number,
    startDate: Date,
    endDate: Date
  ): Promise<TeamCapacityResult | null> {
    try {
      // Get dept head user
      const deptHead = await prisma.user.findUnique({
        where: { id: deptHeadId },
        select: {
          department: true,
          teamMembers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!deptHead || !deptHead.department) {
        return null;
      }

      const teamMemberIds = deptHead.teamMembers.map((m) => m.id);
      const totalTeamSize = teamMemberIds.length;

      // Get all leaves in the date range
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          requesterId: { in: teamMemberIds },
          status: {
            in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
          },
          OR: [
            {
              startDate: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
              },
            },
            {
              endDate: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
              },
            },
            {
              AND: [
                { startDate: { lte: startOfDay(startDate) } },
                { endDate: { gte: endOfDay(endDate) } },
              ],
            },
          ],
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
          startDate: "asc",
        },
      });

      // Get holidays
      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate),
          },
        },
        select: {
          date: true,
        },
      });

      const holidayDates = new Set(
        holidays.map((h) => format(h.date, "yyyy-MM-dd"))
      );

      // Calculate daily capacity
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyCapacity: DayCapacity[] = [];

      for (const day of days) {
        const dateString = format(day, "yyyy-MM-dd");
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        // Find leaves that overlap with this day
        const leavesOnDay = leaves.filter((leave) => {
          return (
            leave.startDate <= dayEnd &&
            leave.endDate >= dayStart
          );
        });

        const uniqueUsersOnLeave = new Set(
          leavesOnDay.map((l) => l.requesterId)
        ).size;

        const available = totalTeamSize - uniqueUsersOnLeave;
        const capacityPercentage =
          totalTeamSize > 0 ? (available / totalTeamSize) * 100 : 100;

        dailyCapacity.push({
          date: day,
          dateString,
          totalTeamSize,
          onLeave: uniqueUsersOnLeave,
          available,
          capacityPercentage: Math.round(capacityPercentage * 10) / 10,
          isWeekend: isWeekend(day),
          isHoliday: holidayDates.has(dateString),
          leaves: leavesOnDay.map((l) => ({
            userId: l.requester.id,
            userName: l.requester.name,
            leaveType: l.type,
            leaveId: l.id,
            startDate: l.startDate,
            endDate: l.endDate,
            status: l.status,
          })),
        });
      }

      // Calculate statistics
      const workingDays = dailyCapacity.filter(
        (d) => !d.isWeekend && !d.isHoliday
      );
      const averageCapacity =
        workingDays.length > 0
          ? workingDays.reduce((sum, d) => sum + d.capacityPercentage, 0) /
          workingDays.length
          : 100;

      const minCapacity =
        workingDays.length > 0
          ? Math.min(...workingDays.map((d) => d.capacityPercentage))
          : 100;

      const maxCapacity =
        workingDays.length > 0
          ? Math.max(...workingDays.map((d) => d.capacityPercentage))
          : 100;

      const criticalDays = workingDays.filter((d) => d.capacityPercentage < 50);

      return {
        startDate,
        endDate,
        department: deptHead.department,
        totalTeamSize,
        dailyCapacity,
        criticalDays,
        averageCapacity: Math.round(averageCapacity * 10) / 10,
        minCapacity: Math.round(minCapacity * 10) / 10,
        maxCapacity: Math.round(maxCapacity * 10) / 10,
      };
    } catch (error) {
      console.error(
        "[TeamCapacityService] Error getting team capacity:",
        error
      );
      return null;
    }
  }

  /**
   * Get team leave overview for current month
   */
  static async getTeamLeaveOverview(deptHeadId: number) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return await this.getTeamCapacity(deptHeadId, startOfMonth, endOfMonth);
    } catch (error) {
      console.error(
        "[TeamCapacityService] Error getting team overview:",
        error
      );
      return null;
    }
  }

  /**
   * Analyze team capacity for a department (used by API)
   */
  static async analyzeTeamCapacity(
    department: string,
    daysAhead: number = 30
  ): Promise<TeamCapacityResult | null> {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, daysAhead);

      // Get all users in the department
      const teamMembers = await prisma.user.findMany({
        where: { department },
        select: { id: true, name: true },
      });

      if (teamMembers.length === 0) {
        return null;
      }

      const teamMemberIds = teamMembers.map((m) => m.id);
      const totalTeamSize = teamMembers.length;

      // Reuse the core calculation logic
      return await this.calculateCapacity(
        department,
        teamMemberIds,
        totalTeamSize,
        startDate,
        endDate
      );
    } catch (error) {
      console.error(
        "[TeamCapacityService] Error analyzing team capacity:",
        error
      );
      return null;
    }
  }

  /**
   * Check for capacity conflicts (used by LeaveService)
   */
  static async checkConflicts(
    department: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    hasConflict: boolean;
    conflictDays: { date: Date; capacityPercentage: number }[];
    message?: string;
  }> {
    const CONFLICT_THRESHOLD = 20; // Warning if > 20% absent (capacity < 80%)

    const capacity = await this.analyzeTeamCapacity(department,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    if (!capacity) return { hasConflict: false, conflictDays: [] };

    // Filter for working days in the requested range
    const conflictDays = capacity.dailyCapacity
      .filter((day) => {
        const dayDate = new Date(day.date);
        return (
          !day.isWeekend &&
          !day.isHoliday &&
          dayDate >= startOfDay(startDate) &&
          dayDate <= endOfDay(endDate) &&
          // Check if adding one more person (the requester) would breach threshold
          // Current capacity % is based on current absent.
          // New absent = onLeave + 1
          // New Capacity = ((Total - (OnLeave + 1)) / Total) * 100
          ((day.totalTeamSize - (day.onLeave + 1)) / day.totalTeamSize) * 100 < (100 - CONFLICT_THRESHOLD)
        );
      })
      .map((day) => ({
        date: day.date,
        capacityPercentage: day.capacityPercentage,
      }));

    if (conflictDays.length > 0) {
      return {
        hasConflict: true,
        conflictDays,
        message: `Warning: Team absence will exceed ${CONFLICT_THRESHOLD}% on ${conflictDays.length} day(s).`,
      };
    }

    return { hasConflict: false, conflictDays: [] };
  }

  /**
   * Core calculation logic
   */
  private static async calculateCapacity(
    department: string,
    teamMemberIds: number[],
    totalTeamSize: number,
    startDate: Date,
    endDate: Date
  ): Promise<TeamCapacityResult> {
    // Get all leaves in the date range
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: teamMemberIds },
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        OR: [
          {
            startDate: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          },
          {
            endDate: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          },
          {
            AND: [
              { startDate: { lte: startOfDay(startDate) } },
              { endDate: { gte: endOfDay(endDate) } },
            ],
          },
        ],
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
        startDate: "asc",
      },
    });

    // Get holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        date: true,
      },
    });

    const holidayDates = new Set(
      holidays.map((h) => format(h.date, "yyyy-MM-dd"))
    );

    // Calculate daily capacity
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyCapacity: DayCapacity[] = [];

    for (const day of days) {
      const dateString = format(day, "yyyy-MM-dd");
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Find leaves that overlap with this day
      const leavesOnDay = leaves.filter((leave) => {
        return (
          leave.startDate <= dayEnd &&
          leave.endDate >= dayStart
        );
      });

      const uniqueUsersOnLeave = new Set(
        leavesOnDay.map((l) => l.requesterId)
      ).size;

      const available = totalTeamSize - uniqueUsersOnLeave;
      const capacityPercentage =
        totalTeamSize > 0 ? (available / totalTeamSize) * 100 : 100;

      dailyCapacity.push({
        date: day,
        dateString,
        totalTeamSize,
        onLeave: uniqueUsersOnLeave,
        available,
        capacityPercentage: Math.round(capacityPercentage * 10) / 10,
        isWeekend: isWeekend(day),
        isHoliday: holidayDates.has(dateString),
        leaves: leavesOnDay.map((l) => ({
          userId: l.requester.id,
          userName: l.requester.name,
          leaveType: l.type,
          leaveId: l.id,
          startDate: l.startDate,
          endDate: l.endDate,
          status: l.status,
        })),
      });
    }

    // Calculate statistics
    const workingDays = dailyCapacity.filter(
      (d) => !d.isWeekend && !d.isHoliday
    );
    const averageCapacity =
      workingDays.length > 0
        ? workingDays.reduce((sum, d) => sum + d.capacityPercentage, 0) /
        workingDays.length
        : 100;

    const minCapacity =
      workingDays.length > 0
        ? Math.min(...workingDays.map((d) => d.capacityPercentage))
        : 100;

    const maxCapacity =
      workingDays.length > 0
        ? Math.max(...workingDays.map((d) => d.capacityPercentage))
        : 100;

    const criticalDays = workingDays.filter((d) => d.capacityPercentage < 50);

    return {
      startDate,
      endDate,
      department,
      totalTeamSize,
      dailyCapacity,
      criticalDays,
      averageCapacity: Math.round(averageCapacity * 10) / 10,
      minCapacity: Math.round(minCapacity * 10) / 10,
      maxCapacity: Math.round(maxCapacity * 10) / 10,
    };
  }

  /**
   * Get upcoming critical capacity days
   */
  static async getUpcomingCriticalDays(
    deptHeadId: number,
    daysAhead: number = 30
  ) {
    try {
      const now = new Date();
      const endDate = addDays(now, daysAhead);

      const capacity = await this.getTeamCapacity(deptHeadId, now, endDate);
      return capacity?.criticalDays || [];
    } catch (error) {
      console.error(
        "[TeamCapacityService] Error getting critical days:",
        error
      );
      return [];
    }
  }
}
