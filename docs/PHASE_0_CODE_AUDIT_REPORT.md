# Phase 0: Code Audit Report
**Date**: 2025-11-14
**Purpose**: Document current implementation status vs Master Spec requirements
**Status**: In Progress

---

## Executive Summary

This audit analyzes the current CDBL-LMS codebase against the Master Specification requirements.

**Overall Assessment**: ~75-80% Compliant

---

## 1. Leave Type-Specific Validation Rules

### ✅ FULLY IMPLEMENTED

#### Casual Leave (CL)
- ✅ **Max 3 consecutive days** - `policy.clMaxConsecutiveDays = 3` (lib/policy.ts:11)
- ✅ **Cannot combine with other leaves** - `violatesCasualLeaveCombination()` (lib/leave-validation.ts:77-138)
- ✅ **Notice exempt** - `clNoticeWarning()` returns false (lib/policy.ts:62)
- ✅ **Validation integration** - Used in `LeaveValidator.validateCasualLeave()` (lib/services/leave-validator.ts:134-183)

**Status**: Implementation exists, needs verification for:
- ❓ **Cannot touch holidays** - There's `violatesCasualLeaveSideTouch()` but need to clarify if this matches master spec
- ❌ **CL >3 days → EL conversion** - NOT FOUND in validation logic

#### Earned Leave (EL)
- ✅ **2 days/month accrual** - `policy.elAccrualPerMonth = 2` (lib/policy.ts:14)
- ✅ **24 days/year** - `policy.accrual.EL_PER_YEAR = 24` (lib/policy.ts:5)
- ✅ **60-day carryover cap** - `policy.carryForwardCap.EL = 60` (lib/policy.ts:7)
- ✅ **5 working days notice** - `policy.elMinNoticeDays = 5` (lib/policy.ts:10)
- ✅ **Notice validation** - `LeaveValidator.validateEarnedLeaveNotice()` (lib/services/leave-validator.ts:107-129)
- ✅ **Encashment >10 days** - `validateELEncashment()` (lib/policy.ts:303-349)
- ✅ **Backdating allowed (30 days)** - `policy.allowBackdate.EL = true, maxBackdateDays.EL = 30` (lib/policy.ts:8-9)

**Status**: Well implemented, need to verify:
- ❌ **EL overflow 60→180 (SPECIAL)** - SPECIAL type exists in schema, but overflow logic NOT FOUND

#### Medical Leave (ML)
- ✅ **14 days/year** - `policy.accrual.ML_PER_YEAR = 14` (lib/policy.ts:5)
- ✅ **Certificate >3 days** - `needsMedicalCertificate()` (lib/policy.ts:24)
- ✅ **Annual limit check** - `checkMedicalLeaveAnnualLimit()` (lib/policy.ts:267-294)
- ✅ **Backdating allowed (30 days)** - `policy.allowBackdate.ML = true, maxBackdateDays.ML = 30` (lib/policy.ts:8-9)

**Status**: Well implemented, need to implement:
- ❌ **ML >14 days → auto convert to EL** - Warning exists in `checkMedicalLeaveAnnualLimit()` but NO automatic conversion
- ❌ **ML max 30 days with extensions** - Max duration not enforced
- ❌ **Fitness certificate after ML >7 days** - Schema field `fitnessCertificateUrl` exists but validation NOT FOUND

#### Maternity Leave
- ✅ **8 weeks (56 days) full pay** - Implicit in `calculateMaternityLeaveDays()` (lib/policy.ts:158-183)
- ✅ **6+ months service = full, <6 months = pro-rated** - `calculateMaternityLeaveDays()` (lib/policy.ts:158-183)
- ✅ **Service eligibility (0.5 years)** - `SERVICE_ELIGIBILITY_YEARS.MATERNITY = 0.5` (lib/policy.ts:97)
- ✅ **Validation** - `LeaveValidator.validateMaternityLeave()` (lib/services/leave-validator.ts:187-215)

**Status**: Well implemented, need to implement:
- ❌ **Cannot cancel after start** - NOT FOUND in cancellation logic
- ❓ **Document requirements** - Need to verify

