
# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **Timezone enforcement:** Explicitly set to `Asia/Dhaka` across backend and frontend using `dayjs` or `date-fns-tz`.
> 2) **Date normalization unified:** Add a global utility `normalizeToDhakaMidnight(date)` to ensure consistent comparisons.
> 3) **Working days calculations:** Extend `countWorkingDays()` to skip configured holidays in addition to Fri/Sat.
> 4) **Backdate rule adjustments:** CL and Quarantine: cannot backdate; EL/ML: max 30 days back.
> 5) **Frontend picker locale:** Ensure all `DatePicker` components use `"en-GB"` locale and default timezone `"Asia/Dhaka"`.
> 6) **API date validation:** All input dates normalized with `startOfDay()` before persistence.
> 7) **Display formatting:** Use `fmtDDMMYYYY()` for all user-facing text; remove hardcoded local `toLocaleDateString()` calls.
> 8) **Consistency test:** Add integration test verifying same leave range duration across UI, API, and database regardless of timezone offset.
> 9) **Future enhancement:** Consider introducing `luxon` or `dayjs` for more robust timezone handling.

## Part 8: Date/Time & Display Logic

This document summarizes date formatting, timezone assumptions, and display rules.

---

## 1. Date Format Standards

### Bangladesh Standard Format
- **Format**: `dd/mm/yyyy` (day/month/year)
- **Example**: `23/10/2024`
- **Function**: `fmtDDMMYYYY(d: Date)`
- **Location**: `lib/date-utils.ts` lines 40-45

### Implementation
```typescript
export const fmtDDMMYYYY = (d: Date) =>
  d.toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
```

**Locale**: `"en-GB"` (British English, uses DD/MM/YYYY)

---

## 2. Timezone Assumptions

### Implicit Timezone
- **Timezone**: Explicitly set to `Asia/Dhaka` for all date operations.
- **Library Used**: `date-fns-tz` with `utcToZonedTime()` and `formatInTimeZone()`.
- **Rationale**: Avoid cross‑environment inconsistencies (server vs. browser vs. database).

### Date Normalization
- **Function**: `normalize(d: Date)`
- **Location**: `lib/date-utils.ts` lines 12-14
- **Purpose**: Strip time component, set to midnight
- **Logic**: `new Date(d.getFullYear(), d.getMonth(), d.getDate())`

**Why**: Ensures consistent date comparisons without time components

**New Utility Added:**
```typescript
export const normalizeToDhakaMidnight = (d: Date) => {
  const zoned = utcToZonedTime(d, "Asia/Dhaka");
  return new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
};
```
**Purpose:** Ensures every stored and compared date aligns to Dhaka midnight.

---

## 3. Date Input/Output Formats

### API Input
- **Format**: ISO date string
- **Example**: `"2024-10-23T00:00:00.000Z"` or `"2024-10-23"`
- **Location**: `app/api/leaves/route.ts` - `ApplySchema.startDate` (string)

### API Output
- **Format**: ISO date string (from database DateTime fields)
- **Database**: MySQL `DateTime` type stores with timezone

### Frontend Display
- **Format**: `dd/mm/yyyy` (using `fmtDDMMYYYY()`)
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` (date picker)

---

## 4. Date Calculation Functions

### Inclusive Calendar Days
- **Function**: `daysInclusive(start, end)`
- **Location**: `lib/policy.ts` lines 16-19
- **Formula**: `Math.floor((end - start) / 86400000) + 1`
- **Returns**: Total calendar days (inclusive)

**Alternative**: `totalDaysInclusive()` in `lib/date-utils.ts` (lines 26-27)
- Uses `differenceInCalendarDays()` from `date-fns` library

### Working Days Count
- **Function**: `countWorkingDays(start, end)`
- **Location**: `lib/working-days.ts`
- **Logic**: Counts only Sun-Thu (excludes Fri-Sat)
- **Usage**: For advance notice calculations (CL 5-day warning)

**Enhanced Logic:**  
`countWorkingDays()` now excludes weekends (Fri/Sat) and company holidays pulled from `holidays` table or API cache.  
It should return the number of *eligible working days* between start and end dates inclusive.

---

## 5. Date Validation Logic

### Start of Day Normalization
- **Purpose**: Compare dates without time components
- **Function**: `startOfDay(date)`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` lines 46-50
- **Usage**: Ensure date comparisons are accurate

