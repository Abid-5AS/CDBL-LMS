/**
 * Conversion Repository
 * Handles retrieval of leave conversion data from audit logs and leave requests
 */

import { prisma } from "@/lib/prisma";

export interface ConversionDetails {
  originalType: string;
  originalDays: number;
  conversions: Array<{
    type: string;
    days: number;
    reason?: string;
  }>;
  timestamp: Date | string;
  appliedBy: string;
  policy?: string;
  conversionType?: "ML_SPLIT" | "CL_SPLIT" | "CL_TO_EL" | "EL_OVERFLOW";
}

export interface ConversionRecord {
  id: number;
  date: string;
  leaveRequestId: number;
  conversionType: "ML_SPLIT" | "CL_SPLIT" | "CL_TO_EL" | "EL_OVERFLOW";
  originalType: string;
  originalDays: number;
  conversions: Array<{
    type: string;
    days: number;
  }>;
  appliedBy: string;
  policy: string;
}

/**
 * Get conversion details for a specific leave request
 */
export async function getLeaveConversionDetails(leaveId: number): Promise<ConversionDetails | null> {
  // Check audit logs for conversion information
  const auditLog = await prisma.auditLog.findFirst({
    where: {
      action: "LEAVE_APPROVE",
      details: {
        path: "$.leaveId",
        equals: leaveId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!auditLog || !auditLog.details) {
    return null;
  }

  const details = auditLog.details as any;

  // Check for ML conversion
  if (details.mlConversion?.applied) {
    const mlConversion = details.mlConversion;

    // Parse the breakdown text to extract conversion details
    // Format: "**Original Request:** 20 days Medical Leave\n**Auto-Conversion Applied (Policy 6.21.c):**\n  1. 14 days from Medical Leave balance\n  2. 4 days converted to Earned Leave (Policy 6.21.c)\n  3. 2 days converted to Special Leave (Policy 6.21.c)"
    const breakdownText = mlConversion.breakdown || "";
    const conversions: Array<{ type: string; days: number; reason?: string }> = [];

    // Extract original days
    const originalMatch = breakdownText.match(/(\d+) days Medical Leave/);
    const originalDays = originalMatch ? parseInt(originalMatch[1]) : 0;

    // Parse each conversion line
    const lines = breakdownText.split("\n");
    lines.forEach((line) => {
      if (line.match(/^\s*\d+\./)) {
        // Extract days and type
        const daysMatch = line.match(/(\d+) days/);
        const days = daysMatch ? parseInt(daysMatch[1]) : 0;

        let type = "MEDICAL";
        if (line.includes("Earned Leave")) {
          type = "EARNED";
        } else if (line.includes("Special")) {
          type = "SPECIAL";
        } else if (line.includes("Extraordinary")) {
          type = "EXTRAWITHOUTPAY";
        }

        let reason = undefined;
        if (line.includes("(Policy")) {
          const reasonMatch = line.match(/\(([^)]+)\)/);
          if (reasonMatch) {
            reason = reasonMatch[1];
          }
        }

        if (days > 0) {
          conversions.push({ type, days, reason });
        }
      }
    });

    return {
      originalType: "MEDICAL",
      originalDays,
      conversions,
      timestamp: auditLog.createdAt,
      appliedBy: details.actorRole || "System",
      policy: "Policy 6.21.c",
      conversionType: "ML_SPLIT",
    };
  }

  // Check for CL conversion
  if (details.clConversion?.applied) {
    const clConversion = details.clConversion;
    const breakdownText = clConversion.breakdown || "";
    const conversions: Array<{ type: string; days: number; reason?: string }> = [];

    // Extract original days
    const originalMatch = breakdownText.match(/(\d+) day\(s\) Casual Leave/);
    const originalDays = originalMatch ? parseInt(originalMatch[1]) : (clConversion.workingDays || 0);

    // Parse each conversion line
    const lines = breakdownText.split("\n");
    lines.forEach((line) => {
      if (line.match(/^\s*\d+\./)) {
        // Extract days and type
        const daysMatch = line.match(/(\d+) day\(s\)/);
        const days = daysMatch ? parseInt(daysMatch[1]) : 0;

        let type = "CASUAL";
        if (line.includes("Casual Leave balance")) {
          type = "CASUAL";
        } else if (line.includes("Earned Leave")) {
          type = "EARNED";
        }

        let reason = undefined;
        if (line.includes("(CL max is")) {
          reason = "CL limited to 3 days (Policy 6.20.d)";
        }

        if (days > 0) {
          conversions.push({ type, days, reason });
        }
      }
    });

    return {
      originalType: "CASUAL",
      originalDays,
      conversions,
      timestamp: auditLog.createdAt,
      appliedBy: details.actorRole || "System",
      policy: "Policy 6.20.d",
      conversionType: conversions.length > 1 ? "CL_SPLIT" : "CL_TO_EL",
    };
  }

  return null;
}

/**
 * Get conversion history for a user in a specific year
 */
export async function getUserConversionHistory(
  userId: number,
  year: number,
  limit?: number
): Promise<ConversionRecord[]> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  // Get all LEAVE_APPROVE audit logs for this user in this year
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: "LEAVE_APPROVE",
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...(limit && { take: limit }),
  });

  const conversions: ConversionRecord[] = [];

  for (const log of auditLogs) {
    if (!log.details) continue;
    const details = log.details as any;

    // Check if this audit log is for the specified user
    const leaveId = details.leaveId;
    if (!leaveId) continue;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      select: { requesterId: true, workingDays: true },
    });

    if (!leave || leave.requesterId !== userId) continue;

    // Check for ML conversion
    if (details.mlConversion?.applied) {
      const mlConversion = details.mlConversion;
      const breakdownText = mlConversion.breakdown || "";
      const conversions_items: Array<{ type: string; days: number }> = [];

      // Parse breakdown
      const originalMatch = breakdownText.match(/(\d+) days Medical Leave/);
      const originalDays = originalMatch ? parseInt(originalMatch[1]) : leave.workingDays;

      const lines = breakdownText.split("\n");
      lines.forEach((line) => {
        if (line.match(/^\s*\d+\./)) {
          const daysMatch = line.match(/(\d+) days/);
          const days = daysMatch ? parseInt(daysMatch[1]) : 0;

          let type = "MEDICAL";
          if (line.includes("Earned Leave")) type = "EARNED";
          else if (line.includes("Special")) type = "SPECIAL";
          else if (line.includes("Extraordinary")) type = "EXTRAWITHOUTPAY";

          if (days > 0) {
            conversions_items.push({ type, days });
          }
        }
      });

      conversions.push({
        id: log.id,
        date: log.createdAt.toISOString(),
        leaveRequestId: leaveId,
        conversionType: "ML_SPLIT",
        originalType: "MEDICAL",
        originalDays,
        conversions: conversions_items,
        appliedBy: details.actorRole || "System",
        policy: "Policy 6.21.c",
      });
    }

    // Check for CL conversion
    if (details.clConversion?.applied) {
      const clConversion = details.clConversion;
      const breakdownText = clConversion.breakdown || "";
      const conversions_items: Array<{ type: string; days: number }> = [];

      // Parse breakdown
      const originalMatch = breakdownText.match(/(\d+) day\(s\) Casual Leave/);
      const originalDays = originalMatch ? parseInt(originalMatch[1]) : (clConversion.workingDays || leave.workingDays);

      const lines = breakdownText.split("\n");
      lines.forEach((line) => {
        if (line.match(/^\s*\d+\./)) {
          const daysMatch = line.match(/(\d+) day\(s\)/);
          const days = daysMatch ? parseInt(daysMatch[1]) : 0;

          let type = "CASUAL";
          if (line.includes("Casual Leave balance")) type = "CASUAL";
          else if (line.includes("Earned Leave")) type = "EARNED";

          if (days > 0) {
            conversions_items.push({ type, days });
          }
        }
      });

      conversions.push({
        id: log.id,
        date: log.createdAt.toISOString(),
        leaveRequestId: leaveId,
        conversionType: conversions_items.length > 1 ? "CL_SPLIT" : "CL_TO_EL",
        originalType: "CASUAL",
        originalDays,
        conversions: conversions_items,
        appliedBy: details.actorRole || "System",
        policy: "Policy 6.20.d",
      });
    }
  }

  // Also check for EL overflow events
  const elOverflowLogs = await prisma.auditLog.findMany({
    where: {
      action: "EL_OVERFLOW_TO_SPECIAL",
      targetEmail: {
        not: null,
      },
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...(limit && { take: limit }),
  });

  for (const log of elOverflowLogs) {
    if (!log.details) continue;
    const details = log.details as any;

    if (details.userId !== userId) continue;

    const daysTransferred = details.daysTransferred || 0;
    const elBalanceBefore = details.elBalanceBefore || 0;

    conversions.push({
      id: log.id,
      date: log.createdAt.toISOString(),
      leaveRequestId: 0, // No associated leave request
      conversionType: "EL_OVERFLOW",
      originalType: "EARNED",
      originalDays: elBalanceBefore,
      conversions: [
        {
          type: "EARNED",
          days: 60, // Capped at 60
        },
        {
          type: "SPECIAL",
          days: daysTransferred,
        },
      ],
      appliedBy: log.actorEmail,
      policy: "Policy 6.19.c",
    });
  }

  // Sort by date descending
  conversions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return limit ? conversions.slice(0, limit) : conversions;
}

/**
 * Get conversion statistics for a user
 */
export async function getUserConversionStats(userId: number, year: number) {
  const conversions = await getUserConversionHistory(userId, year);

  const stats = {
    totalConversions: conversions.length,
    totalDaysConverted: conversions.reduce((sum, c) => sum + c.originalDays, 0),
    byType: {
      ML_SPLIT: conversions.filter((c) => c.conversionType === "ML_SPLIT").length,
      CL_SPLIT: conversions.filter((c) => c.conversionType === "CL_SPLIT").length,
      CL_TO_EL: conversions.filter((c) => c.conversionType === "CL_TO_EL").length,
      EL_OVERFLOW: conversions.filter((c) => c.conversionType === "EL_OVERFLOW").length,
    },
  };

  return stats;
}