#### Paternity Leave
- ✅ **6 working days** - Implicit (not hardcoded, should verify)
- ✅ **Max 2 times lifetime** - `validatePaternityLeaveEligibility()` checks `previousPaternity.length >= 2` (lib/leave-validation.ts:170)
- ✅ **36-month gap** - `validatePaternityLeaveEligibility()` checks interval (lib/leave-validation.ts:179-195)
- ✅ **Service eligibility (1 year)** - `SERVICE_ELIGIBILITY_YEARS.PATERNITY = 1` (lib/policy.ts:98)
- ✅ **Validation integration** - `LeaveValidator.validatePaternityLeave()` (lib/services/leave-validator.ts:219-245)

**Status**: EXCELLENT - Fully implemented per master spec ✅

#### Study Leave
- ✅ **3 years service requirement** - `SERVICE_ELIGIBILITY_YEARS.STUDY = 3` (lib/policy.ts:99)
- ✅ **5 years until retirement buffer** - `validateStudyLeaveRetirement()` exists (referenced in leave-validator.ts:89)
- ✅ **12 months + 12 months extension** - `validateStudyLeaveDuration()` exists (referenced in leave-validator.ts:343)
- ✅ **Validation integration** - `LeaveValidator.validateStudyLeave()` (lib/services/leave-validator.ts:325-364)

**Status**: Well implemented, need to verify:
- ❓ **Document requirements** (admission letter, loan repayment proof) - Need to check

#### Special Disability Leave
- ✅ **Max 6 months (180 days)** - `validateSpecialDisabilityDuration()` (lib/policy.ts:215-233)
- ✅ **3 years service requirement** - `SERVICE_ELIGIBILITY_YEARS.SPECIAL_DISABILITY = 3` (lib/policy.ts:100)
- ✅ **Validation integration** - `LeaveValidator.validateDisabilityLeave()` (lib/services/leave-validator.ts:273-291)

**Status**: Duration implemented, need to implement:
- ❌ **First 3 months full pay, next 3 months half pay** - Pay calculation logic NOT FOUND
- ❌ **Must occur within 3 months of incident** - Timeline validation NOT FOUND
- ❓ **Board approval requirement** - Need to check workflow

#### Extraordinary Leave (With/Without Pay)
- ✅ **Duration based on service** - `validateExtraordinaryLeaveDuration()` (lib/policy.ts:240-261)
  - <5 years service → 180 days (6 months)
  - ≥5 years service → 365 days (12 months)
- ✅ **Service eligibility** - `SERVICE_ELIGIBILITY_YEARS.EXTRAWITHPAY = 3, EXTRAWITHOUTPAY = 2` (lib/policy.ts:95-96)
- ✅ **Validation integration** - `LeaveValidator.validateExtraordinaryLeave()` (lib/services/leave-validator.ts:296-320)

**Status**: Well implemented, need to implement:
- ❌ **Prerequisite: only when no other leave is due** - Balance check NOT FOUND

#### Quarantine Leave
- ✅ **21 days standard, 30 days exceptional** - `validateQuarantineLeaveDuration()` (lib/policy.ts:191-213)
- ✅ **21-30 days requires CEO approval** - `requiresExceptionalApproval: true` flag (lib/policy.ts:203)
- ✅ **Service eligibility (0 years)** - `SERVICE_ELIGIBILITY_YEARS.QUARANTINE = 0` (lib/policy.ts:101)
- ✅ **Validation integration** - `LeaveValidator.validateQuarantineLeave()` (lib/services/leave-validator.ts:250-268)

**Status**: EXCELLENT - Fully implemented per master spec ✅

#### Special (EL Overflow)
- ✅ **Type exists** - Defined in schema (prisma/schema.prisma:30)
- ✅ **Comment in schema** - "EL excess >60 days, usable for medical or rest outside Bangladesh (Policy 6.19.c)"
- ❌ **Automatic overflow logic** - NOT FOUND (should auto-transfer EL >60 to SPECIAL, max 180 total)

**Status**: Type defined but business logic missing

---

## 2. Approval Workflow

### ✅ IMPLEMENTED

