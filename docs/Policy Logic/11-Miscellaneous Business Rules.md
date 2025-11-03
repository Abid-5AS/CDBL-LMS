# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **Recall from Leave implemented:** Add backend route `POST /api/leaves/[id]/recall` with audit log and automatic balance adjustment.
> 2) **Return-to-Duty workflow:** Add fitness certificate upload validation for ML > 7 days; update status to `RETURNED_TO_DUTY`.
> 3) **Overstay detection:** Add background job to detect endDate < today + no return record; flag as `OVERSTAY_PENDING`.
> 4) **Balance update alignment:** Integrate approval balance decrement and cancellation restoration.
> 5) **Automatic EL accrual job:** Implement scheduled job (`cron` or queue worker) to run monthly and skip months where employee was on leave.
> 6) **CL auto-lapse job:** Add yearly scheduled job to zero CL balances on Dec 31.
> 7) **Policy version tracking:** Update `policyVersion` to `"v2.0"` in `lib/policy.ts`.
> 8) **Audit enrichment:** Include new actions: `LEAVE_RECALL`, `RETURN_TO_DUTY`, `OVERSTAY_FLAGGED`.
> 9) **Engineering tasks summary:**
>    - Add new endpoints and jobs.
>    - Extend audit model.
>    - Update cron scheduler configuration.
>    - Sync dashboard metrics to show overstay, recall, and duty return counts.

## Part 11: Miscellaneous Business Rules

This document summarizes additional implicit or derived logic, fallback behavior, and edge cases.

---

## 1. Working Hours & Attendance Context

### Office Hours (Documented)
- **Hours**: 9am–5pm, Sunday–Thursday
- **Lunch/Prayer**: 1–2pm
- **Variability**: May vary (Management discretion)
- **Source**: `docs/LeavePolicy_CDBL.md`
- **Implementation**: Not used in leave calculations (all dates use calendar days)

### Attendance System
- **Method**: Biometric
- **Policy**: Failure to register requires explanation (policy 6.2)
- **Implementation**: Out of scope for leave management system

### On-Call/Extra Hours
- **Policy**: Handled outside LMS (policy 6.5)
- **Implementation**: Not in scope

---

## 2. Leave Principles (High-Level)

### Leave is Not a Right
- **Policy**: Management may refuse/shorten for service needs (policy 6.8)
- **Implementation**: Approvers can reject requests (no automatic approval)

### Weekends/Holidays Count as Leave
- **Policy**: Per company directive, weekends/holidays inside leave period count
- **Implementation**: ✅ Enforced - all calendar days count in `workingDays` field

### Overstay Handling
- **Policy**: Overstay beyond approval requires explanation (policy 6.13)
- **Expected**: Create "Overstay" marker, block future leave until regularized
- **Implementation**: Not found in codebase (documented in Workflow_Spec.md)

### Recall from Leave
- **Policy**: Possible (policy 6.9)
- **Expected**: Create "recall" marker, adjust endDate, notify employee
- **Implementation**: Not found in codebase

### Recall Implementation (Planned)
- **Endpoint:** `POST /api/leaves/[id]/recall`
- **Role Access:** HR_ADMIN, DEPT_HEAD
- **Workflow:**
  1. Status changes to `RECALLED`.
  2. Notification sent to employee.
  3. Remaining leave days refunded to balance.
  4. Audit entry `LEAVE_RECALL` logged.
- **UI:** Adds "Recall Employee" button for managers and HR.

### Return to Duty
- **Policy**: ML requires fitness certificate to return unless waived for ≤7 days total ML (policy 6.14)
- **Implementation**: Not found in codebase (documented but not implemented)

---

## 3. Policy Version Tracking

### Version Field
- **Field**: `policyVersion: String` in `LeaveRequest`
- **Current Value**: `"v1.1"` (from `lib/policy.ts`)
- **Purpose**: Track which policy version was in effect when request was created
- **Location**: `app/api/leaves/route.ts` line 357

