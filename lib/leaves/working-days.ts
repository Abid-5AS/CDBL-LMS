import { normalizeToDhakaMidnight, isWeekendBD } from "../date-utils";
import type { Holiday } from "../date-utils";
import { prisma } from "../prisma";

/**
 * Count working days between two dates, excluding weekends and holidays
 * @param start - Start date
 * @param end - End date
 * @param holidays - Optional array of holidays. If not provided, fetches from database
 * @returns Number of working days (Sun-Thu, excluding holidays)
 */
export async function countWorkingDays(
  start?: Date,
  end?: Date,
  holidays?: Holiday[]
): Promise<number> {
  if (!start || !end) return 0;

  // Normalize to Dhaka midnight for consistent comparison
  const s = normalizeToDhakaMidnight(start);
  const e = normalizeToDhakaMidnight(end);

  // ensure start <= end
  if (s > e) return 0;

  // Fetch holidays from database if not provided
  let holidayList: Holiday[] = holidays || [];
  if (!holidays) {
    const dbHolidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: s,
          lte: e,
        },
      },
    });
    holidayList = dbHolidays.map((h) => ({
      date: normalizeToDhakaMidnight(h.date).toISOString().slice(0, 10),
      name: h.name,
    }));
  }

  let count = 0;
  const current = new Date(s);
  const endDate = new Date(e);

  while (current <= endDate) {
    const day = current.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    // Business days: Sun(0) to Thu(4). Weekends: Fri(5), Sat(6).
    if (day >= 0 && day <= 4) {
      // Check if it's a holiday
      const dateStr = normalizeToDhakaMidnight(current).toISOString().slice(0, 10);
      const isHoliday = holidayList.some((h) => h.date === dateStr);
      if (!isHoliday) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export { countWorkingDaysSync } from "./working-days-client";
