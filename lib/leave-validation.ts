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
 * Check if Casual Leave violates the side-touch rule.
 * Rules:
 * - Start or end date cannot fall on a Friday/Saturday/company holiday
 * - Day before start and day after end cannot be a Friday/Saturday/company holiday
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

  if (isNonWorking(normalizedStart, holidays)) return true;
  if (isNonWorking(normalizedEnd, holidays)) return true;

  const beforeStart = addDays(normalizedStart, -1);
  const afterEnd = addDays(normalizedEnd, 1);

  return (
    isNonWorking(beforeStart, holidays) || isNonWorking(afterEnd, holidays)
  );
}


