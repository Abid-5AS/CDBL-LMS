/**
 * Annual Balance Initialization Job
 *
 * Creates/refreshes CL and ML balances for a target year.
 * Policy: CL 10 days/year, ML 14 days/year.
 * Pro-rata for mid-year joiners based on join month.
 */

import { prisma } from "../../lib/prisma";
import { policy } from "../../lib/policy";
import { toZonedTime } from "date-fns-tz";

const DHAKA_TZ = "Asia/Dhaka";
const CL_PER_YEAR = policy.accrual.CL_PER_YEAR;
const ML_PER_YEAR = policy.accrual.ML_PER_YEAR;
const EL_PER_MONTH = policy.elAccrualPerMonth;

interface InitResult {
  userId: number;
  email: string;
  clAccrued: number;
  mlAccrued: number;
  prorated: boolean;
  retroactiveEL?: number;
}

/**
 * Calculate pro-rated CL/ML for mid-year joiners
 * @param joinDate - Employee join date
 * @param year - Target year
 * @returns { cl: number, ml: number, prorated: boolean }
 */
function prorateByJoinMonth(joinDate: Date, year: number): {
  cl: number;
  ml: number;
  prorated: boolean;
} {
  const join = toZonedTime(joinDate, DHAKA_TZ);
  const joinYear = join.getFullYear();

  if (joinYear > year) {
    return { cl: 0, ml: 0, prorated: true };
  }

  if (joinYear < year) {
    return { cl: CL_PER_YEAR, ml: ML_PER_YEAR, prorated: false };
  }

  const joinMonth = join.getMonth(); // 0-indexed
  const monthsRemaining = 12 - joinMonth;
  const cl = Math.round((CL_PER_YEAR * monthsRemaining) / 12);
  const ml = Math.round((ML_PER_YEAR * monthsRemaining) / 12);
  return { cl, ml, prorated: true };
}

export interface AnnualInitOptions {
  year?: number;
  proRata?: boolean; // default true - pro-rate for mid-year joiners
  overwrite?: boolean; // default false - only create if missing
  /** Mid-year launch: add retroactive EL for months Jan..current where employee had joined */
  retroactiveEL?: boolean;
}

/**
 * Initialize CL and ML balances for a target year
 */
export async function processAnnualBalanceInit(
  options: AnnualInitOptions = {}
): Promise<InitResult[]> {
  const targetYear = options.year ?? toZonedTime(new Date(), DHAKA_TZ).getFullYear();
  const proRata = options.proRata ?? true;
  const overwrite = options.overwrite ?? false;
  const retroactiveEL = options.retroactiveEL ?? false;
  const now = toZonedTime(new Date(), DHAKA_TZ);
  const currentMonth = now.getMonth(); // 0-indexed, month we're in
  const currentYear = now.getFullYear();

  console.log(
    `[Annual Balance Init] Initializing CL/ML for year ${targetYear}, proRata=${proRata}, overwrite=${overwrite}, retroactiveEL=${retroactiveEL}`
  );

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, email: true, joinDate: true },
  });

  const results: InitResult[] = [];

  for (const emp of employees) {
    if (!emp.joinDate) continue;

    const { cl, ml, prorated } = proRata
      ? prorateByJoinMonth(emp.joinDate, targetYear)
      : { cl: CL_PER_YEAR, ml: ML_PER_YEAR, prorated: false };

    if (cl <= 0 && ml <= 0) continue;

    for (const [leaveType, days] of [
      ["CASUAL", cl] as const,
      ["MEDICAL", ml] as const,
    ]) {
      if (days <= 0) continue;

      const existing = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: emp.id,
            type: leaveType,
            year: targetYear,
          },
        },
      });

      if (existing && !overwrite) continue;

      const used = existing?.used ?? 0;
      const newAccrued = overwrite ? days : (existing?.accrued ?? days);
      const newClosing = (existing?.opening ?? 0) + newAccrued - used;

      await prisma.balance.upsert({
        where: {
          userId_type_year: {
            userId: emp.id,
            type: leaveType,
            year: targetYear,
          },
        },
        create: {
          userId: emp.id,
          type: leaveType,
          year: targetYear,
          opening: 0,
          accrued: days,
          used: 0,
          closing: days,
        },
        update: {
          accrued: newAccrued,
          closing: newClosing,
        },
      });
    }

    let retroactiveELDays = 0;
    if (retroactiveEL && emp.joinDate && targetYear === currentYear) {
      const joinZoned = toZonedTime(new Date(emp.joinDate), DHAKA_TZ);
      const joinYear = joinZoned.getFullYear();
      const joinMonth = joinZoned.getMonth();
      if (joinYear <= targetYear) {
        const startMonth = joinYear < targetYear ? 0 : joinMonth;
        const endMonth = currentMonth;
        for (let m = startMonth; m <= endMonth; m++) {
          retroactiveELDays += EL_PER_MONTH;
        }
      }
    }

    if (retroactiveELDays > 0) {
      const existingEL = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: emp.id,
            type: "EARNED",
            year: targetYear,
          },
        },
      });
      const newAccrued = (existingEL?.accrued ?? 0) + retroactiveELDays;
      const newClosing = (existingEL?.opening ?? 0) + newAccrued - (existingEL?.used ?? 0);

      await prisma.balance.upsert({
        where: {
          userId_type_year: {
            userId: emp.id,
            type: "EARNED",
            year: targetYear,
          },
        },
        create: {
          userId: emp.id,
          type: "EARNED",
          year: targetYear,
          opening: 0,
          accrued: retroactiveELDays,
          used: 0,
          closing: retroactiveELDays,
        },
        update: {
          accrued: newAccrued,
          closing: newClosing,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorEmail: "system@cdbl.local",
          action: "EL_RETROACTIVE_ACCRUAL",
          targetEmail: emp.email,
          details: {
            userId: emp.id,
            year: targetYear,
            retroactiveDays: retroactiveELDays,
            reason: "Mid-year launch retroactive EL",
          },
        },
      });
    }

    results.push({
      userId: emp.id,
      email: emp.email,
      clAccrued: cl,
      mlAccrued: ml,
      prorated,
      ...(retroactiveELDays > 0 ? { retroactiveEL: retroactiveELDays } : {}),
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: "system@cdbl.local",
        action: "ANNUAL_BALANCE_INIT",
        targetEmail: emp.email,
        details: {
          userId: emp.id,
          year: targetYear,
          cl,
          ml,
          prorated,
          overwrite,
        },
      },
    });
  }

  console.log(`[Annual Balance Init] Completed: ${results.length} employees`);
  return results;
}

if (require.main === module) {
  processAnnualBalanceInit()
    .then((r) => {
      console.log("Annual Balance Init Results:", r.length);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
