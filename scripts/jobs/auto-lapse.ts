/**
 * Casual Leave Auto-Lapse Job
 * 
 * Policy 6.16: CL lapses on December 31
 * Rules:
 * - Runs annually on Dec 31 23:59 Asia/Dhaka
 * - Sets CL balance to 0 for all employees
 * - Resets opening, accrued, used, closing for CL type
 * - Creates audit log entry CL_LAPSED
 */

import { prisma } from "../../lib/prisma";
import { normalizeToDhakaMidnight } from "../../lib/date-utils";
import { utcToZonedTime } from "date-fns-tz";

const DHAKA_TZ = "Asia/Dhaka";

interface LapseResult {
  userId: number;
  email: string;
  previousBalance: number;
}

/**
 * Process CL auto-lapse for all employees
 * @param targetYear - Year to lapse CL for (defaults to current year)
 * @returns Array of lapse results
 */
export async function processCLLapse(targetYear?: number): Promise<LapseResult[]> {
  const now = new Date();
  const zonedNow = utcToZonedTime(now, DHAKA_TZ);
  const yearToLapse = targetYear || zonedNow.getFullYear();

  console.log(`[CL Auto-Lapse] Processing lapse for year ${yearToLapse}`);

  // Get all CL balances for the year
  const clBalances = await prisma.balance.findMany({
    where: {
      type: "CASUAL",
      year: yearToLapse,
    },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  const results: LapseResult[] = [];

  for (const balance of clBalances) {
    const previousBalance = (balance.opening || 0) + (balance.accrued || 0) - (balance.used || 0);

    // Only lapse if there's a positive balance
    if (previousBalance > 0) {
      // Reset CL balance to 0
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
        previousBalance,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorEmail: "system@cdbl.local",
          action: "CL_LAPSED",
          targetEmail: balance.user.email,
          details: {
            userId: balance.userId,
            year: yearToLapse,
            previousBalance,
            lapsedAmount: previousBalance,
          },
        },
      });
    }
  }

  console.log(`[CL Auto-Lapse] Completed: ${results.length} balances lapsed`);
  return results;
}

// CLI entry point
if (require.main === module) {
  processCLLapse()
    .then((results) => {
      console.log("CL Lapse Results:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("CL Lapse Error:", error);
      process.exit(1);
    });
}

