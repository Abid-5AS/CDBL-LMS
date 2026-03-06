/**
 * Year-End EL Rollover Job
 *
 * Policy 6.19: EL carries forward up to 60 days to next year
 * Excess above 60 transfers to SPECIAL (up to 120 days total)
 * Rules:
 * - Runs after auto-lapse (Jan 1)
 * - For each EARNED balance: closing up to 60 -> next year opening
 * - EL excess above 60 -> SPECIAL (cap 120)
 * - SPECIAL from prior year carries to next year opening (capped 120)
 */

import { prisma } from "../../lib/prisma";
import { policy } from "../../lib/policy";
import { toZonedTime } from "date-fns-tz";

const DHAKA_TZ = "Asia/Dhaka";
const EL_MAX_CARRY = policy.carryForwardCap.EL; // 60
const SPECIAL_MAX = 120;

interface RolloverResult {
  userId: number;
  email: string;
  elCarried: number;
  elExcessToSpecial: number;
  specialCarried: number;
}

/**
 * Process year-end EL rollover for all employees
 * @param sourceYear - Year to roll over from (defaults to previous year)
 */
export async function processYearEndRollover(
  sourceYear?: number
): Promise<RolloverResult[]> {
  const now = new Date();
  const zonedNow = toZonedTime(now, DHAKA_TZ);
  const yearFrom = sourceYear ?? zonedNow.getFullYear() - 1;
  const yearTo = yearFrom + 1;

  console.log(`[Year-End Rollover] Rolling EL from ${yearFrom} to ${yearTo}`);

  const results: RolloverResult[] = [];

  const elBalances = await prisma.balance.findMany({
    where: { type: "EARNED", year: yearFrom },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  for (const elBal of elBalances) {
    const closing = elBal.closing ?? (elBal.opening ?? 0) + (elBal.accrued ?? 0) - (elBal.used ?? 0);
    if (closing <= 0) continue;

    const elCarried = Math.min(closing, EL_MAX_CARRY);
    const elExcess = Math.max(0, closing - EL_MAX_CARRY);

    let specialCarried = 0;
    const specialBal = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: elBal.userId,
          type: "SPECIAL",
          year: yearFrom,
        },
      },
    });
    if (specialBal) {
      const specialClosing =
        (specialBal.opening ?? 0) + (specialBal.accrued ?? 0) - (specialBal.used ?? 0);
      specialCarried = Math.max(0, specialClosing);
    }

    const totalSpecialForNewYear = specialCarried + elExcess;
    const specialCapped = Math.min(totalSpecialForNewYear, SPECIAL_MAX);
    const elExcessToSpecial = Math.min(elExcess, specialCapped - specialCarried);

    if (elCarried > 0) {
      const existing = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: elBal.userId,
            type: "EARNED",
            year: yearTo,
          },
        },
      });
      const newOpening = existing ? (existing.opening ?? 0) + elCarried : elCarried;
      const newAccrued = existing?.accrued ?? 0;
      const newUsed = existing?.used ?? 0;
      const newClosing = newOpening + newAccrued - newUsed;

      await prisma.balance.upsert({
        where: {
          userId_type_year: {
            userId: elBal.userId,
            type: "EARNED",
            year: yearTo,
          },
        },
        create: {
          userId: elBal.userId,
          type: "EARNED",
          year: yearTo,
          opening: elCarried,
          accrued: 0,
          used: 0,
          closing: elCarried,
        },
        update: {
          opening: newOpening,
          closing: newClosing,
        },
      });
    }

    const finalSpecialOpening = specialCarried + elExcessToSpecial;
    if (finalSpecialOpening > 0) {
      const existingSpecial = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: elBal.userId,
            type: "SPECIAL",
            year: yearTo,
          },
        },
      });
      const newSpecOpening = existingSpecial
        ? (existingSpecial.opening ?? 0) + finalSpecialOpening
        : finalSpecialOpening;
      const newSpecClosing =
        newSpecOpening + (existingSpecial?.accrued ?? 0) - (existingSpecial?.used ?? 0);

      await prisma.balance.upsert({
        where: {
          userId_type_year: {
            userId: elBal.userId,
            type: "SPECIAL",
            year: yearTo,
          },
        },
        create: {
          userId: elBal.userId,
          type: "SPECIAL",
          year: yearTo,
          opening: finalSpecialOpening,
          accrued: 0,
          used: 0,
          closing: finalSpecialOpening,
        },
        update: {
          opening: newSpecOpening,
          closing: newSpecClosing,
        },
      });
    }

    results.push({
      userId: elBal.userId,
      email: elBal.user.email,
      elCarried,
      elExcessToSpecial,
      specialCarried,
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: "system@cdbl.local",
        action: "YEAR_END_ROLLOVER",
        targetEmail: elBal.user.email,
        details: {
          userId: elBal.userId,
          sourceYear: yearFrom,
          targetYear: yearTo,
          elCarried,
          elExcessToSpecial,
          specialCarried,
          previousElClosing: closing,
        },
      },
    });
  }

  console.log(`[Year-End Rollover] Completed: ${results.length} employees`);
  return results;
}

if (require.main === module) {
  processYearEndRollover()
    .then((results) => {
      console.log("Year-End Rollover Results:", results.length);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Year-End Rollover Error:", err);
      process.exit(1);
    });
}