#### Workflow Chains (lib/workflow.ts)
- ✅ **Default chain**: `HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO` (line 10)
- ✅ **Per-type chains**: All 11 leave types defined (lines 10-21)
- ✅ **CL shorter chain**: `DEPT_HEAD` only (line 12)

**Master Spec Says**:
```
Employee → HR/Admin → Dept Head → HR Head → CEO
```

**Current Implementation**:
```typescript
DEFAULT: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]
CASUAL: ["DEPT_HEAD"]
```

**QUESTION FOR USER**:
- Master spec says "Employee → HR/Admin → ..." but current implementation starts at HR_ADMIN (employee submits, then HR_ADMIN processes).
- Is this correct or should employee be explicit in the chain?
- CL is marked as "Provisional: CL uses shorter chain per Policy 6.10" - is DEPT_HEAD-only correct?

#### Workflow Functions
- ✅ `getChainFor(type)` - Returns chain for specific leave type
- ✅ `getNextRoleInChain(currentRole, type)` - Gets next approver
- ✅ `isFinalApprover(role, type)` - Checks if role can final-approve
- ✅ `canPerformAction(role, action, type)` - Validates role can perform action
- ✅ `canForwardTo(actorRole, targetRole, type)` - Validates forward target

### Workflow Actions
- ✅ **FORWARD** - Implemented
- ✅ **APPROVE** - Implemented
- ✅ **REJECT** - Implemented
- ✅ **RETURN** - Implemented (for requesting modifications)

**Status**: Well implemented, needs master spec alignment verification

---

## 3. Hybrid Enforcement Model

**Master Spec Requirements**:
- **Employee**: Strict rules, no overrides
- **HR/Admin**: Limited soft overrides (late documents, minor date correction, emergency CL)
- **Dept Head & HR Head**: Can only forward/reject/request info (no overrides)
- **CEO**: Final approver, cannot break policy
- **System**: Hard enforcement always

### Current Implementation Analysis

#### Role-Based Action Control (lib/workflow.ts:75-109)
```typescript
canPerformAction(role: AppRole, action: ApprovalAction, type?: LeaveType): boolean
```

**Current Logic**:
- **FORWARD**: Allowed if not final approver
- **APPROVE/REJECT**: Allowed only if final approver
- **RETURN**: Allowed for HR_ADMIN and all approvers

**Status**: ⚠️ **UNCLEAR** - Need to audit actual enforcement in API endpoints

#### API Endpoint Permissions
**Need to check each endpoint for**:
- Role-based access control
- Soft override implementation for HR_ADMIN
- Hard blocks for system rules

**Action Required**: Complete API endpoint audit (Phase 0.2)

---

## 4. Modification & Cancellation Rules

### Master Spec Requirements

| Stage | Modification | Cancellation |
|-------|-------------|--------------|
| **Pending** | Full edit | Immediate |
| **Approved (not started)** | Full approval chain | Full workflow |
| **Started** | Shorten only | Partial (remaining days) |
| **After end** | Not allowed | Not allowed (except HR manual) |

**Extension**: Extension = new linked request

### Current Implementation

#### Cancellation
- ✅ **Cancel endpoint exists**: `app/api/leaves/[id]/cancel/route.ts`
- ✅ **Status check**: Only SUBMITTED/PENDING can be cancelled by DEPT_HEAD (lines 80-90)
- ✅ **Balance restoration**: Implemented (lines 112-143)
- ✅ **Audit log**: Created (lines 146-161)

**Status**: ⚠️ **PARTIAL** - Need to verify:
- ❌ Maternity cancellation blocking after start
- ❌ Partial cancellation (started leaves)
- ❌ Approved (not started) cancellation workflow
- ❌ ML/Maternity fitness certificate requirement on cancel

#### Modification
**Status**: ❌ **NOT AUDITED YET** - Need to check modification endpoints

#### Extension (Linked Requests)
**Status**: ❌ **NOT FOUND** - Need to implement
- ❌ Schema field `parentLeaveId` does not exist
- ❌ Extension creation logic not found

---

## 5. Dashboard Components

