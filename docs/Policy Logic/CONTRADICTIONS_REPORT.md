# Policy Logic Contradictions Report

**Source of Truth**: `SourceOfTruth.md` (HR Policy Manual, Chapter 06, pp. 32-41)
**Date**: January 2025 (v2.0)
**Purpose**: Track resolution of contradictions between Policy Logic documents and the official HR Policy source

---

## ✅ RESOLVED: Critical Contradictions (v2.0)

### 1. Earned Leave Annual Entitlement - **RESOLVED** ✅

**SourceOfTruth.md (6.19)**:

> "Accrual: **2 working days per month** = 24 days/year."

**Resolution Status**: ✅ **RESOLVED in v2.0**

**Code Implementation** (`lib/policy.ts` v2.0):

```typescript
EL_PER_YEAR: 24;  // ✅ Updated from 20 to 24
```

**Documentation Updated**:
- ✅ `01-Leave Types and Entitlements.md` - Updated to show 24 days/year
- ✅ `lib/policy.ts` - Updated EL_PER_YEAR: 24

**Final Status**: System now implements **24 days/year** (2 days/month × 12 months) per Policy 6.19 ✅

---

### 2. Earned Leave Advance Notice Requirement - **RESOLVED** ✅

**SourceOfTruth.md (6.11)**:

> "All non-sick leave → submit ≥ 5 working days ahead (Casual and Quarantine exempt)."

**Resolution Status**: ✅ **RESOLVED in v2.0**

**Code Implementation** (`lib/policy.ts` v2.0):

```typescript
elMinNoticeDays: 5;  // ✅ Updated from 15 to 5 working days
```

**Documentation Updated**:
- ✅ `01-Leave Types and Entitlements.md` - Updated to show 5 working days
- ✅ `02-Leave Application Rules and Validation.md` - Updated to show 5 working days
- ✅ `lib/policy.ts` - Updated elMinNoticeDays: 5
- ✅ Flow charts updated to show "≥5 Working Days Notice"

**Final Status**: System now enforces **≥5 working days** advance notice per Policy 6.11 ✅

---

## ✅ RESOLVED: Policy Clarifications (v2.0)

### 3. Casual Leave Approval Chain Exception - **RESOLVED** ✅

**SourceOfTruth.md (6.10)**:

> "Applications (except Casual Leave) sent through Dept Head → HRD → Management."

**Resolution Status**: ✅ **RESOLVED in v2.0**

**Code Implementation** (`lib/workflow.ts` v2.0):

```typescript
WORKFLOW_CHAINS: {
  DEFAULT: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  CASUAL: ["DEPT_HEAD"],  // ✅ Shortened chain per Policy 6.10
}
```

**Documentation Updated**:
- ✅ `06-Approval Workflow and Chain.md` - Added per-type chains with CASUAL exception
- ✅ `09-Role Based Behavior.md` - Clarified DEPT_HEAD is final approver for CASUAL
- ✅ `LeavePolicy_CDBL.md` - Added separate section for CASUAL chain
- ✅ Flow charts updated with separate DEFAULT and CASUAL chain diagrams

**Final Status**: CASUAL leave now uses **single-step chain: DEPT_HEAD** per Policy 6.10 exception ✅

---

### 4. Final Approver Roles - **CLARIFIED** ✅

**Issue**: Documentation was unclear about who is the final approver for each leave type

**Resolution Status**: ✅ **CLARIFIED in v2.0**

**Final Approvers**:
- **DEFAULT** (EL, ML, etc.): **CEO** is the sole final approver
- **CASUAL**: **DEPT_HEAD** is the sole final approver

**Intermediate Role Permissions**:
- HR_ADMIN: Can FORWARD or REJECT (operational role)
- DEPT_HEAD (DEFAULT): Can only FORWARD or RETURN
- HR_HEAD: Can only FORWARD or RETURN
- CEO (DEFAULT): Final approver - can APPROVE or REJECT

**Documentation Updated**:
- ✅ All approval workflow documentation clarified with final approver roles
- ✅ Flow charts updated with explicit final approver notes
- ✅ Code correctly implements per-type chain logic with `isFinalApprover()`

**Final Status**: All documentation and code now consistently reflect correct approval authority ✅

---

---

## ✅ Verified Consistent Rules (v2.0)

All the following rules have been verified to be consistent across HR Policy, documentation, and code:

### Earned Leave Carry-Forward
- **Source**: Max accumulation = 60 days ✅
- **System**: `carryForwardCap.EL: 60` ✅
- **Status**: Consistent

### Casual Leave Annual Cap
- **Source**: Max 10 days per calendar year ✅
- **System**: `CL_PER_YEAR: 10` ✅
- **Status**: Consistent

### Casual Leave Consecutive Limit
- **Source**: Max 3 days per instance ✅
- **System**: `clMaxConsecutiveDays: 3` ✅
- **Status**: Consistent

### Casual Leave Advance Notice
- **Source**: Exempt from advance notice requirement (Policy 6.11) ✅
- **System**: Soft warning only (advisory, not blocking) ✅
- **Status**: Consistent

### Medical Leave Annual Cap
- **Source**: 14 days per year (max) ✅
- **System**: `ML_PER_YEAR: 14` ✅
- **Status**: Consistent

### Medical Certificate Requirement
- **Source**: > 3 days → medical certificate required ✅
- **System**: `needsMedicalCertificate()` checks `days > 3` ✅
- **Status**: Consistent

### Casual Leave Holiday/Weekend Rule
- **Source**: CL cannot touch holidays/weekends (Policy 6.20e) ✅
- **System**: Hard block with `cl_cannot_touch_holiday` ✅
- **Status**: Consistent

---

## Summary (v2.0)

### Resolution Status

✅ **All Critical Issues RESOLVED**
- EL Annual Entitlement: Updated to 24 days/year
- EL Advance Notice: Updated to 5 working days
- CL Approval Chain: Implemented per-type chains with CASUAL exception
- Final Approver Roles: Clarified CEO for DEFAULT, DEPT_HEAD for CASUAL

### Documentation Updates

**Code Files Updated**:
- ✅ `lib/policy.ts` - Updated EL_PER_YEAR and elMinNoticeDays
- ✅ `lib/workflow.ts` - Already had per-type chain logic
- ✅ `lib/rbac.ts` - Already had proper role matrices

**Documentation Files Updated**:
- ✅ `docs/LeavePolicy_CDBL.md` - Added clear approval chain sections
- ✅ `docs/Policy Logic/01-Leave Types and Entitlements.md` - Marked as consistent
- ✅ `docs/Policy Logic/02-Leave Application Rules and Validation.md` - Already updated
- ✅ `docs/Policy Logic/06-Approval Workflow and Chain.md` - Clarified final approvers
- ✅ `docs/Policy Logic/09-Role Based Behavior.md` - Updated approval permissions
- ✅ `docs/technical-documentation/architecture/Flow-Charts.md` - Updated all diagrams

### Validation

All implementation now aligns with:
- ✅ HR Policy & Procedures Manual Chapter 06
- ✅ Policy 6.11 (Application timing - 5 working days)
- ✅ Policy 6.19 (EL accrual - 24 days/year)
- ✅ Policy 6.10 (CASUAL chain exception)
- ✅ Policy 6.20 (CL rules)
- ✅ Policy 6.21 (ML certificate requirement)

---

**Report Updated**: January 2025 (v2.0)
**Documents Checked**: All 12 Policy Logic documents + implementation code
**Source Document**: `SourceOfTruth.md` (HR Policy Manual Chapter 06)
**Status**: ✅ **All contradictions RESOLVED**
