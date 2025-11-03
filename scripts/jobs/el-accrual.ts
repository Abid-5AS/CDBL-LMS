/**
 * Earned Leave Monthly Accrual Job
 * 
 * Policy 6.19: EL accrues 2 days per month while on duty
 * Rules:
 * - Runs monthly (first day of month at 00:00 Asia/Dhaka)
 * - Adds 2 days per month to EL balance
 * - Skips months when employee was on leave entire month
 * - Respects 60-day carry-forward cap
 * - Creates audit log entry EL_ACCRUED
 */

import { prisma } from "../../lib/prisma";
import { policy } from "../../lib/policy";
import { normalizeToDhakaMidnight } from "../../lib/date-utils";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

const DHAKA_TZ = "Asia/Dhaka";
const EL_MAX_CARRY = policy.carryForwardCap.EL; // 60 days

interface AccrualResult {
  userId: number;
  email: string;
  accrued: number;
  skipped: boolean;
  reason?: string;
}

/**
 * Check if employee was on approved leave for entire month
 * @param userId - User ID
 * @param monthStart - Start of month in Dhaka timezone
 * @param monthEnd - End of month in Dhaka timezone
 * @returns true if employee was on approved leave for entire month
 */
async function wasOnLeaveEntireMonth(
  userId: number,
  monthStart: Date,
  monthEnd: Date
): Promise<boolean> {
  // Find approved leaves that cover the entire month
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      status: "APPROVED",
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
  });

  if (leaves.length === 0) return false;

  // Check if the combined leave periods cover the entire month
  const leaveDays = new Set<number>();
  for (const leave of leaves) {
    const start = normalizeToDhakaMidnight(leave.startDate);
    const end = normalizeToDhakaMidnight(leave.endDate);
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    for (let time = startTime; time <= endTime; time += 86400000) {
      const day = new Date(time);
      const dayOfMonth = day.getDate();
      if (day.getMonth() === monthStart.getMonth() && day.getFullYear() === monthStart.getFullYear()) {
        leaveDays.add(dayOfMonth);
      }
    }
  }

  // Get total days in month
  const zonedStart = utcToZonedTime(monthStart, DHAKA_TZ);
  const zonedEnd = utcToZonedTime(monthEnd, DHAKA_TZ);
  const daysInMonth = zonedEnd.getDate(); // Last day of month = days in month
  
  // If leaveDays covers all days in month, employee was on leave entire month
  return leaveDays.size >= daysInMonth;
}

/**
 * Process EL accrual for all employees
 * @param targetMonth - Month to process accrual for (defaults to previous month)
 * @returns Array of accrual results
 */
export async function processELAccrual(targetMonth?: Date): Promise<AccrualResult[]> {
  // Default to previous month if not specified
  const now = new Date();
  const zonedNow = utcToZonedTime(now, DHAKA_TZ);
  const monthToProcess = targetMonth || new Date(zonedNow.getFullYear(), zonedNow.getMonth() - 1, 1);
  
  const monthStart = normalizeToDhakaMidnight(startOfMonth(monthToProcess));
  const monthEnd = normalizeToDhakaMidnight(endOfMonth(monthToProcess));
  const currentYear = monthToProcess.getFullYear();

  console.log(`[EL Accrual] Processing accrual for ${monthToProcess.toISOString().slice(0, 7)}`);

  // Get all employees
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, email: true },
  });

  const results: AccrualResult[] = [];

  for (const employee of employees) {
    // Check if employee was on leave entire month
    const skipped = await wasOnLeaveEntireMonth(employee.id, monthStart, monthEnd);
    
    if (skipped) {
      results.push({
        userId: employee.id,
        email: employee.email,
        accrued: 0,
        skipped: true,
        reason: "Employee was on approved leave for entire month",
      });
      continue;
    }

    // Get or create EL balance for current year
    let balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: employee.id,
          type: "EARNED",
          year: currentYear,
        },
      },
    });

    if (!balance) {
      // Create balance record if it doesn't exist
      balance = await prisma.balance.create({
        data: {
          userId: employee.id,
          type: "EARNED",
          year: currentYear,
          opening: 0,
          accrued: 0,
          used: 0,
          closing: 0,
        },
      });
    }

    // Check carry-forward cap
    const totalBeforeAccrual = (balance.opening || 0) + (balance.accrued || 0);
    const totalAfterAccrual = totalBeforeAccrual + policy.elAccrualPerMonth;

    if (totalAfterAccrual > EL_MAX_CARRY) {
      // Cap at 60 days total
      const maxAccruable = Math.max(0, EL_MAX_CARRY - totalBeforeAccrual);
      
      if (maxAccruable > 0) {
        const newAccrued = (balance.accrued || 0) + maxAccruable;
        const newClosing = (balance.opening || 0) + newAccrued - (balance.used || 0);

        await prisma.balance.update({
          where: { id: balance.id },
          data: {
            accrued: newAccrued,
            closing: newClosing,
          },
        });

        results.push({
          userId: employee.id,
          email: employee.email,
          accrued: maxAccruable,
          skipped: false,
          reason: `Capped at 60 days total (would have been ${policy.elAccrualPerMonth})`,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            actorEmail: "system@cdbl.local",
            action: "EL_ACCRUED",
            targetEmail: employee.email,
            details: {
              userId: employee.id,
              month: monthToProcess.toISOString().slice(0, 7),
              accrued: maxAccruable,
              capped: true,
              totalBalance: totalBeforeAccrual + maxAccruable,
            },
          },
        });
      } else {
        results.push({
          userId: employee.id,
          email: employee.email,
          accrued: 0,
          skipped: false,
          reason: "Already at 60-day carry-forward cap",
        });
      }
    } else {
      // Normal accrual
      const newAccrued = (balance.accrued || 0) + policy.elAccrualPerMonth;
      const newClosing = (balance.opening || 0) + newAccrued - (balance.used || 0);

      await prisma.balance.update({
        where: { id: balance.id },
        data: {
          accrued: newAccrued,
          closing: newClosing,
        },
      });

      results.push({
        userId: employee.id,
        email: employee.email,
        accrued: policy.elAccrualPerMonth,
        skipped: false,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorEmail: "system@cdbl.local",
          action: "EL_ACCRUED",
          targetEmail: employee.email,
          details: {
            userId: employee.id,
            month: monthToProcess.toISOString().slice(0, 7),
            accrued: policy.elAccrualPerMonth,
            totalBalance: totalAfterAccrual,
          },
        },
      });
    }
  }

  console.log(`[EL Accrual] Completed: ${results.length} employees processed`);
  return results;
}

// CLI entry point
if (require.main === module) {
  processELAccrual()
    .then((results) => {
      console.log("EL Accrual Results:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("EL Accrual Error:", error);
      process.exit(1);
    });
}

