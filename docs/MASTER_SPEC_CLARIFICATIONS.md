# Master Specification Clarifications

**Date**: 2025-11-14
**Status**: FINAL & AUTHORITATIVE
**Source**: User-provided answers aligned with CDBL Leave Policy

---

## Purpose

This document contains the final, authoritative answers to 4 critical questions that were blocking implementation of the Master Specification. All answers are directly aligned with CDBL policy, the hybrid enforcement model, and realistic HR workflow.

---

## Q1: Approval Workflow Chain - Is Employee Explicit or Implicit?

### Question
Master spec says: `Employee → HR/Admin → Dept Head → HR Head → CEO`
Current code has: `["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]`

Is "Employee" an explicit step in the chain or implicit?

### ✅ FINAL ANSWER: Employee is IMPLICIT, NOT in the approval chain

**Meaning**:
- Employee submits leave (initiator, not approver)
- First actual approver = HR/Admin
- Employee is NOT an approval "stage"

**Final Chain** (correct):
```
Employee (submits) → HR/Admin → Dept Head → HR Head → CEO (approves)
```

**Why?**
- Employee is the initiator, not an approval stage
- All approval chains start AFTER submission
- Matches CDBL workflow

**Implementation**:
```typescript
["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"] // ✅ CORRECT - Keep as is
```

**Status**: ✅ Current implementation is CORRECT - No changes needed

---

## Q2: CL (Casual Leave) Approval Workflow

### Question
Current code: `CASUAL: ["DEPT_HEAD"]` (only Dept Head)
Code comment: "Provisional: CL uses shorter chain per Policy 6.10"

Should CL use:
- A) Only Dept Head
- B) HR_ADMIN → Dept Head
- C) Full chain (same as all other leaves)

### ✅ FINAL ANSWER: B/C) CL uses FULL CHAIN (same as all other leaves)

**Final Workflow for CL**:
```
Employee → HR_ADMIN → Dept Head → HR Head → CEO
```

**Why?**
1. **Policy 6.10(d)** states: "Every application for leave (except casual leave) ... shall be sent to management", but this refers to FORM and ADVANCE NOTICE, NOT workflow reduction
2. **No policy page** says CL has shorter approval workflow
3. **Consistency**: All leaves must follow full chain for audit compliance
4. **Only CEO approves** - matches user's stated requirement

**Implementation**:
```typescript
// ❌ WRONG (current):
CASUAL: ["DEPT_HEAD"]

// ✅ CORRECT (must change to):
CASUAL: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]
```

**Status**: ❌ Current implementation is INCORRECT - Must fix

**Action Required**:
- Update `lib/workflow.ts` line 12
- Change `CASUAL: ["DEPT_HEAD"]` to `CASUAL: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]`
- Remove "Provisional" comment

---

## Q3: CL "Cannot Touch Holidays" Rule

### Question
Current code has `violatesCasualLeaveSideTouch()` which blocks CL if day before/after is holiday.

Master spec says: "Cannot touch holidays"

Does "cannot touch holidays" mean:
- A) CL dates cannot include holidays
- B) CL cannot be adjacent to holidays
- C) Both
- D) Something else

### ✅ FINAL ANSWER: C) BOTH A AND B

**CL is the strictest leave type. Both rules apply.**

**Policy Source**: Policy 6.20(e)
> "Casual leave cannot be combined with any other leave or preceded or succeeded by any holidays."

Also: CL is for "very short period for sudden matters"

**Final Rules for CL**:
- ✅ CL dates CANNOT be holidays/weekends
- ✅ CL CANNOT start the day after a holiday
- ✅ CL CANNOT end the day before a holiday
- ✅ CL CANNOT contain a holiday in the middle
- ✅ CL CANNOT touch ANY holiday or weekend on either side
- ✅ **CL must be PURE WORKING DAYS ONLY**

**Implementation**:

Current function `violatesCasualLeaveSideTouch()` handles rule B ✅ (adjacency) - KEEP IT

**But ALSO need to enforce rule A** ❌ (no holidays within CL dates)

**Combined Logic Required**:
1. Check if ANY day in CL range is a holiday/weekend → REJECT
2. Check if day before start OR day after end is holiday/weekend → REJECT
3. CL must be strictly isolated working days

**Status**: ⚠️ Current implementation is PARTIAL
- ✅ Rule B (adjacency) implemented via `violatesCasualLeaveSideTouch()`
- ❌ Rule A (no holidays within dates) NOT implemented

**Action Required**:
- Add new validation: `clDatesContainHolidays()` or enhance existing function
- Check EVERY day in CL range is a working day
- Integrate into CL validation chain

---

## Q4: Fitness Certificate for ML >7 Days

### Question
Schema has `fitnessCertificateUrl` field.
Master spec mentions: Fitness certificate required after ML >7 days.

Should fitness certificate be:
- A) Required at application time
- B) Required on return (after leave ends)
- C) Optional

### ✅ FINAL ANSWER: B) Required on RETURN (after leave ends)

