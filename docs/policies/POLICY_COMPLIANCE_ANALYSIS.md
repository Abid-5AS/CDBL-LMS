# CDBL Leave Policy Compliance Analysis

**Generated:** 2025-11-13
**Branch:** claude/document-leave-policy-011CV5WuvdMxqn8uTi46j7Qc

This document analyzes contradictions and compliance gaps between the official CDBL Leave Policy (Chapter 06) and the current codebase implementation.

---

## EXECUTIVE SUMMARY

### Critical Issues: 8
### Major Issues: 12
### Minor Issues: 5

**Overall Compliance Status:** ⚠️ NEEDS REFACTORING

---

## 🔴 CRITICAL ISSUES (Require Immediate Action)

### 1. Maternity Leave Duration Mismatch
**Severity:** CRITICAL
**Policy Reference:** 6.23.a

**Policy States:**
> "Maternity leave on full pay may be granted by the management to a permanent employee for the period of eight weeks."

**Code States:**
- `app/leaves/apply/_components/leave-constants.ts:32` - "Usually 16 weeks duration"
- `app/leaves/apply/_components/leave-constants.ts:59` - "Usually 16 weeks duration"

**Impact:** Users are shown incorrect duration (16 weeks instead of 8 weeks), leading to incorrect expectations and potential leave balance miscalculations.

**Recommendation:**
```typescript
// CHANGE FROM:
MATERNITY: "Requires medical certificate. Usually 16 weeks duration. Apply well in advance."

// CHANGE TO:
MATERNITY: "Requires medical certificate. Duration is 8 weeks (56 days). Apply well in advance."
```

**Files to Modify:**
- `app/leaves/apply/_components/leave-constants.ts:32`
- `app/leaves/apply/_components/leave-constants.ts:59`

---

### 2. Paternity Leave Duration Mismatch
**Severity:** CRITICAL
**Policy Reference:** 6.24.a

**Policy States:**
> "CDBL will grant 6 working days paid paternity leave to male employees who have completed one full year of service"

**Code States:**
- `app/leaves/apply/_components/leave-constants.ts:33` - "Usually up to 14 days"
- `app/leaves/apply/_components/leave-constants.ts:63` - "Usually up to 14 days"

**Impact:** Users are shown incorrect duration (14 days instead of 6 days), leading to incorrect expectations and potential leave balance miscalculations.

**Recommendation:**
```typescript
// CHANGE FROM:
PATERNITY: "Usually up to 14 days. Apply with sufficient notice. May require supporting documentation."

// CHANGE TO:
PATERNITY: "6 working days for employees with 1+ year service. Max 2 occasions with 36-month gap. Apply with sufficient notice."
```

**Files to Modify:**
- `app/leaves/apply/_components/leave-constants.ts:33`
- `app/leaves/apply/_components/leave-constants.ts:64`

---

### 3. Special Leave (>60 days EL) Not Implemented
**Severity:** CRITICAL
**Policy Reference:** 6.19.c

**Policy States:**
> "Any period earned in excess of 60 days shall be credited up to 180 days to a separate item in the leave account as special leave from which leave may be allowed on full pay on medical ground or for rest and recreation outside Bangladesh."

**Code States:**
- `scripts/jobs/el-accrual.ts:150-152` - Caps at 60 days but does not transfer excess to special leave account
- No separate "SPECIAL" leave type for storing 60-180 days excess

**Impact:** Employees lose earned leave beyond 60 days instead of having it transferred to special leave, violating policy entitlements.

**Recommendation:**
1. Create a new leave type `SPECIAL` in the enum (different from `SPECIAL_DISABILITY`)
2. Modify accrual job to transfer excess EL (>60 days) to SPECIAL account (up to 180 total)
3. Allow SPECIAL leave usage only for medical reasons or rest/recreation outside Bangladesh
4. Add validation to ensure SPECIAL leave is used appropriately

**Files to Modify:**
- `prisma/schema.prisma` - Add SPECIAL to LeaveType enum
- `scripts/jobs/el-accrual.ts` - Add transfer logic
- `lib/policy.ts` - Add special leave rules
- API endpoints for balance management

---

### 4. Earned Leave Encashment Not Implemented
**Severity:** CRITICAL
**Policy Reference:** 6.19.f

**Policy States:**
> "Accrued accumulated earned leave in excess of 10 days can be en-cashed."

**Code States:**
- No encashment API endpoint found
- No encashment UI components found
- No encashment calculation logic found

**Impact:** Employees cannot exercise their right to encash earned leave beyond 10 days, violating policy entitlements.

**Recommendation:**
1. Create API endpoint: `POST /api/leaves/encash`
2. Add encashment request UI component
3. Add validation: Only EL > 10 days can be encashed
4. Calculate encashment amount based on current salary
5. Require approval workflow (HR_HEAD → CEO)
6. Deduct encashed days from balance

**Files to Create:**
- `app/api/leaves/encash/route.ts`
- `app/leaves/encash/page.tsx`
- UI components for encashment request

