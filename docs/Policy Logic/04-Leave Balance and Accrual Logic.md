# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks**
> 
> **Phase 1 (Policy v2.0 - Constants & Schema):**
> 1) **EL entitlement fixed:** 24 days/year (2 × 12) per Policy 6.19. Updated `lib/policy.ts` EL_PER_YEAR = 24.
> 2) **EL notice fixed:** 5 working days per Policy 6.11. Updated `lib/policy.ts` elMinNoticeDays = 5.
> 3) **Policy version:** Updated to v2.0 in `lib/policy.ts` and all seed data.
> 4) **Schema extended:** Added RETURNED, CANCELLATION_REQUESTED, RECALLED, OVERSTAY_PENDING statuses to LeaveStatus enum.
> 5) **Fitness certificate field:** Added fitnessCertificateUrl to LeaveRequest model for ML > 7 days return validation.
> 6) **Seed data updated:** EL accrued changed from 20 to 24 days in `prisma/seed.ts`.
> 
> **Phase 7 (Policy v2.0 - Background Jobs):**
> 1) **EL accrual job:** Created `scripts/jobs/el-accrual.ts` - runs monthly on 1st at 00:00 Asia/Dhaka, adds 2 days/month, skips months when employee was on leave entire month, respects 60-day cap.
> 2) **CL auto-lapse job:** Created `scripts/jobs/auto-lapse.ts` - runs annually on Dec 31 23:59 Asia/Dhaka, resets CL balance to 0 for all employees.
> 3) **Overstay detection job:** Created `scripts/jobs/overstay-check.ts` - runs daily at midnight Asia/Dhaka, flags approved leaves past endDate without return confirmation as OVERSTAY_PENDING.
> 4) **Scheduler:** Created `scripts/scheduler.ts` using node-cron with Asia/Dhaka timezone for all jobs.
> 5) **Audit logging:** All jobs create audit log entries (EL_ACCRUED, CL_LAPSED, OVERSTAY_FLAGGED).
> 6) **Tests:** Added unit tests for accrual and lapse logic, integration tests for overstay detection.
> 
> **Previous Tasks:**
> 7) **Monthly accrual clarified:** 2 days are accrued per active month. Add proration for partial-month service.
> 8) **Approval side-effects:** On APPROVE, increment `Balance.used`; on CANCEL of APPROVED, restore `used` (completed in Phase 5).
> 9) **Carry-forward enforcement:** 60-day cap enforced in accrual job and leave application validation.

## Part 4: Leave Balance & Accrual Logic

This document summarizes how leave balances are calculated, accrued, and projected.

---

## 1. Balance Model (Database Schema)

### Structure
```prisma
model Balance {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      LeaveType
  year      Int
  opening   Int      // carry-forward (for EL)
  accrued   Int      // e.g., EL accrual 2 days / month
  used      Int      @default(0)
  closing   Int      // calculated: (opening + accrued) - used
}
```

### Unique Constraint
- **Key**: `@@unique([userId, type, year])`
- **Meaning**: One balance record per user, per leave type, per calendar year

---

## 2. Balance Calculation Formula

### Available Balance
**Formula**: `available = (opening ?? 0) + (accrued ?? 0) - (used ?? 0)`

**Implementation**:
- **Function**: `getAvailableDays()`
- **Location**: `app/api/leaves/route.ts` (lines 72-78)
- **Usage**: Validates if user has sufficient balance before approving request

```typescript
async function getAvailableDays(userId: number, type: LeaveType, year: number) {
  const bal = await prisma.balance.findUnique({
    where: { userId_type_year: { userId, type, year } },
  });
  if (!bal) return 0;
  return (bal.opening ?? 0) + (bal.accrued ?? 0) - (bal.used ?? 0);
}
```

### Closing Balance
**Formula**: `closing = (opening + accrued) - used`

**Note**: The `closing` field in schema appears to be calculated but may not always be updated automatically.

---

## 3. Earned Leave (EL) Accrual

### Accrual Rate
- **Rate**: 2 working days per month while on duty.
- **Constant**: `elAccrualPerMonth: 2` in `lib/policy.ts`.
- **Annual Total**: **24 days/year** (2 × 12 months) — _Policy 6.19_.
- **Proration**: For partial-month service, prorate by calendar days on duty in that month.

### Accrual Mechanism
**Status**: **Not Automatically Implemented**

- Accrual is **tracked** in the `Balance.accrued` field
- **No automatic monthly job** found in codebase
- Accrual must be **manually updated** or via external job (not in MVP scope)
- Proration rule: `monthly_credit = 2 × (days_on_duty_in_month / total_days_in_month)` rounded to the nearest 0.5 day.

### Accrual Calculation Logic
If implemented, would be:
- Run monthly (end of month or beginning of next month)
- For each user with EL entitlement:
  - If on duty: `accrued += 2`
  - Update `Balance` record for current year

---

## 4. Carry-Forward Rules

### Earned Leave (EL) Carry-Forward

**Maximum Carry**: 60 days total (including opening + accrued)

**Enforcement Logic**:
- **Location**: `app/api/leaves/route.ts` lines 314-337
- **Check**: Before allowing EL request, verify that after deduction, balance won't exceed 60 days
- **Formula**: 
  ```typescript
  totalCarry = (opening ?? 0) + (accrued ?? 0);
  afterRequest = totalCarry - (used ?? 0) - workingDays;
  if (afterRequest > 60) → BLOCK
  ```

**Error Code**: `el_carry_cap_exceeded`