**Policy Source**: Policy 6.14(c, d)
> "An employee on medical leave shall not return to duty without first producing a certificate of fitness..."
>
> "Requirement of such fitness certificate may be waived only if ML ≤ 7 days."

**LMS Behavior**:

| ML Duration | Medical Certificate (at application) | Fitness Certificate (on return) |
|-------------|-------------------------------------|--------------------------------|
| ≤ 3 days    | Not required                        | Not required                   |
| 4-7 days    | **Required**                        | Not required                   |
| > 7 days    | **Required**                        | **Required**                   |

**Why fitness certificate is on return, not at application?**
- Fitness certificate is a **return-to-duty document**
- Comes from doctor confirming you are **fit to rejoin work**
- You CANNOT be "fit" at the START of medical leave (you're sick!)
- Certificate proves you've **recovered**

**Final Implementation**:

**During Application**:
- ML ≤ 3 days → No certificates required
- ML > 3 days → Medical certificate required (`certificateUrl`)

**After ML Ends**:
- ML ≤ 7 days → No fitness certificate required
- ML > 7 days → Fitness certificate required (`fitnessCertificateUrl`)
  - Show "Upload Fitness Certificate" prompt
  - Prevent marking leave as "completed" until uploaded
  - HR/Admin + CEO confirm return

**Status**: ⚠️ Current implementation is UNCLEAR
- ✅ Schema field exists (`fitnessCertificateUrl`)
- ❌ On-return upload flow NOT FOUND
- ❌ Leave completion blocking NOT FOUND

**Action Required**:
1. Create "Return from Leave" flow for ML >7 days
2. Add fitness certificate upload requirement
3. Block leave completion until certificate uploaded
4. Add HR/Admin review step for fitness certificate
5. Update leave status lifecycle to include "PENDING_FITNESS_CERTIFICATE" or similar

---

## Summary of Required Changes

### Immediate Fixes (Must Do)

| # | Issue | Current Status | Action Required | Priority |
|---|-------|---------------|-----------------|----------|
| 1 | **CL Workflow** | ❌ Only DEPT_HEAD | Change to full chain | P0 |
| 2 | **CL Holiday Rule A** | ❌ Not implemented | Add validation for holidays within CL dates | P0 |
| 3 | **Fitness Certificate Flow** | ❌ Not implemented | Create on-return upload flow | P1 |

### Confirmed Correct (No Changes)

| # | Item | Status |
|---|------|--------|
| 1 | Employee implicit in chain | ✅ Correct |
| 2 | CL adjacency rule (side-touch) | ✅ Correct |
| 3 | Medical certificate at application (ML >3 days) | ✅ Correct |

---

## Implementation Checklist

### Phase 1: Immediate Fixes

- [ ] **Fix CL Workflow** (lib/workflow.ts)
  - [ ] Change `CASUAL: ["DEPT_HEAD"]` to `CASUAL: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]`
  - [ ] Remove "Provisional" comment
  - [ ] Update tests

- [ ] **Enhance CL Holiday Validation** (lib/leave-validation.ts)
  - [ ] Create `clDatesContainHolidays()` function
  - [ ] Check EVERY day in CL range is working day
  - [ ] Integrate into `validateCasualLeave()`
  - [ ] Update error messages
  - [ ] Add tests

### Phase 2: Fitness Certificate Flow

- [ ] **Database/Schema** (if needed)
  - [ ] Verify `fitnessCertificateUrl` field exists ✅
  - [ ] Add `fitnessCertificateRequired: boolean` flag (optional)
  - [ ] Add `fitnessCertificateUploadedAt` timestamp (optional)

- [ ] **Backend Logic**
  - [ ] Create `requiresFitnessCertificate(leave)` helper
  - [ ] Add leave status: `PENDING_FITNESS_CERTIFICATE` (or use existing)
  - [ ] Create API endpoint: `POST /api/leaves/[id]/fitness-certificate`
  - [ ] Block leave completion if fitness certificate missing

- [ ] **Frontend**
  - [ ] Add "Upload Fitness Certificate" UI (after ML >7 days ends)
  - [ ] Show prompt to employee on return
  - [ ] Display status in employee dashboard
  - [ ] HR/Admin review interface

- [ ] **Notifications**
  - [ ] Send email when ML >7 days ends (remind employee)
  - [ ] Send notification when fitness certificate uploaded (HR review)
  - [ ] Send notification when HR confirms fitness

---

## Policy References

**Q1**: General workflow understanding from Policy 6.10
**Q2**: Policy 6.10(d), Policy 6.20 (CL characteristics)
**Q3**: Policy 6.20(e) - "cannot be preceded or succeeded by any holidays"
**Q4**: Policy 6.14(c, d) - Fitness certificate requirement

---

## Approval

**Clarified By**: User (CDBL Policy Authority)
**Date**: 2025-11-14
**Status**: ✅ FINAL & AUTHORITATIVE

All implementation must follow these clarifications exactly. No deviations allowed.

---

**End of Document**