---

### 5. Casual Leave Holiday Side-Touch Rule Incomplete
**Severity:** CRITICAL
**Policy Reference:** 6.20.e

**Policy States:**
> "Casual leave cannot be combined with any other leave or preceded or succeeded by any holidays."

**Code States:**
- `lib/leave-validation.ts:47-71` - Validates that CL cannot START or END on holidays
- Does NOT validate that day BEFORE start or day AFTER end cannot be holidays (for sandwiching)

**Current Implementation:**
```typescript
// Only checks if start/end dates are holidays
if (isNonWorking(normalizedStart, holidays)) return true;
if (isNonWorking(normalizedEnd, holidays)) return true;

// Checks day before and after
const beforeStart = addDays(normalizedStart, -1);
const afterEnd = addDays(normalizedEnd, 1);
return (
  isNonWorking(beforeStart, holidays) || isNonWorking(afterEnd, holidays)
);
```

**Wait, I need to reread this...**

Actually, looking at the code again (`lib/leave-validation.ts:65-70`), it DOES check:
- Day before start: `isNonWorking(beforeStart, holidays)`
- Day after end: `isNonWorking(afterEnd, holidays)`

**Re-assessment:** The implementation IS correct for preventing sandwiching. However, the policy also states "cannot be combined with any other leave" which is not validated.

**Revised Issue:**
The code validates holiday sandwiching correctly, but does NOT validate that casual leave cannot be combined with other leave types.

**Recommendation:**
Add validation to check if CL dates overlap or are adjacent to other approved/pending leave requests.

```typescript
async function violatesCasualLeaveCombination(
  userId: number,
  start: Date,
  end: Date
): Promise<boolean> {
  // Check if there are other leaves immediately before or after CL dates
  const adjacentLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      status: { in: ["APPROVED", "PENDING"] },
      OR: [
        // Leave ending day before CL starts
        { endDate: addDays(start, -1) },
        // Leave starting day after CL ends
        { startDate: addDays(end, 1) },
        // Leave overlapping CL dates
        {
          startDate: { lte: end },
          endDate: { gte: start }
        }
      ]
    }
  });

  return adjacentLeaves.length > 0;
}
```

**Files to Modify:**
- `lib/leave-validation.ts` - Add combination check

---

### 6. Medical Leave >14 Days Auto-Conversion Not Implemented
**Severity:** CRITICAL
**Policy Reference:** 6.21.c

**Policy States:**
> "Medical leave in excess of 14 working days in a year shall be adjusted with the employee's Earned/special leave due."

**Code States:**
- No logic found to automatically convert medical leave beyond 14 days to earned leave
- `lib/policy.ts:5` defines `ML_PER_YEAR: 14` but no enforcement of conversion

**Impact:** Employees can potentially take more than 14 days medical leave without it being deducted from earned leave, violating policy.

**Recommendation:**
1. Add validation during leave application: If total ML usage in year + requested days > 14, show warning
2. Automatically calculate overflow: If ML request causes total ML > 14, split into ML (up to 14) + EL (overflow)
3. Update balance deduction logic to handle split leave types
4. Show clear indication in UI when ML is converted to EL

**Example:**
- Employee has used 10 days ML
- Requests 8 days ML
- System should: Approve 4 days as ML (total = 14), convert 4 days to EL

**Files to Modify:**
- `app/api/leaves/route.ts` - Add conversion logic in POST handler
- `lib/policy.ts` - Add conversion utility function
- UI components - Show conversion warning/notice

---

### 7. Leave Eligibility Service Requirements Not Enforced
**Severity:** CRITICAL
**Policy Reference:** 6.18

**Policy States:**

| Leave Type | Eligibility Requirement |
|------------|------------------------|
| Earned Leave | 1 year continuous service |
| Casual Leave | On joining (no restriction) |
| Medical Leave | 1 year continuous service |
| Extraordinary (with pay) | 3 years continuous service |
| Extraordinary (without pay) | 2 years continuous service |
| Maternity | Confirmed employee (6 months) |
| Paternity | 1 year continuous service |
| Study Leave | 3 years continuous service |
| Special Disability | 3 years continuous service |

**Code States:**
- No validation found in leave application API
- No service year calculation or eligibility checks
- All leave types appear to be available to all employees regardless of tenure

**Impact:** New employees can apply for leave types they're not eligible for (e.g., Study Leave within first 3 years), violating policy.

**Recommendation:**
1. Calculate employee service years on every leave application
2. Add eligibility validation based on policy matrix
3. Hide ineligible leave types in UI dropdown
4. Show clear error message if ineligible leave type is selected

