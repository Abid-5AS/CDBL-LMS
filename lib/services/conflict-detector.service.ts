import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@/src/generated/prisma/client";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

export interface TeamMemberOnLeave {
  id: number;
  name: string;
  department: string | null;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  teamOnLeave: TeamMemberOnLeave[];
  totalTeamSize: number;
  availableMembers: number;
  capacityPercentage: number;
  severity: "low" | "medium" | "high" | "critical";
  suggestedAlternativeDates?: {
    startDate: Date;
    endDate: Date;
    capacity: number;
  }[];
  warningMessage?: string;
  blockSubmission: boolean;
}

export interface ConflictSettings {
  /**
   * Minimum team capacity percentage required
   * @default 50
   */
  minCapacity?: number;

  /**
   * Whether to block submission if capacity is below minimum
   * @default false (just warn)
   */
  blockOnLowCapacity?: boolean;

  /**
   * Number of alternative dates to suggest
   * @default 3
   */
  maxSuggestions?: number;
}

const DEFAULT_SETTINGS: Required<ConflictSettings> = {
  minCapacity: 50,
  blockOnLowCapacity: false,
  maxSuggestions: 3,
};

/**
 * ConflictDetectorService
 *
 * Handles detection of leave conflicts and team capacity analysis
 */
export class ConflictDetectorService {
  /**
   * Check for leave conflicts and calculate team capacity impact
   */
  static async checkLeaveConflicts(
    userId: number,
    startDate: Date,
    endDate: Date,
    settings: ConflictSettings = {}
  ): Promise<ConflictDetectionResult> {
    const config = { ...DEFAULT_SETTINGS, ...settings };

    try {
      // Get user's department info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          department: true,
          deptHeadId: true,
          deptHead: {
            select: {
              department: true,
            },
          },
        },
      });

      if (!user || !user.department) {
        // No department, no conflict
        return {
          hasConflict: false,
          teamOnLeave: [],
          totalTeamSize: 1,
          availableMembers: 1,
          capacityPercentage: 100,
          severity: "low",
          blockSubmission: false,
        };
      }

      // Get all team members in the same department
      const teamMembers = await prisma.user.findMany({
        where: {
          department: user.department,
        },
        select: {
          id: true,
        },
      });

      const totalTeamSize = teamMembers.length;

      // Get approved/pending leaves that overlap with the requested dates
      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where: {
          requesterId: {
            in: teamMembers.map((m) => m.id),
            not: userId, // Exclude the requester themselves
          },
          status: {
            in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
          },
          OR: [
            // Leave starts during requested period
            {
              startDate: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
              },
            },
            // Leave ends during requested period
            {
              endDate: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
              },
            },
            // Leave spans entire requested period
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
              department: true,
            },
          },
        },
      });

      // Map to team members on leave
      const teamOnLeave: TeamMemberOnLeave[] = overlappingLeaves.map(
        (leave) => ({
          id: leave.requester.id,
          name: leave.requester.name,
          department: leave.requester.department,
          leaveType: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
          workingDays: leave.workingDays,
        })
      );

      // Calculate unique members on leave (one person might have multiple leaves)
      const uniqueMembersOnLeave = new Set(teamOnLeave.map((m) => m.id)).size;

      // Include the requester as they'll also be on leave
      const totalOnLeave = uniqueMembersOnLeave + 1;
      const availableMembers = totalTeamSize - totalOnLeave;
      const capacityPercentage =
        totalTeamSize > 0 ? (availableMembers / totalTeamSize) * 100 : 100;

      // Determine severity
      let severity: "low" | "medium" | "high" | "critical" = "low";
      if (capacityPercentage < 25) severity = "critical";
      else if (capacityPercentage < 50) severity = "high";
      else if (capacityPercentage < 75) severity = "medium";

      // Determine if should block
      const blockSubmission =
        config.blockOnLowCapacity &&
        capacityPercentage < config.minCapacity;

      // Generate warning message
      let warningMessage: string | undefined;
      if (teamOnLeave.length > 0) {
        const memberNames = teamOnLeave
          .slice(0, 3)
          .map((m) => m.name)
          .join(", ");
        const remaining = teamOnLeave.length - 3;

        warningMessage =
          teamOnLeave.length <= 3
            ? `${memberNames} ${teamOnLeave.length === 1 ? "is" : "are"} also on leave during this period.`
            : `${memberNames} and ${remaining} other${remaining === 1 ? "" : "s"} are also on leave during this period.`;
      }

      // Generate suggested alternative dates if conflict exists
      let suggestedAlternativeDates:
        | { startDate: Date; endDate: Date; capacity: number }[]
        | undefined;

      if (severity === "high" || severity === "critical") {
        suggestedAlternativeDates =
          await this.suggestAlternativeDates(
            userId,
            startDate,
            endDate,
            config.maxSuggestions
          );
      }

      return {
        hasConflict: teamOnLeave.length > 0,
        teamOnLeave,
        totalTeamSize,
        availableMembers,
        capacityPercentage: Math.round(capacityPercentage * 10) / 10, // Round to 1 decimal
        severity,
        suggestedAlternativeDates,
        warningMessage,
        blockSubmission,
      };
    } catch (error) {
      console.error(
        "[ConflictDetectorService] Error checking conflicts:",
        error
      );
      // Fail gracefully - don't block user if service fails
      return {
        hasConflict: false,
        teamOnLeave: [],
        totalTeamSize: 1,
        availableMembers: 1,
        capacityPercentage: 100,
        severity: "low",
        blockSubmission: false,
      };
    }
  }

  /**
   * Suggest alternative dates with better team capacity
   */
  static async suggestAlternativeDates(
    userId: number,
    originalStartDate: Date,
    originalEndDate: Date,
    maxSuggestions: number = 3
  ): Promise<{ startDate: Date; endDate: Date; capacity: number }[]> {
    try {
      // Get user's department
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      if (!user || !user.department) {
        return [];
      }

      // Calculate leave duration in days
      const durationMs =
        originalEndDate.getTime() - originalStartDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      const suggestions: {
        startDate: Date;
        endDate: Date;
        capacity: number;
      }[] = [];

      // Check next 60 days for better dates
      const currentDate = new Date();
      const maxCheckDate = new Date();
      maxCheckDate.setDate(maxCheckDate.getDate() + 60);

      // Get team size
      const teamMembers = await prisma.user.findMany({
        where: { department: user.department },
        select: { id: true },
      });
      const totalTeamSize = teamMembers.length;

      // Check week by week
      for (let week = 0; week < 9 && suggestions.length < maxSuggestions; week++) {
        const checkStart = new Date(currentDate);
        checkStart.setDate(checkStart.getDate() + week * 7);

        const checkEnd = new Date(checkStart);
        checkEnd.setDate(checkEnd.getDate() + durationDays);

        if (checkEnd > maxCheckDate) break;

        // Skip if it's the original date range
        if (
          checkStart.getTime() === originalStartDate.getTime() &&
          checkEnd.getTime() === originalEndDate.getTime()
        ) {
          continue;
        }

        // Get leaves for this period
        const leavesInPeriod = await prisma.leaveRequest.findMany({
          where: {
            requesterId: { in: teamMembers.map((m) => m.id) },
            status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
            OR: [
              {
                startDate: {
                  gte: startOfDay(checkStart),
                  lte: endOfDay(checkEnd),
                },
              },
              {
                endDate: {
                  gte: startOfDay(checkStart),
                  lte: endOfDay(checkEnd),
                },
              },
              {
                AND: [
                  { startDate: { lte: startOfDay(checkStart) } },
                  { endDate: { gte: endOfDay(checkEnd) } },
                ],
              },
            ],
          },
        });

        const uniqueOnLeave = new Set(leavesInPeriod.map((l) => l.requesterId))
          .size;
        const available = totalTeamSize - uniqueOnLeave - 1; // -1 for requester
        const capacity = (available / totalTeamSize) * 100;

        // Only suggest if capacity is >75%
        if (capacity > 75) {
          suggestions.push({
            startDate: checkStart,
            endDate: checkEnd,
            capacity: Math.round(capacity * 10) / 10,
          });
        }
      }

      // Sort by capacity (highest first)
      return suggestions
        .sort((a, b) => b.capacity - a.capacity)
        .slice(0, maxSuggestions);
    } catch (error) {
      console.error(
        "[ConflictDetectorService] Error suggesting alternatives:",
        error
      );
      return [];
    }
  }

  /**
   * Get conflict settings from database (for future admin configuration)
   */
  static async getConflictSettings(): Promise<ConflictSettings> {
    // For now, return defaults
    // In the future, fetch from OrgSettings table
    return DEFAULT_SETTINGS;
  }
}
