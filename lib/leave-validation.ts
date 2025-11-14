import { addDays } from "date-fns";
import { prisma } from "./prisma";
import {
  normalizeToDhakaMidnight,
  isWeekendOrHoliday,
  type Holiday,
} from "./date-utils";

async function fetchHolidaysInRange(start: Date, end: Date): Promise<Holiday[]> {
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
    options.holidays ??
    (await fetchHolidaysInRange(rangeStart, rangeEnd));

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
            { endDate: { gte: normalizedStart } }
          ]
        }
      ]
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
      reason: "Maximum 2 paternity leave occasions allowed during entire service life (Policy 6.24.b)",
      previousLeaves: previousPaternity.length,
    };
  }

  // If this is the second paternity leave, check 36-month interval
  if (previousPaternity.length === 1) {
    const firstPaternity = previousPaternity[0];
    const firstLeaveEnd = normalizeToDhakaMidnight(firstPaternity.endDate);
    const proposedStart = normalizeToDhakaMidnight(startDate);

    // Calculate months between first leave end and proposed start
    const monthsDiff = (proposedStart.getTime() - firstLeaveEnd.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (monthsDiff < 36) {
      return {
        valid: false,
        reason: `Minimum 36-month interval required between first and second paternity leave (Policy 6.24.b). Last paternity leave ended on ${firstLeaveEnd.toLocaleDateString()}. ${monthsDiff.toFixed(1)} months have passed, need ${(36 - monthsDiff).toFixed(1)} more months.`,
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