```typescript
function getServiceYears(joinDate: Date): number {
  const today = new Date();
  const diffMs = today.getTime() - joinDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365);
}

function isEligibleForLeaveType(type: LeaveType, serviceYears: number): boolean {
  const requirements: Record<LeaveType, number> = {
    EARNED: 1,
    CASUAL: 0,
    MEDICAL: 1,
    EXTRAWITHPAY: 3,
    EXTRAWITHOUTPAY: 2,
    MATERNITY: 0.5, // 6 months
    PATERNITY: 1,
    STUDY: 3,
    SPECIAL_DISABILITY: 3,
    QUARANTINE: 0,
  };

  return serviceYears >= requirements[type];
}
```

**Files to Modify:**
- `app/api/leaves/route.ts` - Add eligibility validation
- `app/leaves/apply/_components/ApplyLeaveForm.tsx` - Filter leave type options
- `lib/policy.ts` - Add eligibility rules and functions

---

### 8. Maternity Leave Pro-rating Not Implemented
**Severity:** CRITICAL
**Policy Reference:** 6.23.c

**Policy States:**
> "The maternity leave will be applicable to employees who completed more than six month's service. Employees with less than six months of service shall get such leave on pro-rate basis."

**Code States:**
- No service duration check for maternity leave
- No pro-rating calculation found
- Fixed 8 weeks (56 days) appears to be applied uniformly

**Impact:** Employees with less than 6 months service receive full maternity leave instead of pro-rated amount, violating policy.

**Recommendation:**
1. Calculate service months on maternity leave application
2. If < 6 months, apply pro-rating formula
3. Pro-rating formula: `(service_months / 6) * 56 days`

**Example:**
- Employee with 3 months service: `(3/6) * 56 = 28 days`
- Employee with 6+ months service: Full 56 days

```typescript
function calculateMaternityLeaveDays(joinDate: Date): number {
  const serviceMonths = getServiceMonths(joinDate);

  if (serviceMonths >= 6) {
    return 56; // 8 weeks
  }

  // Pro-rate for < 6 months
  return Math.floor((serviceMonths / 6) * 56);
}
```

**Files to Modify:**
- `app/api/leaves/route.ts` - Add maternity pro-rating logic
- `lib/policy.ts` - Add maternity calculation function

---

## 🟠 MAJOR ISSUES (Should Be Addressed)

### 9. Paternity Leave Maximum Occasions Not Enforced
**Severity:** MAJOR
**Policy Reference:** 6.24.b

**Policy States:**
> "Paternity leave shall not be admissible to an employee for more than two occasions during his entire period of service life, the interval between the first and the last Paternity Leave being not less than 36 months."

**Code States:**
- No validation to check if employee has already taken 2 paternity leaves
- No validation to check 36-month interval between paternity leaves

**Impact:** Employees can potentially take unlimited paternity leaves, violating policy limits.

**Recommendation:**
1. Query previous PATERNITY leave requests for user
2. Count approved paternity leaves
3. If count >= 2, reject new application
4. If count == 1, validate that start date is at least 36 months after previous paternity leave end date

```typescript
async function validatePaternityLeaveEligibility(userId: number, startDate: Date): Promise<{valid: boolean, reason?: string}> {
  const previousPaternity = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      type: "PATERNITY",
      status: "APPROVED"
    },
    orderBy: { startDate: "desc" }
  });

  if (previousPaternity.length >= 2) {
    return { valid: false, reason: "Maximum 2 paternity leaves allowed during service" };
  }

  if (previousPaternity.length === 1) {
    const lastPaternity = previousPaternity[0];
    const monthsSinceLast = differenceInMonths(startDate, lastPaternity.endDate);

    if (monthsSinceLast < 36) {
      return { valid: false, reason: `Minimum 36-month interval required. Last paternity leave was ${monthsSinceLast} months ago.` };
    }
  }

  return { valid: true };
}
```

**Files to Modify:**
- `app/api/leaves/route.ts` - Add paternity validation
- `lib/leave-validation.ts` - Add paternity eligibility function

---

### 10. Study Leave Duration Not Validated
**Severity:** MAJOR
**Policy Reference:** 6.25

**Policy States:**
> "Study leave without any pay and allowances for a period not exceeding one year may be granted"
>
> "the Management may, in such special case, grant him extension of the study leave for a period not exceeding one year to cover up the short fall."

**Total Maximum:** 2 years (1 year initial + 1 year extension)

**Code States:**
- No duration validation for study leave
- No tracking of initial vs extension periods
- Employees could potentially request study leave longer than 2 years

**Impact:** System allows study leave applications exceeding policy limits.

**Recommendation:**
1. Validate study leave duration <= 365 days for initial application
2. Track if study leave is initial or extension (add field to LeaveRequest)
3. For extensions, validate total duration (initial + extension) <= 730 days
4. Require board approval for extensions

