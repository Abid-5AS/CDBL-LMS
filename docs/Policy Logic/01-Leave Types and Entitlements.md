# 🏛️ CDBL Leave Management – Policy & Logic Reference

## Part 1: Leave Types & Entitlements

This document summarizes all leave types and entitlement rules as implemented in the codebase.

---

## 1. Leave Types (Enumerated in Schema)

The system recognizes the following leave types, defined in `prisma/schema.prisma`:

```typescript
enum LeaveType {
  EARNED      // Earned Leave (EL)
  CASUAL      // Casual Leave (CL)
  MEDICAL     // Medical Leave / Sick Leave (ML)
  EXTRAWITHPAY
  EXTRAWITHOUTPAY
  MATERNITY
  PATERNITY
  STUDY
  SPECIAL_DISABILITY
  QUARANTINE
}
```

**Primary leave types** (most commonly used in the system):

- `EARNED` (EL)
- `CASUAL` (CL)
- `MEDICAL` (ML)

---

## 2. Entitlement Rules (Hardcoded Constants)

### Source: `lib/policy.ts` (Policy Version v1.1)

| Leave Type      | Annual Entitlement                      | Consecutive Limit | Notice Requirement | Carry Forward      |
| --------------- | --------------------------------------- | ----------------- | ------------------ | ------------------ |
| **EARNED (EL)** | 20 days/year (accrual: 2 days/month) ⚠️ | None              | 15 days minimum ⚠️ | Yes, up to 60 days |

> ⚠️ **Contradiction Note**:
>
> - **SourceOfTruth.md (6.19)** states: "2 working days per month = **24 days/year**"
> - **System implements**: 20 days/year (assuming 10 working months)
> - **SourceOfTruth.md (6.11)** states: "All non-sick leave → submit **≥5 working days ahead**"
> - **System enforces**: 15 days minimum for EL
> - **Action Required**: Clarify with HR which values are correct
>   | **CASUAL (CL)** | 10 days/year | 3 days maximum per spell | 5 days (soft warning) | No |
>   | **MEDICAL (ML)** | 14 days/year | None | None (same-day allowed) | No |

### Policy Constants (Exact Values)

```typescript
// From lib/policy.ts
accrual: {
  EL_PER_YEAR: 20,
  CL_PER_YEAR: 10,
  ML_PER_YEAR: 14
}
carryForwardCap: {
  EL: 60,
  EARNED: 60
}
elAccrualPerMonth: 2  // EL accrues 2 working days per month
clMaxConsecutiveDays: 3
clMinNoticeDays: 5  // Warning only (soft rule)
elMinNoticeDays: 15 // Hard requirement
```

---

## 3. Earned Leave (EL) Rules

### Accrual Mechanism

- **Rate**: 2 working days per month while on duty
- **Calculation**: Stored in `Balance.accrued` field (monthly increment)
- **Source**: `lib/policy.ts` - `elAccrualPerMonth: 2`

### Carry-Forward Rules

- **Maximum carry-forward**: 60 days total (including opening + accrued)
- **Enforcement**: Hard block if request would result in balance exceeding 60 days after deduction
- **Implementation**:
  - `app/api/leaves/route.ts` lines 314-337
  - Formula: `(opening + accrued) - used - requestedDays <= 60`
- **Excess handling**: Manual (out of scope for MVP) - should be credited up to 180 days as special leave per policy

### Balance Calculation

- **Available balance** = `(opening ?? 0) + (accrued ?? 0) - (used ?? 0)`
- **Source**: `app/api/leaves/route.ts` - `getAvailableDays()` function (lines 72-78)

### Advance Notice Requirement

- **Minimum**: 15 days before start date
- **Enforcement**: Hard block (returns HTTP 400)
- **Error code**: `el_insufficient_notice`
- **Source**: `app/api/leaves/route.ts` lines 173-182

> ⚠️ **Contradiction with SourceOfTruth.md (6.11)**:
>
> - **HR Policy states**: "All non-sick leave → submit ≥ 5 working days ahead"
> - **System enforces**: 15 days minimum for EL
> - **Clarification needed**: Is EL subject to the general 5-day rule or does it have a special 15-day requirement?

---

## 4. Casual Leave (CL) Rules

### Annual Entitlement

- **Total**: 10 days per calendar year
- **Enforcement**: Hard block if annual usage (approved + pending) exceeds 10 days
- **Counting logic**:
  - Includes status `APPROVED` and `PENDING`
  - Aggregates by calendar year (Jan 1 - Dec 31)
  - Source: `app/api/leaves/route.ts` lines 272-291

