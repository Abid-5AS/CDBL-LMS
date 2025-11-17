import { addDays } from "date-fns";
import { prisma } from "./prisma";
import {
  normalizeToDhakaMidnight,
  isWeekendOrHoliday,
  type Holiday,
} from "./date-utils";

export async function fetchHolidaysInRange(
  start: Date,
  end: Date
): Promise<Holiday[]> {
  const normalizedStart = normalizeToDhakaMidnight(start);
  const normalizedEnd = normalizeToDhakaMidnight(end);

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: normalizedStart,
        lte: normalizedEnd,
      },
    },
    select: {
      date: true,
      name: true,
    },
  });

  return holidays.map((holiday) => ({
    date: normalizeToDhakaMidnight(holiday.date).toISOString().slice(0, 10),
    name: holiday.name,
  }));
}

function isNonWorking(date: Date, holidays: Holiday[]): boolean {
  const normalized = normalizeToDhakaMidnight(date);
  return isWeekendOrHoliday(normalized, holidays);
}

type CasualLeaveValidationOptions = {
  holidays?: Holiday[];
};

/**
 * Check if Casual Leave violates the holiday rules (Policy 6.20.e)
 *
 * CL is the STRICTEST leave type. Per Policy 6.20(e):
 * "Casual leave cannot be combined with any other leave or preceded or succeeded by any holidays."
 *
 * Rules (BOTH must be satisfied):
 * A) CL dates must be PURE WORKING DAYS (no holidays/weekends within CL dates)
 * B) CL cannot be ADJACENT to holidays (day before start / day after end cannot be holiday)
 *
 * Updated 2025-11-14: Clarified that BOTH rules A and B apply
 */
export async function violatesCasualLeaveSideTouch(
  start: Date,
  end: Date,
  options: CasualLeaveValidationOptions = {}
): Promise<boolean> {
  const normalizedStart = normalizeToDhakaMidnight(start);
  const normalizedEnd = normalizeToDhakaMidnight(end);

  const rangeStart = addDays(normalizedStart, -1);
  const rangeEnd = addDays(normalizedEnd, 1);

  const holidays =
    options.holidays ?? (await fetchHolidaysInRange(rangeStart, rangeEnd));

  // Rule A: Check EVERY day in CL range is a working day (no holidays/weekends within CL)
  let currentDate = new Date(normalizedStart);
  while (currentDate <= normalizedEnd) {
    if (isNonWorking(currentDate, holidays)) {
      return true; // CL contains a holiday/weekend → violation
    }
    currentDate = addDays(currentDate, 1);
  }

  // Rule B: Check day before start and day after end are working days (no adjacency to holidays)
  const beforeStart = addDays(normalizedStart, -1);
  const afterEnd = addDays(normalizedEnd, 1);

  return (
    isNonWorking(beforeStart, holidays) || isNonWorking(afterEnd, holidays)
  );
}

/**
 * Check if Casual Leave violates combination rule (Policy 6.20.e)
 * CL cannot be combined with any other leave (cannot be adjacent to other approved/pending leaves)
 */
export async function violatesCasualLeaveCombination(
  userId: number,
  start: Date,
  end: Date
): Promise<{
  violates: boolean;
  conflictingLeave?: {
    id: number;
    type: string;
    startDate: Date;
    endDate: Date;
  };
}> {
  const normalizedStart = normalizeToDhakaMidnight(start);
  const normalizedEnd = normalizeToDhakaMidnight(end);

  // Check for adjacent or overlapping leaves
  const dayBefore = addDays(normalizedStart, -1);
  const dayAfter = addDays(normalizedEnd, 1);

  const adjacentLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      status: { in: ["APPROVED", "PENDING", "SUBMITTED"] },
      OR: [
        // Leave ending on day before CL starts (adjacent before)
        { endDate: dayBefore },
        // Leave starting on day after CL ends (adjacent after)
        { startDate: dayAfter },
        // Leave overlapping with CL dates
        {
          AND: [
            { startDate: { lte: normalizedEnd } },
            { endDate: { gte: normalizedStart } },
          ],
        },
      ],
    },
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
    },
    take: 1, // Only need one conflicting leave
  });

  if (adjacentLeaves.length > 0) {
    const conflict = adjacentLeaves[0];
    return {
      violates: true,
      conflictingLeave: {
        id: conflict.id,
        type: conflict.type,
        startDate: conflict.startDate,
        endDate: conflict.endDate,
      },
    };
  }

  return { violates: false };
}

/**
 * Check if maternity leave can be cancelled (Policy - Master Spec)
 *
 * Rule: Maternity leave CANNOT be cancelled after it has started
 * Clarified 2025-11-14: Hard block on maternity cancellation after start date
 *
 * @param leave - Leave request object with type and startDate
 * @param today - Current date (defaults to now)
 * @returns Object with canCancel boolean and reason if blocked
 */
export function canCancelMaternityLeave(
  leave: {
    type: string;
    startDate: Date;
  },
  today: Date = new Date()
): {
  canCancel: boolean;
  reason?: string;
} {
  // Only applies to maternity leave and special disability leave
  if (leave.type !== "MATERNITY" && leave.type !== "SPECIAL_DISABILITY") {
    return { canCancel: true };
  }

  const normalizedToday = normalizeToDhakaMidnight(today);
  const normalizedStartDate = normalizeToDhakaMidnight(leave.startDate);

  // Check if leave has started
  const hasStarted = normalizedStartDate <= normalizedToday;

  if (hasStarted) {
    const leaveTypeName =
      leave.type === "MATERNITY" ? "Maternity" : "Special Disability";
    return {
      canCancel: false,
      reason: `${leaveTypeName} leave cannot be cancelled after it has started (Policy - Master Specification). Please contact HR for assistance.`,
    };
  }

  return { canCancel: true };
}

