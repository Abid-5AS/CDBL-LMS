
# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **EL Advance Notice fixed:** from 15 days to ≥5 working days as per Policy 6.11. CL and Quarantine remain exempt.
> 2) **Docs aligned:** Updated all occurrences and error examples that referenced 15 days.
> 3) **Policy constants to update:** In `lib/policy.ts`, set `elMinNoticeDays = 5`.
> 4) **Validation logic:** Adjust `app/api/leaves/route.ts` so `el_insufficient_notice` checks 5 working days (not 15 calendar).
> 5) **Frontend UI:** Update message text to show “5 working days before start date” instead of “15 days”.
> 6) **Supervisor confirmation:** Confirm if 15 days should be retained internally (add feature flag if needed).

## Part 2: Leave Application Rules & Validation

This document summarizes all validation rules and requirements for submitting leave applications.

---

## 1. Required Fields

### Core Fields (Always Required)
- **type**: Leave type enum (EARNED, CASUAL, MEDICAL, etc.)
- **startDate**: ISO date string (DateTime)
- **endDate**: ISO date string (DateTime)
- **reason**: String, minimum 3 characters (enforced at API level)
- **workingDays**: Integer, positive (calculated if not provided)

### Conditional Fields
- **certificate**: File upload (required if MEDICAL > 3 days)
- **needsCertificate**: Boolean flag (set automatically based on policy)

**Source**: `app/api/leaves/route.ts` - `ApplySchema` (lines 22-40)

---

## 2. Date Validation Rules

### Basic Date Constraints

1. **Start Date ≤ End Date**
   - **Enforcement**: Hard validation
   - **Error**: `invalid_dates` (HTTP 400)
   - **Source**: `app/api/leaves/route.ts` line 140

2. **Start/End Cannot Be Weekend or Holiday**
   - **Weekends**: Friday (5) and Saturday (6)
   - **Enforcement**: Hard validation in UI and API
   - **UI Message**: "Start date cannot be on Friday, Saturday, or a company holiday"
   - **UI Message**: "End date cannot be on Friday, Saturday, or a company holiday"
   - **Source**: 
     - Frontend: `app/leaves/apply/_components/apply-leave-form.tsx` lines 142-148
     - Backend: `app/api/leaves/route.ts` - `touchesHolidayOrWeekend()` function

3. **Valid Date Range**
   - **Enforcement**: `workingDays` must be > 0
   - **Calculation**: Uses `daysInclusive()` function (calendar days, inclusive)
   - **Source**: `lib/policy.ts` - `daysInclusive()` (lines 16-19)
   - **Formula**: `Math.floor((end - start) / 86400000) + 1`

### Date Calculation Functions

**Inclusive Calendar Days** (`lib/policy.ts`):
```typescript
export function daysInclusive(start: Date, end: Date): number {
  const ms = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
}
```

**Working Days** (`lib/working-days.ts`):
- Counts only business days (Sunday through Thursday)
- Excludes Friday (5) and Saturday (6)
- Note: This function counts working days, but leave duration uses calendar days

---

## 3. Advance Notice Requirements

### Earned Leave (EL) - Standard Requirement
- **Minimum**: 5 working days before start date (per HR Policy 6.11)
- **Calculation**: Working days between today and start date
- **Enforcement**: Hard block (HTTP 400)
- **Error Code**: `el_insufficient_notice`
- **Error Response**: `{ error: "el_insufficient_notice", required: 5, provided: <days> }`
- **Source**: `app/api/leaves/route.ts` lines 173-182

> ✅ **Aligned with SourceOfTruth.md (6.11)**:
> - HR Policy: “All non-sick leave → submit ≥5 working days ahead.”
> - CL and Quarantine exempt.
> - Previous 15-day rule removed.
> - Implementation to compute *working days*, excluding Friday and Saturday.

```typescript
const workingDaysNotice = countWorkingDays(today, startDateOnly);
if (workingDaysNotice < policy.elMinNoticeDays) {
  return NextResponse.json(
    { error: "el_insufficient_notice", required: policy.elMinNoticeDays, provided: workingDaysNotice },
    { status: 400 }
  );
}
```

### Casual Leave (CL) - Soft Warning
- **Recommended**: 5 working days before start
- **Enforcement**: Warning only (allows submission)
- **Warning Flag**: `clShortNotice`
- **Calculation**: Uses `countWorkingDays()` (excludes weekends)
- **Source**: `app/api/leaves/route.ts` lines 253-259

### Medical Leave (ML) - No Requirement
- Medical leave can be submitted same-day
- Special exception: Can be submitted on day of rejoining (policy exception)

---

## 4. Minimum and Maximum Leave Length

### Maximum Length Limits

1. **CASUAL Leave**
   - **Maximum consecutive**: 3 days per spell
   - **Enforcement**: Hard block
   - **Error Code**: `cl_exceeds_consecutive_limit`
   - **Source**: `app/api/leaves/route.ts` lines 185-192

2. **EARNED Leave**
   - **No maximum consecutive limit** (subject to balance availability)

3. **MEDICAL Leave**
   - **No maximum consecutive limit** (subject to annual cap of 14 days)

### Minimum Length
- **No explicit minimum** enforced
- Implicitly: At least 1 day (validated by `workingDays > 0`)

---

## 5. Backdate Rules

### Backdate Detection
- **Definition**: Start date < today's date (normalized to midnight)
- **Source**: `app/api/leaves/route.ts` line 170