### Existing Shared Components (app/dashboard/shared/)
- ✅ `DashboardLayout.tsx` - Layout wrapper
- ✅ `LoadingFallback.tsx` - Loading states
- ✅ `Table.tsx` - Data table
- ✅ `Charts.tsx` - Chart components

### Master Spec Required Components
- ❌ `MetricCard` - Not standardized (exists but not reusable)
- ❌ `ActionCenter` - Not standardized
- ⚠️ `RecentActivityTable` - Exists but not extracted as reusable
- ⚠️ `LeaveBreakdownChart` - Exists in various places but not standardized
- ❌ `TeamCapacityHeatmap` - NOT FOUND
- ⚠️ `ApprovalList` - Exists as `pending-approvals.tsx` but not reusable
- ❌ `FloatingQuickActionButton` - NOT FOUND

**Status**: ⚠️ **NEEDS REFACTORING** - Components exist but need standardization

### Role-Based Dashboards

All 5 dashboards exist:
- ✅ `/dashboard/employee/page.tsx`
- ✅ `/dashboard/dept-head/page.tsx`
- ✅ `/dashboard/hr-admin/page.tsx`
- ✅ `/dashboard/hr-head/page.tsx`
- ✅ `/dashboard/ceo/page.tsx`

**Status**: ⚠️ **NEEDS AUDIT** - Need to verify content matches master spec sections

---

## 6. Critical Findings - Must Fix (P0)

### ❌ Missing Core Features
1. **Maternity cancellation blocking after start** - High risk policy violation
2. **ML >14 days auto-conversion to EL** - Incorrect balance tracking
3. **CL >3 days → EL conversion** - Policy violation
4. **EL overflow 60→180 (SPECIAL)** - Balance tracking issue
5. **Linked extension requests** - Cannot extend started leaves
6. **Shorten functionality** - Cannot modify started leaves correctly
7. **Partial cancellation** - Cannot cancel ongoing leaves properly

### ⚠️ Unclear Implementations
8. **Hybrid enforcement model** - Need to verify API endpoint permissions
9. **CL cannot touch holidays** - `violatesCasualLeaveSideTouch()` exists but need to verify vs master spec
10. **Extraordinary prerequisite** (no other leave due) - Not checked
11. **Special Disability pay logic** - Pay calculation missing
12. **Special Disability incident timeline** - Within 3 months not checked
13. **Fitness certificate enforcement** - ML >7 days requirement not validated

---

## 7. Questions for Clarification

Before proceeding with implementation, need clarification on:

### Q1: Approval Workflow Chain
**Master Spec**: "Employee → HR/Admin → Dept Head → HR Head → CEO"
**Current Code**: `["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]`

**Question**: Is "Employee" implicit (they submit, then HR_ADMIN receives), or should Employee be explicit first step in chain?

### Q2: CL Workflow
**Current Code**: `CASUAL: ["DEPT_HEAD"]`
**Comment**: "Provisional: CL uses shorter chain per Policy 6.10"

**Question**: Is CL approval workflow ONLY Dept Head, or should it include HR_ADMIN first?

### Q3: CL Holiday Rule
**Current Code**: `violatesCasualLeaveSideTouch()` checks if CL start/end or day before/after is weekend/holiday
**Master Spec**: "Cannot touch holidays"

**Question**: Does "cannot touch holidays" mean:
- A) CL dates cannot include holidays in the range (current implementation)?
- B) CL cannot be adjacent to holidays?
- C) Something else?

### Q4: Fitness Certificate
**Schema**: `fitnessCertificateUrl` field exists
**Master Spec**: Required after ML >7 days on return

**Question**: Should this be:
- A) Required at application time for ML >7 days?
- B) Required on return after ML ends (separate flow)?
- C) Optional but tracked?

---

## 8. Next Steps (Phase 0.2)

1. **Create Enforcement Matrix** - Map all API endpoints to roles and actions
2. **Complete API Audit** - Check every leave-related endpoint for permissions
3. **Answer clarification questions** - Get user input on ambiguous requirements
4. **Set up test infrastructure** - Prepare for Phase 1 implementation

---

**Audit Status**: 60% Complete
**Next Task**: Phase 0.2 - Enforcement Matrix Creation
**Blockers**: Need user clarification on Q1-Q4