```typescript
async function validateStudyLeaveDuration(
  userId: number,
  startDate: Date,
  endDate: Date,
  isExtension: boolean
): Promise<{valid: boolean, reason?: string}> {
  const requestedDays = differenceInDays(endDate, startDate) + 1;

  if (!isExtension) {
    // Initial study leave max 365 days
    if (requestedDays > 365) {
      return { valid: false, reason: "Initial study leave cannot exceed 365 days (1 year)" };
    }
  } else {
    // Extension: check total duration
    const initialStudyLeave = await prisma.leaveRequest.findFirst({
      where: {
        requesterId: userId,
        type: "STUDY",
        status: "APPROVED",
        isExtension: false
      },
      orderBy: { endDate: "desc" }
    });

    if (!initialStudyLeave) {
      return { valid: false, reason: "No initial study leave found to extend" };
    }

    const initialDays = differenceInDays(initialStudyLeave.endDate, initialStudyLeave.startDate) + 1;
    const totalDays = initialDays + requestedDays;

    if (totalDays > 730) {
      return { valid: false, reason: `Total study leave cannot exceed 730 days (2 years). Initial: ${initialDays} days, Requested: ${requestedDays} days.` };
    }
  }

  return { valid: true };
}
```

**Files to Modify:**
- `prisma/schema.prisma` - Add `isExtension` field to LeaveRequest
- `app/api/leaves/route.ts` - Add study leave duration validation
- `lib/leave-validation.ts` - Add study leave validation function

---

### 11. Quarantine Leave Duration Not Validated
**Severity:** MAJOR
**Policy Reference:** 6.28.b

**Policy States:**
> "Quarantine leave may be granted by the management on the certificate of a Medical or Public Health Officer for period not exceeding 21 (twenty-one) days or, in exceptional circumstances, 30 (thirty) days."

**Code States:**
- No duration validation for quarantine leave
- No distinction between normal (21 days) and exceptional (30 days) circumstances
- System allows quarantine leave of any duration

**Impact:** System allows quarantine leave exceeding policy limits without requiring exceptional approval.

**Recommendation:**
1. Validate quarantine leave <= 21 days for standard approval
2. If 21 < days <= 30, flag as "exceptional" and require CEO approval
3. Reject quarantine leave > 30 days
4. Require medical/public health certificate upload

```typescript
function validateQuarantineLeaveDuration(days: number): {
  valid: boolean,
  requiresExceptionalApproval: boolean,
  reason?: string
} {
  if (days <= 21) {
    return { valid: true, requiresExceptionalApproval: false };
  }

  if (days <= 30) {
    return {
      valid: true,
      requiresExceptionalApproval: true,
      reason: "Quarantine leave exceeding 21 days requires exceptional approval from CEO"
    };
  }

  return {
    valid: false,
    requiresExceptionalApproval: false,
    reason: "Quarantine leave cannot exceed 30 days per policy 6.28.b"
  };
}
```

**Files to Modify:**
- `app/api/leaves/route.ts` - Add quarantine duration validation
- `lib/workflow.ts` - Modify QUARANTINE chain to include CEO for >21 days
- `lib/policy.ts` - Add quarantine duration rules

---

### 12. Special Disability Leave Duration Not Validated
**Severity:** MAJOR
**Policy Reference:** 6.27.c

**Policy States:**
> "The period of special disability leave granted shall be such as is certified by a Medical examination to be necessary, and it shall not be extended except on the certificate of a Physician acceptable to the Company, and shall in no case exceed 6 (six) months."

**Code States:**
- No duration validation for special disability leave
- No tracking of extensions
- System allows special disability leave of any duration

**Impact:** System allows special disability leave exceeding 6 months policy limit.

**Recommendation:**
1. Validate special disability leave <= 180 days (6 months)
2. Require medical certificate upload for initial application
3. For extensions, require physician certificate
4. Track total disability leave duration including extensions

```typescript
async function validateSpecialDisabilityDuration(
  userId: number,
  startDate: Date,
  endDate: Date,
  isExtension: boolean
): Promise<{valid: boolean, reason?: string}> {
  const requestedDays = differenceInDays(endDate, startDate) + 1;

  // Get any previous special disability leave for same disability
  const previousLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: userId,
      type: "SPECIAL_DISABILITY",
      status: "APPROVED",
      // Assuming we add a disabilityId field to track same disability
    }
  });

  const totalDays = previousLeaves.reduce((sum, leave) =>
    sum + differenceInDays(leave.endDate, leave.startDate) + 1,
    requestedDays
  );

  if (totalDays > 180) {
    return {
      valid: false,
      reason: `Special disability leave cannot exceed 180 days (6 months) per disability. Total requested: ${totalDays} days.`
    };
  }

  return { valid: true };
}
```

**Files to Modify:**
- `prisma/schema.prisma` - Add `disabilityId` to track same disability across multiple leaves
- `app/api/leaves/route.ts` - Add disability duration validation
- `lib/leave-validation.ts` - Add disability validation function

---

### 13. Extraordinary Leave Duration Not Validated
**Severity:** MAJOR
**Policy Reference:** 6.22.a, 6.22.b

**Policy States:**
> "Extraordinary leaves with/ without pay may be granted for a maximum period of 12 (twelve) months"
>
> "In case of an employee who has not completed 5 (five) years of continuous service, the total duration of extraordinary leave shall not exceed 6 (six) months"

