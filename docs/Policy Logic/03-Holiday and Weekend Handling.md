
# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **Weekend/Holiday consistency:** Synced with `Asia/Dhaka` timezone normalization from file 08.
> 2) **CL edge-case enforcement:** Ensure `touchesHolidayOrWeekendOnSides()` uses Dhaka-normalized dates and checks both edges.
> 3) **Backdate guardrails:** CL and Quarantine: no backdating; EL/ML: max 30 days.
> 4) **Holiday dataset:** Fetch from `holidays` table; cached in memory with hourly refresh.
> 5) **Admin panel:** Add bulk import (CSV) and auto‑refresh on add/update/delete.
> 6) **UI enhancements:** Warning banner in Apply form if date range touches holidays/weekends.
> 7) **Engineering tasks:**
>    - Implement `normalizeToDhakaMidnight()` in all holiday/weekend checks.
>    - Refactor `touchesHolidayOrWeekendOnSides()` to return detailed flags (`startHoliday`, `endHoliday`).
>    - Add server‑side validation mirror of frontend date restrictions.
>    - Add automated integration test covering all combinations of Fri/Sat and holidays.

## Part 3: Holiday & Weekend Handling

This document summarizes how weekends and holidays are detected, restricted, and counted in leave calculations.

---

## 1. Weekend Definition

### Bangladesh Weekend Days
- **Friday**: Day index 5 (`date.getDay() === 5`)
- **Saturday**: Day index 6 (`date.getDay() === 6`)

**Working Days**: Sunday (0) through Thursday (4)

### Implementation
- **Function**: `isWeekendBD()` in `lib/date-utils.ts` (lines 6-9)
- **Logic**: 
  ```typescript
  const dow = d.getDay();
  return dow === 5 || dow === 6;
  ```

### Alternative Implementation
- **Function**: `countWorkingDays()` in `lib/working-days.ts`
- **Logic**: Counts days where `day >= 0 && day <= 4` (Sun-Thu)

---

## 2. Holiday Detection

### Database Model
```prisma
model Holiday {
  id         Int      @id @default(autoincrement())
  date       DateTime @unique
  name       String
  isOptional Boolean  @default(false)
}
```

### Holiday Checking Functions

1. **`isHoliday(d: Date, holidays: Holiday[])`**
   - **Location**: `lib/date-utils.ts` (lines 16-19)
   - **Logic**: Normalizes date to ISO string (yyyy-mm-dd) and checks against holiday list
   - **Normalization**: Uses `normalize()` function to set time to midnight

2. **`touchesHolidayOrWeekend(date: Date)`**
   - **Location**: `app/api/leaves/route.ts` (lines 83-95)
   - **Logic**: Checks if date is weekend OR holiday (database lookup)
   - **Database Query**: 
     ```typescript
     const holiday = await prisma.holiday.findUnique({
       where: { date: dateOnly },
     });
     ```

### Combined Check
- **Function**: `isWeekendOrHoliday(d: Date, holidays: Holiday[])`
- **Location**: `lib/date-utils.ts` (lines 22-23)
- **Returns**: `true` if date is weekend OR holiday

---

## 3. Start/End Date Restrictions

### Hard Block Rules

**Start Date Cannot Be**:
- Friday (day 5)
- Saturday (day 6)
- Any company holiday

**End Date Cannot Be**:
- Friday (day 5)
- Saturday (day 6)
- Any company holiday

### Frontend Validation
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` (lines 142-148)
- **Messages**:
  - "Start date cannot be on Friday, Saturday, or a company holiday"
  - "End date cannot be on Friday, Saturday, or a company holiday"
- **Enforcement**: Prevents date selection and shows error


### Backend Validation
- **Location**: `app/api/leaves/route.ts` - `touchesHolidayOrWeekend()` function
- **Enforcement**: Not explicitly checked in POST endpoint (relies on frontend)

### Server-Side Enforcement (New)
- **Function:** `validateStartEndDates()`
- **Purpose:** Prevent leave submissions where start or end is on a holiday/weekend.
- **Implementation:**
  ```typescript
  if (isWeekendOrHoliday(startDate, holidays) || isWeekendOrHoliday(endDate, holidays)) {
    throw new Error("Start or end date cannot fall on a weekend or holiday");
  }
  ```
- **Location:** `app/api/leaves/utils/date-validation.ts`
- **Used In:** `POST /api/leaves` route.

---

## 4. Weekend/Holiday Count Rules

### CDBL Policy: "All Days Count"

**Key Principle**: Weekends and holidays **inside** a leave period count toward leave balance (per company directive).

**Implementation**:
- Leave duration calculation uses **inclusive calendar days**
- Function: `daysInclusive()` or `totalDaysInclusive()`
- **Formula**: `Math.floor((end - start) / 86400000) + 1`
- **Source**: 
  - `lib/policy.ts` - `daysInclusive()` (lines 16-19)
  - `lib/date-utils.ts` - `totalDaysInclusive()` (lines 26-27)

### Example
- Start: Monday, Jan 1
- End: Thursday, Jan 4
- Includes: Mon, Tue, Wed, Thu (4 calendar days)
- **Result**: `workingDays = 4` (all days count)

If range includes weekend:
- Start: Monday, Jan 1
- End: Sunday, Jan 7
- Includes: Mon, Tue, Wed, Thu, Fri, Sat, Sun (7 calendar days)
- **Result**: `workingDays = 7` (weekends count!)

---

## 5. Casual Leave Special Restriction


### Rule: CL Cannot Touch Holidays/Weekends

**Enforcement**: Hard block if start OR end date touches holiday/weekend

**Implementation**:
- **Function**: `touchesHolidayOrWeekendOnSides(start, end)` 
- **Location**: `app/api/leaves/route.ts` (lines 100-104)
- **Logic**: Checks both start and end dates
- **Error Code**: `cl_cannot_touch_holiday`
- **Error Message**: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."
- **Source**: `app/api/leaves/route.ts` lines 238-249

### Backend Hard Validation (Updated)
- **Function:** `touchesHolidayOrWeekendOnSides()`
- **Enhancement:** Now uses `normalizeToDhakaMidnight()` and returns a result object:
  ```typescript
  { startHoliday: boolean, endHoliday: boolean, touches: boolean }
  ```
- **Error Handling:** Throws `cl_cannot_touch_holiday` if `touches === true`.
- **Test Coverage:** Add integration tests for:
  - Start = Thursday, End = Saturday
  - Start = Friday, End = Sunday
  - Start = Holiday, End = Weekday

### Why This Restriction?
- CL is meant for short, flexible leave
- Company policy: Use EL for leave periods that include weekends/holidays

---

## 6. Range Contains Non-Working Days (UI Warning)

### Function: `rangeContainsNonWorking()`
- **Location**: `lib/date-utils.ts` (lines 30-37)
- **Purpose**: Detect if date range includes any weekend/holiday
- **Usage**: Shows informational warning to user
- **Message**: "Note: This range includes weekends/holidays which count toward your balance"


### UI Implementation
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` (lines 150-159, 391-398)
- **Display**: Amber-colored info box
- **Behavior**: Warning only (does not block submission)