### Backdate Permissions (by Leave Type)

| Leave Type | Allowed | Maximum Window | Org Setting Control |
|------------|---------|----------------|---------------------|
| **EARNED** | Yes | 30 days | Configurable (`allowBackdate.EL`) |
| **CASUAL** | No | N/A | Hard-coded `false` |
| **MEDICAL** | Yes | 30 days | Configurable (`allowBackdate.ML`) |

### Org Settings Backdate Control

Settings stored in `OrgSettings` table with key `"allowBackdate"`:
- **Values**: `boolean | "ask"`
- **Default Values**:
  - `EL: "ask"` (shows confirmation modal, logs audit)
  - `CL: false` (hard block)
  - `ML: true` (allowed)

**Source**: `lib/org-settings.ts` - `getBackdateSettings()` (lines 58-69)

### Backdate Validation Logic

1. **Check org setting** (`app/api/leaves/route.ts` lines 204-214):
   - If `false` → Hard block with `backdate_disallowed_by_policy`
   - If `"ask"` → Allows but creates audit log entry (`LEAVE_BACKDATE_ASK`)

2. **Validate window limit** (`app/api/leaves/route.ts` lines 232-234):
   - Uses `withinBackdateLimit()` function
   - Maximum: 30 days for EL/ML
   - Error: `backdate_window_exceeded`

**Source Functions**:
- `lib/policy.ts` - `canBackdate()` (lines 25-29)
- `lib/policy.ts` - `withinBackdateLimit()` (lines 31-38)
- `lib/org-settings.ts` - `getBackdateSettings()` (lines 58-69)

---

## 6. Reason Field Validation

### Requirements
- **Required**: Yes
- **Minimum length**: 3 characters (API validation)
- **UI Minimum**: 10 characters (displayed to user)
- **UI Display**: Shows character count: `"{count} / 10 characters minimum"`
- **Enforcement**:
  - Frontend: Hard validation (prevents submit)
  - Backend: 3 character minimum (Zod schema)

**Source**:
- Frontend: `app/leaves/apply/_components/apply-leave-form.tsx` lines 216-220
- Backend: `app/api/leaves/route.ts` - `ApplySchema.reason` (line 37)

### Error Messages
- **Frontend**: "Reason is required" (if empty)
- **Frontend**: "Reason must be at least 10 characters" (if < 10)
- **Backend**: Zod validation error if < 3 characters

---

## 7. Partial-Day / Half-Day Leave

**Status**: Not implemented in current codebase
- All leave calculations use full calendar days
- No support for half-day or partial-day leave

---

## 8. Balance Validation

### Availability Check
- **Formula**: `available = (opening ?? 0) + (accrued ?? 0) - (used ?? 0)`
- **Enforcement**: Hard block if `requestedDays > available`
- **Error Code**: `insufficient_balance`
- **Error Response**: `{ error: "insufficient_balance", available: <number>, requested: <number>, type: <LeaveType> }`
- **Source**: `app/api/leaves/route.ts` lines 339-345

### Type-Specific Balance Checks

1. **EARNED Leave**:
   - Checks available balance against requested days
   - Also checks carry-forward cap (60 days)

2. **CASUAL Leave**:
   - Checks annual cap (10 days/year) in addition to balance
   - Includes pending requests in cap calculation

3. **MEDICAL Leave**:
   - Checks annual cap (14 days/year) in addition to balance
   - Includes pending requests in cap calculation

---

## 9. Annual Cap Validation

### Casual Leave (CL) Annual Cap
- **Limit**: 10 days per calendar year
- **Counting**: Includes `APPROVED` and `PENDING` status
- **Calculation**: Aggregates `workingDays` sum for same year
- **Enforcement**: Hard block
- **Error Code**: `cl_annual_cap_exceeded`
- **Source**: `app/api/leaves/route.ts` lines 272-291

### Medical Leave (ML) Annual Cap
- **Limit**: 14 days per calendar year
- **Counting**: Same as CL (includes APPROVED + PENDING)
- **Error Code**: `ml_annual_cap_exceeded`
- **Source**: `app/api/leaves/route.ts` lines 293-312

---

## 10. Validation Order (Server-Side)

The server validates in this exact order:

1. Authentication check
2. Schema validation (Zod)
3. Date validity (start ≤ end)
4. EL advance notice (≥5 working days) - Hard block
5. CL consecutive limit (3 days) - Hard block
6. ML medical certificate requirement (>3 days) - Hard block
7. Backdate settings check (org settings)
8. Backdate window limit (30 days)
9. CL holiday/weekend adjacency check - Hard block
10. CL annual cap (10 days/year) - Hard block
11. ML annual cap (14 days/year) - Hard block
12. EL carry-forward cap (60 days) - Hard block
13. Balance availability check - Hard block

**Source**: `app/api/leaves/route.ts` - `POST()` function (lines 106-363)

---

## 11. Source Files

- **API Validation**: `app/api/leaves/route.ts`
- **Policy Constants**: `lib/policy.ts`
- **Date Utilities**: `lib/date-utils.ts`, `lib/working-days.ts`
- **Org Settings**: `lib/org-settings.ts`
- **Frontend Form**: `app/leaves/apply/_components/apply-leave-form.tsx`

---

**Next Document**: [03-Holiday and Weekend Handling](./03-Holiday-and-Weekend-Handling.md)