**Code States:**
- No duration validation for extraordinary leave
- No service year check for 5-year threshold
- System allows extraordinary leave of any duration regardless of service years

**Impact:** Employees with <5 years service can request 12 months extraordinary leave instead of 6 months limit.

**Recommendation:**
1. Calculate employee service years
2. If service < 5 years, validate extraordinary leave <= 180 days (6 months)
3. If service >= 5 years, validate extraordinary leave <= 365 days (12 months)
4. Track cumulative extraordinary leave usage

```typescript
async function validateExtraordinaryLeaveDuration(
  userId: number,
  joinDate: Date,
  startDate: Date,
  endDate: Date
): Promise<{valid: boolean, reason?: string}> {
  const requestedDays = differenceInDays(endDate, startDate) + 1;
  const serviceYears = getServiceYears(joinDate);

  const maxDays = serviceYears >= 5 ? 365 : 180;
  const maxLabel = serviceYears >= 5 ? "12 months" : "6 months";

  if (requestedDays > maxDays) {
    return {
      valid: false,
      reason: `Extraordinary leave cannot exceed ${maxLabel} for employees with ${serviceYears.toFixed(1)} years of service. Requested: ${requestedDays} days.`
    };
  }

  return { valid: true };
}
```

**Files to Modify:**
- `app/api/leaves/route.ts` - Add extraordinary leave duration validation
- `lib/policy.ts` - Add extraordinary leave rules based on service years

---

### 14. Study Leave Retirement Check Not Implemented
**Severity:** MAJOR
**Policy Reference:** 6.25.b

**Policy States:**
> "Study leave shall not be granted to an employee... to an employee who is due to retire within 5 (five) years from the date on which he is likely to return from the study leave."

**Code States:**
- No retirement date tracking
- No validation to check if employee will retire within 5 years of study leave return

**Impact:** Employees close to retirement can request study leave even if they'll retire before completing useful service post-study.

**Recommendation:**
1. Add `retirementDate` field to User model
2. Calculate study leave return date
3. Validate that retirement date is at least 5 years after study leave return date

```typescript
function validateStudyLeaveRetirement(
  retirementDate: Date,
  studyLeaveEndDate: Date
): {valid: boolean, reason?: string} {
  const yearsBetween = differenceInYears(retirementDate, studyLeaveEndDate);

  if (yearsBetween < 5) {
    return {
      valid: false,
      reason: `Study leave cannot be granted if retirement is within 5 years of return date. Retirement: ${retirementDate.toLocaleDateString()}, Study leave return: ${studyLeaveEndDate.toLocaleDateString()}`
    };
  }

  return { valid: true };
}
```

**Files to Modify:**
- `prisma/schema.prisma` - Add `retirementDate` to User model
- `app/api/leaves/route.ts` - Add retirement validation for study leave
- User management UI - Allow setting retirement date

---

### 15. Study Leave Loan Repayment Check Not Implemented
**Severity:** MAJOR
**Policy Reference:** 6.25.c

**Policy States:**
> "An employee shall repay any and all advance/loan due to CDBL along with the interest accrued thereon before proceeding on any study leave, unless decided otherwise by the Management."

**Code States:**
- No loan/advance tracking
- No validation to check outstanding loans before study leave
- No repayment requirement enforcement

**Impact:** Employees with outstanding loans can take study leave without settling debts, violating policy.

**Recommendation:**
1. Integrate with loan/advance system (if exists)
2. Validate study leave application: Check if user has outstanding loans
3. If loans exist, require loan clearance before approving study leave
4. Add management override option

```typescript
async function validateStudyLeaveLoanClearance(userId: number): Promise<{
  valid: boolean,
  outstandingAmount?: number,
  reason?: string
}> {
  // Query loan/advance system
  const outstandingLoans = await prisma.loan.findMany({
    where: {
      userId,
      status: "ACTIVE",
      outstandingBalance: { gt: 0 }
    }
  });

  if (outstandingLoans.length > 0) {
    const totalOutstanding = outstandingLoans.reduce(
      (sum, loan) => sum + loan.outstandingBalance,
      0
    );

    return {
      valid: false,
      outstandingAmount: totalOutstanding,
      reason: `Outstanding loan balance of BDT ${totalOutstanding} must be cleared before study leave per policy 6.25.c`
    };
  }

  return { valid: true };
}
```

**Files to Modify:**
- Create loan tracking system or integrate with existing HR system
- `app/api/leaves/route.ts` - Add loan clearance validation for study leave

---

### 16. Medical Certificate Fitness Certificate Distinction Not Clear
**Severity:** MAJOR
**Policy Reference:** 6.14.c, 6.14.d, 6.21.b

**Policy States:**
> "An employee who is granted leave on medical ground shall not return and report for duties without first producing a certificate of fitness"
>
> "Provided that requirement of such fitness certificate may be waived by the competent authority if the period of leave on medical ground is 7 (seven) days or less."
>
> "An application for medical leave for more than 3 (three) days must be accompanied by a prescription and a medical certificate"

