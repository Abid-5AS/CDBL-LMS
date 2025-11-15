/**
 * EL Overflow to SPECIAL Leave Logic (Policy 6.19.c)
 *
 * Per CDBL Policy 6.19(c):
 * "Any period earned in excess of 60 days shall be credited up to 180 days
 * to a separate item in the leave account as special leave from which leave
 * may be allowed on full pay on medical ground or for rest and recreation
 * outside Bangladesh."
 *
 * Implementation:
 * - EL can accumulate up to 60 days (cap)
 * - Any EL beyond 60 days automatically transfers to SPECIAL
 * - SPECIAL can accumulate up to 120 days (total limit: 60 EL + 120 SPECIAL = 180)
 * - This overflow should happen:
 *   1. During monthly accrual
 *   2. When leave is cancelled (balance restored)
 *   3. When balance is manually adjusted
 *   4. Any time EL closing balance exceeds 60
 */

import { prisma } from "@/lib/prisma";
import { policy } from "@/lib/policy";

const EL_MAX_CARRY = policy.carryForwardCap.EL; // 60 days
const SPECIAL_MAX = 120; // Policy 6.19.c: up to 180 total (60 EL + 120 SPECIAL)

export interface ELOverflowResult {
  overflowApplied: boolean;
  excessDays: number;
  daysTransferred: number;
  elBalanceAfter: number;
  specialBalanceAfter: number;
  specialSpaceAvailable: number;
  reason?: string;
}

/**
 * Process EL overflow to SPECIAL when EL balance exceeds 60 days
 *
 * @param userId - User ID
 * @param year - Year of balance
 * @param actorEmail - Email of actor triggering the overflow (for audit)
 * @param reason - Reason for overflow (e.g., "leave_cancelled", "monthly_accrual")
 * @returns Overflow result with details
 */
export async function processELOverflow(
  userId: number,
  year: number,
  actorEmail: string = "system@cdbl.local",
  reason: string = "balance_adjustment"
): Promise<ELOverflowResult> {
  // Get EL balance
  const elBalance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId,
        type: "EARNED",
        year,
      },
    },
  });

  if (!elBalance) {
    return {
      overflowApplied: false,
      excessDays: 0,
      daysTransferred: 0,
      elBalanceAfter: 0,
      specialBalanceAfter: 0,
      specialSpaceAvailable: 0,
      reason: "No EL balance found",
    };
  }

  // Calculate current EL total
  const elTotal = (elBalance.opening || 0) + (elBalance.accrued || 0) - (elBalance.used || 0);

  // Check if overflow is needed
  if (elTotal <= EL_MAX_CARRY) {
    return {
      overflowApplied: false,
      excessDays: 0,
      daysTransferred: 0,
      elBalanceAfter: elTotal,
      specialBalanceAfter: 0,
      specialSpaceAvailable: 0,
      reason: "EL balance within limit",
    };
  }

  // Calculate excess
  const excessDays = elTotal - EL_MAX_CARRY;

  // Get or create SPECIAL balance
  let specialBalance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId,
        type: "SPECIAL",
        year,
      },
    },
  });

  if (!specialBalance) {
    specialBalance = await prisma.balance.create({
      data: {
        userId,
        type: "SPECIAL",
        year,
        opening: 0,
        accrued: 0,
        used: 0,
        closing: 0,
      },
    });
  }

  // Calculate SPECIAL space available
  const specialTotal = (specialBalance.opening || 0) + (specialBalance.accrued || 0) - (specialBalance.used || 0);
  const specialSpaceAvailable = Math.max(0, SPECIAL_MAX - specialTotal);

  // Calculate how much to transfer
  const daysTransferred = Math.min(excessDays, specialSpaceAvailable);

  if (daysTransferred === 0) {
    return {
      overflowApplied: false,
      excessDays,
      daysTransferred: 0,
      elBalanceAfter: elTotal,
      specialBalanceAfter: specialTotal,
      specialSpaceAvailable: 0,
      reason: "SPECIAL balance full (max 120 days)",
    };
  }

  // Transfer excess from EL to SPECIAL
  // Reduce EL closing balance by transferring to SPECIAL
  const newELClosing = EL_MAX_CARRY; // Cap at 60
  const newSpecialAccrued = (specialBalance.accrued || 0) + daysTransferred;
  const newSpecialClosing = (specialBalance.opening || 0) + newSpecialAccrued - (specialBalance.used || 0);

  // Update EL balance
  await prisma.balance.update({
    where: { id: elBalance.id },
    data: {
      closing: newELClosing,
      // Transfer excess from accrued to SPECIAL
      accrued: Math.max(0, (elBalance.accrued || 0) - daysTransferred),
    },
  });

  // Update SPECIAL balance
  await prisma.balance.update({
    where: { id: specialBalance.id },
    data: {
      accrued: newSpecialAccrued,
      closing: newSpecialClosing,
    },
  });

  // Create audit log
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail,
      action: "EL_OVERFLOW_TO_SPECIAL",
      targetEmail: user?.email || `user-${userId}`,
      details: {
        userId,
        year,
        reason,
        elExcess: excessDays,
        daysTransferred,
        elBalanceBefore: elTotal,
        elBalanceAfter: newELClosing,
        specialBalanceBefore: specialTotal,
        specialBalanceAfter: newSpecialClosing,
      },
    },
  });

  return {
    overflowApplied: true,
    excessDays,
    daysTransferred,
    elBalanceAfter: newELClosing,
    specialBalanceAfter: newSpecialClosing,
    specialSpaceAvailable: SPECIAL_MAX - newSpecialClosing,
  };
}

/**
 * Check if EL overflow will occur for a given balance
 * @param opening - Opening balance
 * @param accrued - Accrued balance
 * @param used - Used balance
 * @returns True if overflow will occur
 */
export function willELOverflow(opening: number, accrued: number, used: number): boolean {
  const total = (opening || 0) + (accrued || 0) - (used || 0);
  return total > EL_MAX_CARRY;
}