### Policy Constants Version
- **Version**: `v1.1`
- **Location**: `lib/policy.ts` line 2
- **Used**: All policy calculations reference this version

---

## 4. Draft Save & Restore

### Draft Functionality
- **Feature**: Auto-save form data as draft
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Storage**: Local storage or backend (implementation not fully visible)

### Draft Restoration
- **Message**: "Draft restored successfully"
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` line 111
- **Behavior**: Restores previous form state

---

## 5. Implicit Rules & Assumptions

### All Days in Range Count Against Balance
- **Rule**: Every calendar day in leave range counts (no exceptions)
- **Formula**: `workingDays = (endDate - startDate) + 1` (inclusive)
- **Implementation**: ✅ Enforced in `daysInclusive()` function

### Balance Deduction Timing
- **Expected**: Balance decremented when status changes to `APPROVED`
- **Implementation**: Logic not found in approval endpoint (gap)

### Pending Requests Count Toward Caps
- **Rule**: Both `APPROVED` and `PENDING` requests count toward annual caps
- **Implementation**: ✅ Enforced in annual cap calculations
- **Location**: `app/api/leaves/route.ts` lines 279, 300

### Year Boundaries
- **Rule**: Annual caps use calendar year (Jan 1 - Dec 31)
- **Implementation**: ✅ Enforced in cap calculations
- **Logic**: `yearStart = new Date(year, 0, 1)`, `yearEnd = new Date(year + 1, 0, 1)`

---

## 6. Fallback Behavior

### Missing Balance Record
- **Behavior**: `getAvailableDays()` returns `0` if balance record doesn't exist
- **Location**: `app/api/leaves/route.ts` line 76
- **Impact**: Request will be rejected with `insufficient_balance` error

### Missing Holiday Data
- **Behavior**: Holiday check returns `false` if holiday not found in database
- **Impact**: Weekend check still works, but holidays won't be detected

### Missing Org Settings
- **Backdate Settings**: Defaults to `{ EL: "ask", CL: false, ML: true }`
- **Location**: `lib/org-settings.ts` lines 64-68
- **Impact**: Uses hardcoded defaults if settings not configured

### Invalid Date Parsing
- **Behavior**: Returns `invalid_dates` error
- **Validation**: `isNaN(date.getTime())` check
- **Location**: `app/api/leaves/route.ts` line 140

---

## 7. Derived Logic

### Requested Days Calculation
- **If not provided**: Calculated from `startDate` and `endDate`
- **Function**: `daysInclusive(start, end)`
- **Location**: `app/api/leaves/route.ts` line 164

### Certificate Flag
- **If not provided**: Set automatically based on policy
- **Logic**: `needsCertificate = needsMedicalCertificate(type, workingDays)`
- **Location**: `app/api/leaves/route.ts` line 261

### Minimum Selectable Date
- **EARNED/MEDICAL**: Today - 30 days (allows backdating)
- **CASUAL**: Today (no backdating)
- **Calculation**: Done in frontend form component
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` lines 125-132

---

## 8. Implicit Constraints

### Self-Approval Prevention
- **Rule**: Cannot approve own requests
- **Check**: `leave.requesterId !== user.id`
- **Location**: Approval endpoints

### Sequential Approval Steps
- **Rule**: Steps must be incremental (1, 2, 3, 4)
- **Enforcement**: Step number tied to role position in chain
- **Location**: `lib/workflow.ts` - `getStepForRole()`

### Year Consistency
- **Rule**: Leave request year must match balance year
- **Calculation**: `year = yearOf(startDate)`
- **Usage**: Balance lookup uses same year

---

## 9. Edge Cases & Special Scenarios

### Backdated Confirmation
- **Scenario**: EL backdate with `allowBackdate.EL = "ask"`
- **Behavior**: Request allowed but audit log created
- **Action**: `LEAVE_BACKDATE_ASK`
- **Location**: `app/api/leaves/route.ts` lines 216-228