**Distinction:**
- **Medical Certificate**: Required when APPLYING for ML > 3 days
- **Fitness Certificate**: Required when RETURNING from ML > 7 days

**Code States:**
- `prisma/schema.prisma:69` - Has both `certificateUrl` and `fitnessCertificateUrl` fields ✅
- `lib/policy.ts:23-25` - Only checks medical certificate for >3 days, no fitness certificate logic
- No fitness certificate validation on duty return

**Impact:** System doesn't enforce fitness certificate requirement when employees return from medical leave >7 days.

**Recommendation:**
1. Add duty return workflow that checks leave duration
2. If medical leave > 7 days, require fitness certificate upload before marking as returned
3. Block duty return action if fitness certificate not uploaded

```typescript
async function validateDutyReturn(leaveId: number): Promise<{
  valid: boolean,
  requiresFitnessCert: boolean,
  reason?: string
}> {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId }
  });

  if (!leave) {
    return { valid: false, requiresFitnessCert: false, reason: "Leave not found" };
  }

  if (leave.type === "MEDICAL" && leave.workingDays > 7) {
    if (!leave.fitnessCertificateUrl) {
      return {
        valid: false,
        requiresFitnessCert: true,
        reason: "Fitness certificate required for medical leave exceeding 7 days per policy 6.14.c"
      };
    }
  }

  return { valid: true, requiresFitnessCert: false };
}
```

**Files to Modify:**
- `app/api/leaves/[id]/duty-return/route.ts` - Add fitness certificate validation
- UI component for duty return - Show fitness certificate upload field

---

### 17. Casual Leave 5-Day Balance Retention Not Enforced
**Severity:** MAJOR
**Policy Reference:** Implied by leave-constants.ts:30, 45

**Code States:**
- `app/leaves/apply/_components/leave-constants.ts:30` - "Must retain 5 days balance"
- `app/leaves/apply/_components/leave-constants.ts:45` - "Must retain 5 days balance"

**Policy States:**
- Policy 6.20 does NOT explicitly mention retaining 5 days CL balance

**Issue:** Code mentions 5-day retention rule but:
1. Not found in policy document
2. Not enforced in validation logic

**Questions:**
- Is the 5-day retention rule an internal company rule not in the official policy?
- Should this rule be removed from tooltips if not in policy?
- Should this rule be added to policy if it's actually enforced?

**Recommendation:**
1. Clarify with stakeholders if 5-day CL retention is actual policy
2. If yes, add enforcement logic:

```typescript
async function validateCasualLeaveBalance(
  userId: number,
  year: number,
  requestedDays: number
): Promise<{valid: boolean, reason?: string}> {
  const balance = await getBalance(userId, "CASUAL", year);
  const available = (balance.opening ?? 0) + (balance.accrued ?? 0) - (balance.used ?? 0);
  const remainingAfter = available - requestedDays;

  if (remainingAfter < 5) {
    return {
      valid: false,
      reason: `Must retain at least 5 days casual leave balance. Current: ${available} days, Requested: ${requestedDays} days, Remaining: ${remainingAfter} days.`
    };
  }

  return { valid: true };
}
```

3. If no, remove from tooltips

**Files to Modify:**
- Policy document - Add 5-day retention clause if confirmed
- `app/api/leaves/route.ts` - Add balance retention validation
- `app/leaves/apply/_components/leave-constants.ts` - Remove if not policy

---

### 18. Leave Lapse Logic Incomplete
**Severity:** MAJOR
**Policy Reference:** 6.16

**Policy States:**
> "All leave standing to the credit of an employee shall lapse on January 1 every year, except Earned Leave which can be accumulated for a maximum of sixty days or accumulated as special leave."

**Code States:**
- `scripts/jobs/auto-lapse.ts` - Resets CL balance to 0 on Dec 31 ✅
- No lapse logic for ML (medical leave should also lapse annually per policy)
- No lapse logic for other leave types

**Impact:** Medical leave and other leave types don't lapse annually, violating policy.

**Recommendation:**
1. Expand auto-lapse job to reset ML, QUARANTINE, and other annual leave types
2. Only preserve EL balance (up to 60 days + special leave)

```typescript
const LAPSING_LEAVE_TYPES = [
  "CASUAL",      // 10 days/year, no carry forward
  "MEDICAL",     // 14 days/year, no carry forward per 6.21.a
  "QUARANTINE",  // Does not carry forward
];

// In auto-lapse job
for (const type of LAPSING_LEAVE_TYPES) {
  await prisma.balance.updateMany({
    where: { type, year: currentYear },
    data: {
      opening: 0,
      accrued: 0,
      used: 0,
      closing: 0
    }
  });
}
```

**Files to Modify:**
- `scripts/jobs/auto-lapse.ts` - Add ML and other leave types to lapse logic

---

### 19. Earned Leave Payment on Termination Missing
**Severity:** MAJOR
**Policy Reference:** 6.29

