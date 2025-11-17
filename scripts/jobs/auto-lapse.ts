/**
 * Annual Leave Auto-Lapse Job
 *
 * Policy 6.16: All leave except EL lapses on December 31
 * Policy 6.21.a: Medical leave does not carry forward
 * Rules:
 * - Runs annually on Dec 31 23:59 Asia/Dhaka
 * - Resets balances for CL, ML, and QUARANTINE leave types
 * - EL carries forward up to 60 days (handled by separate job)
 * - Creates audit log entries for each lapsed leave type
 */

import { prisma } from "../../lib/prisma";
import { normalizeToDhakaMidnight } from "../../lib/date-utils";
import { toZonedTime } from "date-fns-tz";
import { LeaveType } from "@prisma/client";

const DHAKA_TZ = "Asia/Dhaka";

// Leave types that lapse annually (do not carry forward)
const LAPSING_LEAVE_TYPES: LeaveType[] = ["CASUAL", "MEDICAL", "QUARANTINE"];

interface LapseResult {
  userId: number;
  email: string;
  leaveType: LeaveType;
  previousBalance: number;
}

/**
 * Process annual leave lapse for all lapsing leave types
 * @param targetYear - Year to lapse leave for (defaults to current year)
 * @returns Array of lapse results
 */
export async function processAnnualLapse(targetYear?: number): Promise<LapseResult[]> {
  const now = new Date();
  const zonedNow = toZonedTime(now, DHAKA_TZ);
  const yearToLapse = targetYear || zonedNow.getFullYear();

  console.log(`[Annual Leave Lapse] Processing lapse for year ${yearToLapse}`);
  console.log(`[Annual Leave Lapse] Lapsing types: ${LAPSING_LEAVE_TYPES.join(", ")}`);

  const results: LapseResult[] = [];

  // Process each lapsing leave type
  for (const leaveType of LAPSING_LEAVE_TYPES) {
    const balances = await prisma.balance.findMany({
      where: {
        type: leaveType,
        year: yearToLapse,
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    console.log(`[Annual Leave Lapse] Processing ${balances.length} ${leaveType} balances`);

    for (const balance of balances) {
      const previousBalance = (balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0);

      // Only lapse if there's a positive balance
      if (previousBalance > 0) {
        // Reset balance to 0
        await prisma.balance.update({
          where: { id: balance.id },
          data: {
            opening: 0,
            accrued: 0,
            used: 0,
            closing: 0,
          },
        });

        results.push({
          userId: balance.userId,
          email: balance.user.email,
          leaveType,
          previousBalance,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            actorEmail: "system@cdbl.local",
            action: `${leaveType}_LAPSED`,
            targetEmail: balance.user.email,
            details: {
              userId: balance.userId,
              leaveType,
              year: yearToLapse,
              previousBalance,
              lapsedAmount: previousBalance,
            },
          },
        });
      }
    }
  }

  console.log(`[Annual Leave Lapse] Completed: ${results.length} balances lapsed`);
  return results;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processAnnualLapse() instead
 */
export async function processCLLapse(targetYear?: number): Promise<LapseResult[]> {
  return processAnnualLapse(targetYear);
}

// CLI entry point
if (require.main === module) {
  processAnnualLapse()
    .then((results) => {
      console.log("Annual Leave Lapse Results:");
      console.log(`Total balances lapsed: ${results.length}`);

      // Group by leave type for summary
      const summary = results.reduce((acc, r) => {
        acc[r.leaveType] = (acc[r.leaveType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("Summary by type:", summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Annual Leave Lapse Error:", error);
      process.exit(1);
    });
}