/**
 * Validate paternity leave eligibility (Policy 6.24.b)
 * Rules:
 * - Maximum 2 occasions during entire service life
 * - Minimum 36-month interval between first and last paternity leave
 */
export async function validatePaternityLeaveEligibility(
  userId: number,
  startDate: Date
): Promise<{
  valid: boolean;
  reason?: string;
  previousLeaves?: number;
  monthsSinceFirst?: number;
}> {
  const previousPaternity = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      type: "PATERNITY",
      status: "APPROVED",
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });

  // Check maximum 2 occasions rule
  if (previousPaternity.length >= 2) {
    return {
      valid: false,
      reason:
        "Maximum 2 paternity leave occasions allowed during entire service life (Policy 6.24.b)",
      previousLeaves: previousPaternity.length,
    };
  }

  // If this is the second paternity leave, check 36-month interval
  if (previousPaternity.length === 1) {
    const firstPaternity = previousPaternity[0];
    const firstLeaveEnd = normalizeToDhakaMidnight(firstPaternity.endDate);
    const proposedStart = normalizeToDhakaMidnight(startDate);

    // Calculate months between first leave end and proposed start
    const monthsDiff =
      (proposedStart.getTime() - firstLeaveEnd.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);

    if (monthsDiff < 36) {
      const formatDate = (d: Date) =>
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      return {
        valid: false,
        reason: `Minimum 36-month interval required between first and second paternity leave (Policy 6.24.b). Last paternity leave ended on ${formatDate(
          firstLeaveEnd
        )}. ${monthsDiff.toFixed(1)} months have passed, need ${(
          36 - monthsDiff
        ).toFixed(1)} more months.`,
        previousLeaves: previousPaternity.length,
        monthsSinceFirst: monthsDiff,
      };
    }
  }

  return {
    valid: true,
    previousLeaves: previousPaternity.length,
  };
}

/**
 * Validate Extraordinary Leave prerequisite (Policy 6.26)
 * Rule: "Can only be taken when no other leave is due to the employee"
 *
 * This means employee must have exhausted or nearly exhausted ALL other leave types
 * before Extraordinary Leave can be granted.
 *
 * Thresholds:
 * - CASUAL: ≤2 days remaining
 * - EARNED: 0 days (must be fully exhausted)
 * - MEDICAL: ≤5 days remaining (small buffer allowed)
 * - MATERNITY/PATERNITY/STUDY/SPECIAL_DISABILITY/QUARANTINE: Not checked (conditional/special leaves)
 */
export async function validateExtraordinaryLeavePrerequisite(
  userId: number,
  requestedYear: number
): Promise<{
  valid: boolean;
  reason?: string;
  balanceSummary?: {
    casual: number;
    earned: number;
    medical: number;
    remainingLeaves: Array<{
      type: string;
      balance: number;
      threshold: number;
    }>;
  };
}> {
  // Define thresholds for each mandatory leave type
  const THRESHOLDS = {
    CASUAL: 2, // Allow ≤2 days remaining
    EARNED: 0, // Must be fully exhausted
    MEDICAL: 5, // Allow ≤5 days buffer
  };

  // Fetch all balances for the requested year
  const balances = await prisma.balance.findMany({
    where: {
      userId,
      year: requestedYear,
      type: {
        in: ["CASUAL", "EARNED", "MEDICAL"],
      },
    },
    select: {
      type: true,
      opening: true,
      accrued: true,
      used: true,
      closing: true,
    },
  });

  // Calculate remaining balance for each leave type
  const getRemaining = (type: "CASUAL" | "EARNED" | "MEDICAL"): number => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;

    // Use closing balance if available, otherwise calculate
    if (record.closing !== null && record.closing !== undefined) {
      return record.closing;
    }
    return Math.max(
      (record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0),
      0
    );
  };

  const casualBalance = getRemaining("CASUAL");
  const earnedBalance = getRemaining("EARNED");
  const medicalBalance = getRemaining("MEDICAL");

  // Check which leaves exceed their thresholds
  const violations: Array<{
    type: string;
    balance: number;
    threshold: number;
  }> = [];

  if (casualBalance > THRESHOLDS.CASUAL) {
    violations.push({
      type: "CASUAL",
      balance: casualBalance,
      threshold: THRESHOLDS.CASUAL,
    });
  }

  if (earnedBalance > THRESHOLDS.EARNED) {
    violations.push({
      type: "EARNED",
      balance: earnedBalance,
      threshold: THRESHOLDS.EARNED,
    });
  }

  if (medicalBalance > THRESHOLDS.MEDICAL) {
    violations.push({
      type: "MEDICAL",
      balance: medicalBalance,
      threshold: THRESHOLDS.MEDICAL,
    });
  }

  // If any violations, return detailed error
  if (violations.length > 0) {
    const violationDetails = violations
      .map((v) => {
        const leaveTypeName =
          v.type === "CASUAL"
            ? "Casual Leave"
            : v.type === "EARNED"
            ? "Earned Leave"
            : "Medical Leave";
        return `${leaveTypeName}: ${v.balance} days remaining (threshold: ${v.threshold})`;
      })
      .join(", ");

    return {
      valid: false,
      reason: `Extraordinary Leave can only be taken when no other leave is due (Policy 6.26). You still have: ${violationDetails}. Please use your other leaves first.`,
      balanceSummary: {
        casual: casualBalance,
        earned: earnedBalance,
        medical: medicalBalance,
        remainingLeaves: violations,
      },
    };
  }

  // All prerequisites met
  return {
    valid: true,
    balanceSummary: {
      casual: casualBalance,
      earned: earnedBalance,
      medical: medicalBalance,
      remainingLeaves: [],
    },
  };
}