**Policy States:**
> "If the services of an employee, to whom earned leave is due, is dispensed with as a result of retrenchment, discharge, removal, dismissal, termination, retirement or by reason of his/her resignation CDBL shall pay his/her salary in lieu of the unused earned leave."

**Code States:**
- No exit/termination workflow found
- No calculation of unused EL payment
- No payment generation logic

**Impact:** System doesn't calculate or track payment for unused earned leave when employees exit.

**Recommendation:**
1. Create employee exit workflow
2. Calculate unused EL balance on exit date
3. Calculate payment: `unusedEL * dailySalary`
4. Generate exit clearance report with EL payment amount
5. Integration with payroll system

```typescript
async function calculateExitELPayment(userId: number, exitDate: Date): Promise<{
  unusedEL: number,
  dailySalary: number,
  totalPayment: number
}> {
  const year = exitDate.getFullYear();
  const balance = await getBalance(userId, "EARNED", year);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const unusedEL = (balance.opening ?? 0) + (balance.accrued ?? 0) - (balance.used ?? 0);
  const dailySalary = user.grossSalary / 22; // Per policy 6.4: One Day Salary = Gross Salary / 22
  const totalPayment = unusedEL * dailySalary;

  return { unusedEL, dailySalary, totalPayment };
}
```

**Files to Create:**
- `app/api/employee/exit/route.ts` - Employee exit workflow
- `app/employee/exit/[id]/page.tsx` - Exit clearance UI

---

### 20. Casual Leave Notice Period Confusion
**Severity:** MAJOR
**Policy Reference:** 6.11.a

**Policy States:**
> "All applications for leave other than sick leave must be submitted in the prescribed form through employee's department head to HRD at least 5 working days ahead (with the exception of casual leave and quarantine leave)"

**This means:** Casual leave is EXEMPT from 5-day notice requirement

**Code States:**
- `lib/policy.ts:10` - `clMinNoticeDays: 5` with comment "warning only for CL (soft rule)"
- `lib/policy.ts:62` - Shows warning if CL notice < 5 days

**Issue:** Policy exempts CL from 5-day notice, but code enforces 5-day notice (even as soft warning)

**Recommendation:**
Remove the 5-day notice warning for casual leave entirely, as policy explicitly exempts it.

```typescript
// REMOVE THIS:
if (String(type) === "CASUAL" && clNoticeWarning(applyDate, start)) {
  warnings.clShortNotice = true;
}

// Casual leave should have no notice requirement per policy 6.11.a
```

**Files to Modify:**
- `lib/policy.ts:10` - Remove `clMinNoticeDays`
- `lib/policy.ts:62-64` - Remove CL notice warning logic
- `lib/policy.ts:50-53` - Remove `clNoticeWarning` function

---

## 🟡 MINOR ISSUES (Nice to Have)

### 21. Working Hours Not Tracked
**Severity:** MINOR
**Policy Reference:** 6.1

**Policy States:**
> "Office hours in all CDBL offices normally is from 9am – 5pm, Sunday through Thursday, with an hour for lunch and prayer, from 1 to 2pm."

**Code States:**
- No working hours configuration found
- No attendance tracking integration

**Impact:** System doesn't enforce or track working hours compliance.

**Recommendation:**
- Add working hours configuration in settings
- Consider integration with biometric attendance system mentioned in 6.2
- Out of scope for leave management system unless attendance integration needed

---

### 22. Overtime Calculation Not Implemented
**Severity:** MINOR
**Policy Reference:** 6.4

**Policy States:**
> "Overtime Payment = (Hourly pay rate x 2)"
> "One Day Salary = Gross Salary / 22 (days)"
> "One Hour Salary = One Day Salary / 8 Hours"

**Code States:**
- No overtime tracking
- No overtime calculation logic

**Impact:** System doesn't support overtime payment calculations.

**Recommendation:**
- Out of scope for leave management system
- Should be handled by attendance/payroll system
- Consider integration if needed

---

### 23. On-Call Duties Allowance Not Implemented
**Severity:** MINOR
**Policy Reference:** 6.5

**Policy States:**
> "Executive Cadre – BDT 1,500"
> "General Service Staff – BDT 700"

**Code States:**
- No on-call duty tracking
- No allowance configuration

**Impact:** System doesn't track or calculate on-call allowances.

**Recommendation:**
- Out of scope for leave management system
- Should be handled by attendance/payroll system

---

### 24. Absenteeism Guidelines Not Enforced
**Severity:** MINOR
**Policy Reference:** 6.6

**Policy States:**
> Defines excessive absenteeism thresholds and tardiness patterns

**Code States:**
- No absenteeism tracking
- No tardiness monitoring
- No disciplinary action workflow

**Impact:** System doesn't monitor or flag attendance issues.

**Recommendation:**
- Out of scope for leave management system
- Should be handled by attendance/HR management system
- Consider integration if needed

---