**Example**:
- Opening: 50 days
- Accrued: 15 days
- Total: 65 days
- Used: 5 days
- Requested: 10 days
- **After request**: 65 - 5 - 10 = 50 days ✅ (allowed)
- **If requested 11 days**: 65 - 5 - 11 = 49 days ✅ (allowed)
- **If opening was 55**: 55 + 15 = 70, 70 - 5 - 10 = 55 ✅ (allowed)
- **But if opening was 55 and requested 15**: 70 - 5 - 15 = 50 ✅ (allowed)

**Note**: The check only blocks if the **remaining balance after request** exceeds 60, not the initial total.

### Excess Handling (Policy)
- **Policy**: Excess beyond 60 days should be credited as "special leave" up to 180 days
- **Implementation**: Manual (out of MVP scope)
- **No automatic mechanism** in codebase

### Other Leave Types
- **CASUAL**: No carry-forward (lapses Dec 31)
- **MEDICAL**: No carry-forward
- **Others**: Not applicable

---

## 5. Annual Caps and Limits

### Casual Leave (CL) Annual Cap
- **Limit**: 10 days per calendar year
- **Counting**: 
  - Includes status: `APPROVED` and `PENDING`
  - Aggregates `workingDays` sum for same calendar year
- **Implementation**: `app/api/leaves/route.ts` lines 272-291

```typescript
const usedThisYear = await prisma.leaveRequest.aggregate({
  where: {
    requesterId: me.id,
    type: "CASUAL",
    status: { in: ["APPROVED", "PENDING"] },
    startDate: { gte: yearStart, lt: yearEnd },
  },
  _sum: { workingDays: true },
});
const totalUsed = (usedThisYear._sum.workingDays ?? 0) + workingDays;
if (totalUsed > 10) → BLOCK
```

### Medical Leave (ML) Annual Cap
- **Limit**: 14 days per calendar year
- **Same counting logic** as CL
- **Implementation**: `app/api/leaves/route.ts` lines 293-312

### Earned Leave (EL)
- **No annual cap** (only carry-forward cap of 60 days)
- Subject to accrual rate (**24 days/year** theoretical max)

---

## 6. Balance Validation on Request Submission

### Insufficient Balance Check
- **Enforcement**: Hard block
- **Error Code**: `insufficient_balance`
- **Error Response**: 
  ```json
  {
    "error": "insufficient_balance",
    "available": <number>,
    "requested": <number>,
    "type": "<LeaveType>"
  }
  ```
- **Location**: `app/api/leaves/route.ts` lines 339-345

**Validation Order**:
1. Check annual caps (CL/ML)
2. Check carry-forward cap (EL)
3. Check available balance

---

## 7. Balance Projection (UI Display)

### Frontend Balance Display
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Calculation**: `remainingBalance = balanceForType - requestedDays`
- **Purpose**: Real-time display of balance after request

### Balance API
- **Endpoint**: `GET /api/balance/mine`
- **Location**: `app/api/balance/mine/route.ts`
- **Returns**: Current balances for all leave types

---

## 8. Balance Updates (On Approval)

### When Balance is Decremented

**Trigger**: When leave request is **APPROVED**

**Expected Logic** (not explicitly found in approval endpoint):
1. Update `Balance.used` field: `used += workingDays`
2. Update `Balance.closing` field: `closing = (opening + accrued) - used`

**Location**: Should be in approval endpoint (`app/api/leaves/[id]/approve/route.ts`)
- **Note**: Approval endpoint does not show balance update logic (may be handled elsewhere or needs implementation)

### Balance Restoration (On Cancellation)

**Policy**: If employee cancels a previously approved request, balance should be restored

**Implementation**: Not found in cancellation endpoint (`app/api/leaves/[id]/route.ts`)
- **Current**: Only updates status to `CANCELLED`
- **Missing**: Balance restoration logic

---

## 9. Year Transition

### Calendar Year Basis
- All balances are **per calendar year**
- Year field: `year: Int` (e.g., 2024, 2025)
- Each new year requires new `Balance` record

### Carry-Forward to Next Year
- **EL**: Should carry forward up to 60 days to `opening` field of next year
- **Implementation**: Not found (requires yearly job/process)

### CL Lapse
- **Policy**: CL lapses on December 31
- **Implementation**: Not found (requires nightly/yearly job)

---

## 10. Balance Initialization (Seed Data)

### Seed Logic
- **Location**: `prisma/seed.ts`
- **Function**: `upsertBalances()`
- **Purpose**: Initialize balances for demo/test users

**Typical Values** (for seed):
- EL: `opening: 10, accrued: 24, used: 5`
- CL: `opening: 0, accrued: 10, used: 2`
- ML: `opening: 0, accrued: 14, used: 0`

---

## 11. Balance Display in UI

### Employee Dashboard
- **Location**: `app/dashboard/components/` (various components)
- **Shows**: Current balances, used, remaining
- **Format**: Visual cards with type, total, used, remaining

### Apply Leave Form
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Shows**: Balance for selected leave type
- **Shows**: Projected remaining balance after request

---

## 12. Source Files

- **Balance Calculation**: `app/api/leaves/route.ts` - `getAvailableDays()`
- **Balance API**: `app/api/balance/mine/route.ts`
- **Policy Constants**: `lib/policy.ts`
- **Schema**: `prisma/schema.prisma` (Balance model)
- **Seed Data**: `prisma/seed.ts`
- **Employee Data**: `lib/employee.ts` - `getEmployeeDashboardData()`

---

## 13. Known Gaps / Future Work

1. **Automatic EL Accrual**: Monthly job not implemented
2. **Balance Update on Approval**: Logic not found in approval endpoint
3. **Balance Restoration on Cancel**: Not implemented
4. **Year Transition**: Carry-forward and CL lapse not automated
5. **Excess EL Credit**: Special leave credit not implemented

---

**Next Document**: [05-File Upload and Medical Certificate Rules](./05-File-Upload-and-Medical-Certificate-Rules.md)