### Consecutive Days Limit

- **Maximum**: 3 consecutive days per spell
- **Enforcement**: Hard block
- **Error code**: `cl_exceeds_consecutive_limit`
- **Source**: `app/api/leaves/route.ts` lines 185-192

### Holiday/Weekend Restriction

- **Rule**: Cannot be adjacent to holidays or weekends (start/end dates cannot be Fri/Sat/holidays)
- **Enforcement**: Hard block
- **Error code**: `cl_cannot_touch_holiday`
- **Error message**: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."
- **Source**: `app/api/leaves/route.ts` lines 238-249

### Advance Notice (Soft Rule)

- **Recommended**: 5 working days before start
- **Enforcement**: Warning only (allows submission)
- **Warning flag**: `clShortNotice`
- **Source**: `lib/policy.ts` - `clMinNoticeDays: 5`
- **Implementation**: `app/api/leaves/route.ts` lines 253-259

### No Carry-Forward

- CL does not carry forward to next year
- Should auto-lapse on December 31 (implementation: noted for future nightly job)

---

## 5. Medical Leave (ML) Rules

### Annual Entitlement

- **Total**: 14 days per calendar year
- **Enforcement**: Hard block if annual usage exceeds 14 days
- **Counting logic**: Same as CL (aggregates APPROVED + PENDING by calendar year)
- **Source**: `app/api/leaves/route.ts` lines 293-312

### Medical Certificate Requirement

- **Condition**: Required if leave duration > 3 days
- **Enforcement**: Hard block (check happens before other validations)
- **Error code**: `medical_certificate_required`
- **Function**: `needsMedicalCertificate()` in `lib/policy.ts` (line 21-23)
- **Source**: `app/api/leaves/route.ts` lines 194-201

### No Advance Notice Required

- Medical leave can be submitted same-day (including after return from leave)
- Special exception: Can be submitted on day of rejoining (policy 6.11a exception)

### Backdating Allowed

- Maximum: 30 days back from apply date
- Source: `lib/policy.ts` - `maxBackdateDays.ML: 30`

---

## 6. Other Leave Types (Admin-Only)

The following leave types exist in the schema but have limited implementation:

- **EXTRAWITHPAY**: Admin-only grant (up to 12 months, rare)
- **EXTRAWITHOUTPAY**: Admin-only (up to 6 months if <5 yrs service, 12 months otherwise)
- **MATERNITY**: Admin-only (8 weeks full pay)
- **PATERNITY**: 6 working days, max twice in career, ≥36 months between occasions
- **STUDY**: ≤1 year unpaid, eligibility: ≥3 yrs continuous service
- **SPECIAL_DISABILITY**: As per Board, ≤6 months
- **QUARANTINE**: ≤21 days (exceptionally 30), certificate required

---

## 7. Database Schema (Balance Model)

Balance tracking per user per year per leave type:

```prisma
model Balance {
  id        Int
  userId    Int
  type      LeaveType
  year      Int
  opening   Int      // carry-forward amount (for EL)
  accrued   Int      // monthly accrual (e.g., 2 days/month for EL)
  used      Int      @default(0)
  closing   Int      // calculated: (opening + accrued) - used
}
```

**Unique constraint**: `@@unique([userId, type, year])` - one balance record per user/type/year

---

## 8. Source Files

- **Policy Constants**: `lib/policy.ts`
- **Balance Calculation**: `app/api/leaves/route.ts` (functions: `getAvailableDays`, validation logic)
- **Schema Definition**: `prisma/schema.prisma`
- **Policy Documentation**: `docs/LeavePolicy_CDBL.md`

---

## 9. Notes & Edge Cases

1. **EL Accrual**: System tracks accrual but does not automatically increment. Accrual job needs to be implemented separately (noted in docs but not in codebase).

2. **CL Lapse**: Auto-lapse on Dec 31 is documented but not implemented (requires nightly cron job).

3. **Excess EL Credit**: Policy states excess beyond 60 days should credit to "special leave" up to 180 days, but this is manual (out of MVP scope).

4. **Balance Snapshot**: When creating a leave request, the system checks current balance but does not store a snapshot in the request record (could be added for audit trail).

---

**Next Document**: [02-Leave Application Rules and Validation](./02-Leave-Application-Rules-and-Validation.md)
