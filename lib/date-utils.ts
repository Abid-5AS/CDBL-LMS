import { addDays, differenceInCalendarDays } from "date-fns";

export type Holiday = { date: string; name: string }; // ISO format yyyy-mm-dd

// Bangladesh weekends: Friday (5) and Saturday (6)
export const isWeekendBD = (d: Date) => {
  const dow = d.getDay();
  return dow === 5 || dow === 6;
};

// Normalize to midnight UTC
export const normalize = (d: Date) => 
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Check if date is a company holiday
export const isHoliday = (d: Date, holidays: Holiday[]) => {
  const nd = normalize(d).toISOString().slice(0, 10);
  return holidays.some(h => h.date === nd);
};

// Combined check for weekend OR holiday
export const isWeekendOrHoliday = (d: Date, holidays: Holiday[]) =>
  isWeekendBD(d) || isHoliday(d, holidays);

// Count ALL days in range (inclusive) - per CDBL policy
export const totalDaysInclusive = (start: Date, end: Date) =>
  differenceInCalendarDays(normalize(end), normalize(start)) + 1;

// Check if range contains non-working days (for UI warning)
export const rangeContainsNonWorking = (start: Date, end: Date, holidays: Holiday[]) => {
  const days = totalDaysInclusive(start, end);
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    if (isWeekendOrHoliday(d, holidays)) return true;
  }
  return false;
};

// Format as dd/mm/yyyy (Bangladesh standard)
export const fmtDDMMYYYY = (d: Date) =>
  d.toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });

// Find next working day (skips weekends and holidays)
export const nextWorkingDay = (d: Date, holidays: Holiday[]): Date => {
  let next = addDays(d, 1);
  const maxAttempts = 60; // Safety limit
  let attempts = 0;
  
  while (isWeekendOrHoliday(next, holidays) && attempts < maxAttempts) {
    next = addDays(next, 1);
    attempts++;
  }
  
  return next;
};

// Count breakdown: total, weekends, holidays
export const countDaysBreakdown = (start: Date, end: Date, holidays: Holiday[]) => {
  const days = totalDaysInclusive(start, end);
  let weekendCount = 0;
  let holidayCount = 0;
  
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    if (isWeekendBD(d)) {
      weekendCount++;
    } else if (isHoliday(d, holidays)) {
      holidayCount++;
    }
  }
  
  return {
    total: days,
    weekends: weekendCount,
    holidays: holidayCount,
    working: days - weekendCount - holidayCount,
  };
};