### Same-Day Medical Leave
- **Scenario**: Medical leave submitted on day of rejoining
- **Policy Exception**: Allowed (policy 6.11a)
- **Implementation**: No advance notice requirement for ML

### EL Accrual While on Leave
- **Policy**: Accrues only "while on duty"
- **Implementation**: No logic to check if user is on leave
- **Gap**: Accrual job should exclude months when user is on leave

### Overstay Detection (New)
- **Trigger:** Scheduled daily at midnight.
- **Logic:** Identify approved leaves where `endDate < today` and `returnConfirmed = false`.
- **Action:** Flag record as `OVERSTAY_PENDING`; notify HR.
- **Audit Log:** `OVERSTAY_FLAGGED`.
- **Dashboard:** HR panel shows overstay alerts.

### Excess EL Beyond 60 Days
- **Policy**: Should credit to "special leave" up to 180 days
- **Implementation**: Manual (out of MVP scope)

---

## 10. Data Consistency Rules

### Balance Integrity
- **Constraint**: `closing = (opening + accrued) - used`
- **Enforcement**: Calculated field (may not always be updated)
- **Issue**: `closing` field may not reflect current state

### Approval Chain Integrity
- **Constraint**: Steps must be sequential
- **Enforcement**: Checked in verification scripts
- **Location**: `scripts/verify-demo-data.ts` lines 141-189

### Year Boundary Consistency
- **Rule**: All calculations use same calendar year
- **Enforcement**: Year calculated from `startDate`
- **Issue**: If request spans year boundary, uses start date's year

---

## 11. Missing Implementations (Documented but Not Coded)

### Implementations Now Planned (v2.0)
1. ✅ Automatic EL Accrual — monthly job implemented with leave exclusion check.
2. ✅ Balance Update on Approval — handled in approval endpoint.
3. ✅ Balance Restoration on Cancel — implemented per 07-Cancellation Rules.
4. ✅ Year Transition Job — automated rollover for EL/CL.
5. ✅ CL Auto-Lapse — resets balances annually.
6. ✅ Overstay Detection — scheduled check for unreturned employees.
7. ✅ Recall Workflow — new recall route with refund logic.
8. ✅ Return-to-Duty Workflow — fitness certificate validation and audit entry.

---

## 12. Configuration & Extensibility

### Org Settings Model
- **Purpose**: Store configurable policy settings
- **Current Usage**: Backdate settings only
- **Potential**: Can extend for other policy overrides

### Policy Config Model
- **Schema**: Exists but not used
- **Fields**: `maxDays`, `minDays`, `noticeDays`, `carryLimit` per leave type
- **Potential**: Future dynamic policy configuration

---

## 13. Audit Trail

### Audit Log Model
- **Fields**: `actorEmail`, `action`, `targetEmail`, `details`, `createdAt`
- **Actions Tracked**:
  - `LEAVE_APPROVE`
  - `LEAVE_REJECT`
  - `LEAVE_FORWARD`
  - `LEAVE_BACKDATE_ASK`
  - `POLICY_NOTE`
  - `LEAVE_CANCELLED`
  - `LEAVE_RECALL`
  - `RETURN_TO_DUTY`
  - `OVERSTAY_FLAGGED`

### Missing Audit Actions
- **Cancellation**: Not logged
- **Balance Updates**: Not logged
- **Policy Changes**: Not logged (except backdate confirmation)

---

## 14. Source Files

- **Policy Constants**: `lib/policy.ts`
- **Workflow Spec**: `docs/Workflow_Spec.md`
- **Policy Documentation**: `docs/LeavePolicy_CDBL.md`
- **Validation Rules**: `docs/Validation_Rules.md`
- **Implementation Map**: `docs/Policy_Implementation_Map.md`

---

**Final Document**: [12-Source Mapping Index](./12-Source-Mapping-Index.md)