```typescript
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

### Backdate Detection
- **Logic**: `startDateOnly < today` (both normalized to midnight)
- **Location**: `app/api/leaves/route.ts` line 170

### Advance Notice Calculation
- **EL**: Calendar days from today to start date
- **CL**: Working days from today to start date
- **Location**: `app/api/leaves/route.ts` lines 175, 255

---

## 6. Date Range Display

### Date Range Format
- **Format**: `{start} → {end}` (both in dd/mm/yyyy)
- **Example**: `23/10/2024 → 28/10/2024`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` line 378

### Duration Display
- **Format**: `{days} day{s}` (pluralized)
- **Example**: `5 days` or `1 day`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` line 375

---

## 7. Date Picker Behavior

### Minimum Selectable Date
- **EARNED/MEDICAL**: 30 days before today (allows backdating)
- **CASUAL**: Today (no backdating)
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` lines 125-132

```typescript
const minSelectableDate = useMemo(() => {
  if (type === "MEDICAL" || type === "EARNED") {
    const today = startOfDay(new Date());
    today.setDate(today.getDate() - 30);
    return today;
  }
  return startOfDay(new Date());
}, [type]);
```

> **Enhancement:** All date pickers now initialize with locale `"en-GB"` and timezone `"Asia/Dhaka"`, ensuring consistent local display.

### Maximum Selectable Date
- **Not explicitly set** in date picker
- **Implicit**: Limited by calendar year (for annual caps)

---

## 8. Holiday Date Format

### Database Storage
- **Type**: `DateTime` (includes time component)
- **Normalization**: Set to midnight (00:00:00) for comparison

### Holiday API Format
- **Input**: Multiple formats supported (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
- **Storage**: Normalized to DateTime with time 00:00:00
- **Location**: `app/admin/holidays/components/AdminHolidaysManagement.tsx`

### Holiday Comparison
- **Function**: `isHoliday(d: Date, holidays: Holiday[])`
- **Logic**: Normalizes date to ISO string (yyyy-mm-dd) and compares
- **Location**: `lib/date-utils.ts` lines 16-19

---

## 9. Time Display

### Last Saved Time
- **Format**: 12-hour format with AM/PM
- **Example**: `2:30 PM` or `9:15 AM`
- **Function**: `toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` line 297

> **Note:** Display times (e.g., last saved, approval timestamps) should use `Asia/Dhaka` via `formatInTimeZone(date, "Asia/Dhaka", "hh:mm a")`.

---

## 10. Calendar Year Logic

### Year Calculation
- **Function**: `yearOf(d: Date)`
- **Logic**: `d.getFullYear()`
- **Location**: `app/api/leaves/route.ts` line 68

### Year Boundaries
- **Start**: `new Date(year, 0, 1)` (January 1, 00:00:00)
- **End**: `new Date(year + 1, 0, 1)` (January 1 of next year, exclusive)
- **Usage**: Annual cap calculations (CL, ML)

---

## 11. Date Arithmetic

### Adding Days
- **Library**: `date-fns` - `addDays(date, days)`
- **Usage**: Iterating through date ranges
- **Location**: `lib/date-utils.ts` (imported)

### Difference Calculation
- **Library**: `date-fns` - `differenceInCalendarDays(end, start)`
- **Usage**: Calendar day differences
- **Location**: `lib/date-utils.ts`

---

## 12. ISO Date String Handling

### Parsing
- **Method**: `new Date(isoString)`
- **Example**: `new Date("2024-10-23T00:00:00.000Z")`
- **Location**: `app/api/leaves/route.ts` lines 138-139

### Validation
- **Check**: `isNaN(date.getTime())` to detect invalid dates
- **Location**: `app/api/leaves/route.ts` line 140

---

## 13. Date Comparison Logic

### Normalized Comparison
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const startDateOnly = new Date(start);
startDateOnly.setHours(0, 0, 0, 0);
const isBackdated = startDateOnly < today;
```

**Purpose**: Compare dates without time component interference

---

## 14. Source Files

- **Date Utilities**: `lib/date-utils.ts`
- **Working Days**: `lib/working-days.ts`
- **Policy Functions**: `lib/policy.ts` - `daysInclusive()`
- **API Date Handling**: `app/api/leaves/route.ts`
- **Frontend Date Display**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Date Library**: `date-fns` (imported in date-utils.ts)

---

**Next Document**: [09-Role Based Behavior](./09-Role-Based-Behavior.md)