> **Enhancement:** Warning tooltip shows specific holidays/weekends included, using breakdown from `countDaysBreakdown()`.

---

## 7. Working Days vs Calendar Days

### Important Distinction

The codebase uses **TWO different counting methods**:

1. **Calendar Days** (for leave duration):
   - Used in: `workingDays` field in `LeaveRequest`
   - Function: `daysInclusive()` or `totalDaysInclusive()`
   - **Includes**: All days (weekends, holidays)
   - **Purpose**: Calculate leave balance deduction

2. **Working Days** (for notice/validation):
   - Function: `countWorkingDays()`
   - **Excludes**: Weekends (Friday, Saturday)
   - **Excludes**: Holidays (if provided in list)
   - **Purpose**: Calculate advance notice (CL 5-day warning)

### Example Mismatch
- Date range: Mon Jan 1 to Sun Jan 7
- **Calendar days** (leave duration): 7 days
- **Working days** (notice calculation): 5 days (Mon-Thu)

---

## 8. Holiday Management

### Admin Interface
- **Location**: `app/admin/holidays/components/AdminHolidaysManagement.tsx`
- **Features**:
  - Add/Edit/Delete holidays
  - CSV import
  - Mark as optional
  - Date format: YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY

### Holiday API
- **Location**: `app/api/holidays/route.ts`
- **Operations**: GET (list), POST (create)

### Holiday Data Structure
```typescript
type Holiday = {
  date: string;      // ISO format yyyy-mm-dd
  name: string;
  isOptional?: boolean;
}
```

---

## 9. Date Normalization

### Function: `normalize()`
- **Location**: `lib/date-utils.ts` (lines 12-14)
- **Purpose**: Strip time component, set to midnight
- **Logic**: `new Date(d.getFullYear(), d.getMonth(), d.getDate())`
- **Usage**: Ensures consistent date comparisons

### Why Needed?
- Date objects can have time components
- Holiday lookup requires exact date match
- Normalization ensures consistent comparison

---

## 10. Next Working Day Helper

### Function: `nextWorkingDay()`
- **Location**: `lib/date-utils.ts` (lines 48-59)
- **Purpose**: Find next day that is not weekend/holiday
- **Logic**: Increments date until finds working day
- **Safety limit**: Maximum 60 attempts
- **Usage**: Potential future feature (not currently used in core logic)

---

## 11. Day Count Breakdown

### Function: `countDaysBreakdown()`
- **Location**: `lib/date-utils.ts` (lines 62-82)
- **Returns**:
  ```typescript
  {
    total: number,      // All calendar days
    weekends: number,   // Count of Fridays/Saturdays
    holidays: number,   // Count of holidays
    working: number     // total - weekends - holidays
  }
  ```
- **Usage**: Display breakdown to user (potential future feature)

---

## 12. Source Files

- **Date Utilities**: `lib/date-utils.ts`
- **Working Days**: `lib/working-days.ts`
- **API Validation**: `app/api/leaves/route.ts` (holiday checking)
- **Frontend Form**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Holiday Admin**: `app/admin/holidays/components/AdminHolidaysManagement.tsx`
- **Holiday API**: `app/api/holidays/route.ts`
- **Schema**: `prisma/schema.prisma` (Holiday model)

---

## 13. Summary Table


| Aspect | Rule | Enforcement | Function |
|--------|------|-------------|----------|
| **Start/End Dates** | Cannot be Fri/Sat/holiday | Frontend hard block | `isWeekendOrHoliday()` |
| **CL Start/End** | Cannot touch Fri/Sat/holiday | Backend hard block | `touchesHolidayOrWeekendOnSides()` |
| **Days Inside Range** | All count (weekends/holidays included) | Policy | `daysInclusive()` |
| **Notice Calculation** | Excludes weekends | Soft warning | `countWorkingDays()` |
| **Backdating Rules** | CL & Quarantine: not allowed; EL/ML: up to 30 days | Backend validation | `validateBackdateWindow()` |

---

**Next Document**: [04-Leave Balance and Accrual Logic](./04-Leave-Balance-and-Accrual-Logic.md)

