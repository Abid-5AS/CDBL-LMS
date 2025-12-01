import { normalizeToDhakaMidnight } from "../date-utils";
import type { Holiday } from "../date-utils";

/**
 * Synchronous version for cases where holidays are already provided
 * @param start - Start date
 * @param end - End date
 * @param holidays - Array of holidays to exclude
 * @returns Number of working days
 */
export function countWorkingDaysSync(
    start?: Date,
    end?: Date,
    holidays: Holiday[] = []
): number {
    if (!start || !end) return 0;

    const s = normalizeToDhakaMidnight(start);
    const e = normalizeToDhakaMidnight(end);

    if (s > e) return 0;

    let count = 0;
    const current = new Date(s);
    const endDate = new Date(e);

    while (current <= endDate) {
        const day = current.getDay();
        if (day >= 0 && day <= 4) {
            const dateStr = normalizeToDhakaMidnight(current).toISOString().slice(0, 10);
            const isHoliday = holidays.some((h) => h.date === dateStr);
            if (!isHoliday) {
                count++;
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}