### 25. Leave Recall Functionality Incomplete
**Severity:** MINOR
**Policy Reference:** 6.9

**Policy States:**
> "An employee on leave may be recalled to duty before expiry of the leave and, if recalled, he shall be treated on duty from the date on which s/he starts for the station to which s/he is ordered to return and shall be entitled to traveling allowance for the journey he takes in this behalf."

**Code States:**
- `POST /api/leaves/[id]/recall` endpoint exists ✅
- No travel allowance calculation
- No travel allowance tracking

**Impact:** System supports recall but doesn't handle travel allowance mentioned in policy.

**Recommendation:**
- Add travel allowance field to recall action
- Integration with payroll for travel allowance payment
- Low priority as recall is rare event

---

## SUMMARY OF REQUIRED CHANGES

### Database Schema Changes
```prisma
enum LeaveType {
  EARNED
  CASUAL
  MEDICAL
  EXTRAWITHPAY
  EXTRAWITHOUTPAY
  MATERNITY
  PATERNITY
  STUDY
  SPECIAL_DISABILITY
  QUARANTINE
  SPECIAL              // NEW: For EL excess beyond 60 days
}

model User {
  id              Int       @id @default(autoincrement())
  // ... existing fields
  joinDate        DateTime  // Required for service year calculations
  retirementDate  DateTime? // Required for study leave validation
  grossSalary     Decimal   // Required for EL payment calculations
}

model LeaveRequest {
  // ... existing fields
  isExtension     Boolean   @default(false) // For study leave extensions
  disabilityId    String?   // To track same disability across leaves
}

model Loan {
  id                 Int      @id @default(autoincrement())
  userId             Int
  amount             Decimal
  outstandingBalance Decimal
  status             String
  // ... other fields
}
```

### Code Files Requiring Changes

**Critical Priority:**
1. `app/leaves/apply/_components/leave-constants.ts` - Fix maternity/paternity durations
2. `prisma/schema.prisma` - Add SPECIAL leave type
3. `scripts/jobs/el-accrual.ts` - Implement special leave transfer logic
4. `app/api/leaves/route.ts` - Add comprehensive validation logic
5. `lib/leave-validation.ts` - Add all validation functions
6. `lib/policy.ts` - Add policy rules and eligibility functions

**Major Priority:**
7. `scripts/jobs/auto-lapse.ts` - Add ML and other leave type lapsing
8. `lib/workflow.ts` - Adjust workflows for exceptional approvals
9. API endpoints - Add encashment, exit workflow
10. UI components - Add encashment form, fitness cert upload

**Minor Priority:**
11. Integration with attendance/payroll systems
12. Travel allowance tracking

---

## REFACTORING RECOMMENDATIONS

### Phase 1: Critical Compliance (Week 1-2)
- Fix duration mismatches (maternity, paternity)
- Implement service eligibility validation
- Add medical leave >14 days conversion
- Implement maternity pro-rating

### Phase 2: Major Features (Week 3-4)
- Implement special leave (>60 EL) tracking
- Add EL encashment functionality
- Implement duration validations for all leave types
- Add occasion/interval validations (paternity)

### Phase 3: Workflow Enhancements (Week 5-6)
- Fitness certificate validation on duty return
- Study leave retirement/loan checks
- Casual leave combination validation
- Complete leave lapse logic

### Phase 4: Exit & Payments (Week 7-8)
- Employee exit workflow
- EL payment calculation
- Payroll integration
- Reporting and auditing

---

## TESTING CHECKLIST

- [ ] Maternity leave shows 8 weeks (not 16 weeks)
- [ ] Paternity leave shows 6 days (not 14 days)
- [ ] Employees with <1 year service cannot apply for EL
- [ ] Employees with <3 years service cannot apply for study leave
- [ ] Medical leave >14 days converts to EL
- [ ] EL >60 days transfers to special leave
- [ ] Quarantine leave >21 days requires CEO approval
- [ ] Paternity leave validates 2-occasion limit and 36-month gap
- [ ] Study leave validates 2-year total limit
- [ ] Extraordinary leave respects 6-month/<5yr or 12-month/>=5yr limits
- [ ] Casual leave cannot be combined with other leaves
- [ ] Fitness certificate required for ML >7 days on return
- [ ] ML and other leaves lapse on Dec 31
- [ ] EL payment calculated on employee exit
- [ ] CL has no notice period warning (policy exempts CL)

---

## CONCLUSION

The CDBL LMS codebase has a solid foundation but requires significant refactoring to achieve full compliance with the official HR Policy Chapter 06. The most critical issues involve incorrect leave durations displayed to users and missing validation logic for policy rules.

**Recommended Action:** Prioritize Critical Issues (especially #1-8) for immediate resolution to avoid policy violations and employee confusion.

**Estimated Effort:** 6-8 weeks for full compliance including testing

**Risk Level:** MEDIUM - Current system allows some policy violations but no critical data corruption risks identified.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Reviewers:** [Pending]
**Approval Status:** [Pending]
