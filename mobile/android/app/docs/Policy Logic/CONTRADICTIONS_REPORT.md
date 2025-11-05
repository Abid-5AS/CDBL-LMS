# Policy Logic Contradictions Report

**Source of Truth**: `SourceOfTruth.md` (HR Policy Manual, Chapter 06, pp. 32-41)  
**Date**: Current  
**Purpose**: Identify contradictions between Policy Logic documents and the official HR Policy source

---

## ❌ Critical Contradictions Found

### 1. Earned Leave Annual Entitlement

**SourceOfTruth.md (6.19)**:

> "Accrual: **2 working days per month** = 24 days/year."

**Policy Logic Documents Say**:

- `01-Leave Types and Entitlements.md`: "20 days/year (accrual: 2 days/month)"
- `04-Leave Balance and Accrual Logic.md`: "20 days/year (2 × 10 months, assuming 2 months off per year)"

**Code Implementation** (`lib/policy.ts`):

```typescript
EL_PER_YEAR: 20;
```

**Status**: ❌ **CONTRADICTION**

- **Source says**: 24 days/year
- **System implements**: 20 days/year
- **Note**: Source calculation: 2 days/month × 12 months = 24 days/year
- **System assumption**: 2 days/month × 10 working months = 20 days/year

**Action Required**: Clarify with HR whether:

- 24 days/year is correct (12 months accrual)
- 20 days/year is correct (10 months accrual accounting for leave)

---

### 2. Earned Leave Advance Notice Requirement

**SourceOfTruth.md (6.11)**:

> "All non-sick leave → submit ≥ 5 working days ahead (Casual and Quarantine exempt)."

**Policy Logic Documents Say**:

- `01-Leave Types and Entitlements.md`: "15 days minimum" (hard requirement)
- `02-Leave Application Rules and Validation.md`: "15 days before start date" (hard block)

**Code Implementation** (`lib/policy.ts`):

```typescript
elMinNoticeDays: 15; // hard requirement for EARNED leave
```

**Status**: ❌ **CONTRADICTION**

- **Source says**: ≥5 working days ahead (applies to all non-sick leave, so EL should be ≥5 days)
- **System enforces**: 15 days minimum (hard block)

**Action Required**: Clarify with HR whether:

- EL should follow the general ≥5 working days rule
- OR EL has a special 15-day requirement (not mentioned in source)
- If 15 days is correct, update SourceOfTruth.md to reflect this

---

## ⚠️ Potential Contradictions / Clarifications Needed

### 3. Casual Leave Approval Chain Exception

**SourceOfTruth.md (6.10)**:

> "Applications (except Casual Leave) sent through Dept Head → HRD → Management."

**Policy Logic Documents Say**:

- `06-Approval Workflow and Chain.md`: Shows standard 4-step chain (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO)
- No mention of CL bypassing the chain

**Code Implementation**:

- All leave types go through the same approval chain
- No special handling for CL

**Status**: ⚠️ **POTENTIAL CONTRADICTION**

- **Source says**: CL applications bypass normal chain (exception)
- **System implements**: CL goes through same chain as other leaves

**Action Required**: Verify if:

- CL should bypass HR and go directly to Management/CEO
- OR the source "except Casual Leave" refers to routing, not approval chain
- Current implementation treats all leaves the same

---

### 4. Casual Leave Advance Notice

**SourceOfTruth.md (6.11)**:

> "All non-sick leave → submit ≥ 5 working days ahead (Casual and Quarantine exempt)."

**Policy Logic Documents Say**:

- `02-Leave Application Rules and Validation.md`: "5 working days before start" (soft warning)
- CL is exempt from the 5-day rule per source

**Code Implementation**:

- Shows soft warning if < 5 working days
- Allows submission (soft rule)

**Status**: ✅ **CONSISTENT**

- Source says CL is exempt (no requirement)
- System shows soft warning but allows submission
- This is acceptable - warning is advisory, not a block

---

## ✅ Verified Consistent Rules

### Earned Leave Carry-Forward

- **Source**: Max accumulation = 60 days ✅
- **System**: `carryForwardCap.EL: 60` ✅

### Casual Leave Annual Cap

- **Source**: Max 10 days per calendar year ✅
- **System**: `CL_PER_YEAR: 10` ✅

### Casual Leave Consecutive Limit

- **Source**: Max 3 days per instance ✅
- **System**: `clMaxConsecutiveDays: 3` ✅

### Medical Leave Annual Cap

- **Source**: 14 days per year (max) ✅
- **System**: `ML_PER_YEAR: 14` ✅

### Medical Certificate Requirement

- **Source**: > 3 days → medical certificate required ✅
- **System**: `needsMedicalCertificate()` checks `days > 3` ✅

### Casual Leave Backdating

- **Source**: CL cannot touch holidays/weekends ✅
- **System**: Hard block with `cl_cannot_touch_holiday` ✅

---

## Summary

### Critical Issues

1. **EL Annual Entitlement**: Source says 24/year, system implements 20/year
2. **EL Advance Notice**: Source says ≥5 days, system enforces 15 days

### Clarification Needed

3. **CL Approval Chain**: Source suggests CL bypasses chain, system treats all leaves the same

### Recommended Actions

1. **Immediate**: Document these contradictions in Policy Logic documents
2. **Review**: Present contradictions to HR for clarification
3. **Update**: Once clarified, update either SourceOfTruth.md or system implementation
4. **Documentation**: Add notes in Policy Logic docs explaining the discrepancies

---

**Report Generated**: Current  
**Documents Checked**: All 12 Policy Logic documents  
**Source Document**: `SourceOfTruth.md`  
**Status**: 2 critical contradictions identified, 1 clarification needed
