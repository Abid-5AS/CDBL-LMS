# Remaining Policy Compliance Items

This document outlines the remaining policy items from CDBL Leave Policy Chapter 06 that are either **out of scope** for the Leave Management System or require **additional systems integration**.

**Last Updated:** 2025-11-13

---

## Out of Scope Items (Require Other Systems)

These items are explicitly **outside the scope** of the Leave Management System and should be handled by dedicated HR/Payroll/Attendance systems:

### 1. **Study Leave Loan Repayment Check** (Issue #15 - MAJOR)
**Policy Reference:** 6.25.c

**Policy States:**
> "An employee shall repay any and all advance/loan due to CDBL along with the interest accrued thereon before proceeding on any study leave, unless decided otherwise by the Management."

**Status:** ❌ **Not Implemented**

**Reason:** Requires integration with **Loan/Advance Management System**

**Recommendation:**
- Implement loan tracking system or integrate with existing HR financial system
- Add loan clearance validation for study leave applications
- Provide management override option
- **Priority:** Medium (study leave is rare, loan integration complex)

---

### 2. **EL Exit Payment Calculation** (Issue #19 - MAJOR)
**Policy Reference:** 6.29

**Policy States:**
> "If the services of an employee... is dispensed with... CDBL shall pay his/her salary in lieu of the unused earned leave."

**Status:** ❌ **Not Implemented**

**Reason:** Requires comprehensive **Employee Exit/Offboarding Workflow** and **Payroll Integration**

**Recommendation:**
- Create employee exit workflow with exit clearance process
- Calculate unused EL balance on exit date
- Calculate payment: `unusedEL × dailySalary` (per Policy 6.4: Gross Salary / 22)
- Generate exit clearance report with EL payment amount
- Integrate with payroll system for payment processing
- **Priority:** High (affects employee settlements)

**Suggested Implementation:**
- New endpoint: `POST /api/employee/exit`
- New UI: `/app/employee/exit/[id]/page.tsx`
- Exit clearance report generation
- Payroll system integration

---

### 3. **Casual Leave 5-Day Balance Retention** (Issue #17 - MAJOR)
**Policy Reference:** Mentioned in code tooltips, NOT in official policy

**Policy States:** ❌ **Not found in Policy 6.20**

**Code States:**
- `app/leaves/apply/_components/leave-constants.ts` mentions "Must retain 5 days balance"
- **Not enforced** in validation logic

**Status:** ⚠️ **Needs Policy Clarification**

**Recommendation:**
1. **Confirm with HR/Management:** Is 5-day CL retention an actual company policy?
2. **If YES:** Add to official policy document and implement validation
3. **If NO:** Remove from code tooltips entirely

**Action Required:** Stakeholder clarification needed

---

### 4. **Working Hours Tracking** (Issue #21 - MINOR)
**Policy Reference:** 6.1

**Policy States:**
> "Office hours... is from 9am – 5pm, Sunday through Thursday, with an hour for lunch and prayer, from 1 to 2pm."

**Status:** ❌ **Not Implemented**

**Reason:** Requires **Attendance/Time Tracking System**

**Recommendation:**
- Out of scope for Leave Management System
- Should be handled by biometric attendance system (mentioned in Policy 6.2)
- Consider integration if attendance affects leave calculations

**Priority:** Low (not directly related to leave management)

---

### 5. **Overtime Calculation** (Issue #22 - MINOR)
**Policy Reference:** 6.4

**Policy States:**
> "Overtime Payment = (Hourly pay rate × 2)"
> "One Day Salary = Gross Salary / 22 (days)"

**Status:** ❌ **Not Implemented**

**Reason:** Requires **Payroll System Integration**

**Recommendation:**
- Out of scope for Leave Management System
- Should be handled by attendance/payroll system
- Leave system does not track working hours or overtime

**Priority:** Low (payroll function, not leave management)

---

### 6. **On-Call Duties Allowance** (Issue #23 - MINOR)
**Policy Reference:** 6.5

**Policy States:**
> "Executive Cadre – BDT 1,500"
> "General Service Staff – BDT 700"

**Status:** ❌ **Not Implemented**

**Reason:** Requires **Attendance/Payroll System Integration**

**Recommendation:**
- Out of scope for Leave Management System
- Should be handled by payroll system
- No connection to leave management

**Priority:** Low (payroll function)

---

### 7. **Absenteeism Guidelines Enforcement** (Issue #24 - MINOR)
**Policy Reference:** 6.6

**Policy States:**
> Defines excessive absenteeism thresholds and tardiness patterns

**Status:** ❌ **Not Implemented**

**Reason:** Requires **Attendance Management System** and **Disciplinary Workflow**

**Recommendation:**
- Out of scope for Leave Management System
- Should be handled by attendance tracking system
- Requires HR disciplinary action workflow
- Consider integration if absenteeism affects leave eligibility

**Priority:** Low (HR/attendance function)

---

### 8. **Leave Recall Travel Allowance** (Issue #25 - MINOR)
**Policy Reference:** 6.9

**Policy States:**
> "An employee on leave may be recalled... shall be entitled to traveling allowance for the journey..."

**Status:** ⚠️ **Partially Implemented**

**Current Implementation:**
- ✅ `POST /api/leaves/[id]/recall` endpoint exists
- ✅ Recall functionality works
- ❌ No travel allowance tracking
- ❌ No payroll integration for travel payment

**Reason:** Requires **Payroll System Integration**

**Recommendation:**
- Add optional `travelAllowance` field to recall action
- Add `travelDistance` and `travelMode` fields for documentation
- Integrate with payroll for travel allowance payment
- **Priority:** Low (recall is rare, travel allowance is manual process)

---

## ✅ Fully Implemented Items

### Critical Issues - ALL RESOLVED:
1. ✅ **Maternity Duration** - Fixed to 8 weeks (56 days)
2. ✅ **Paternity Duration** - Fixed to 6 days
3. ✅ **Special Leave for EL >60 days** - Auto-transfer implemented
4. ✅ **EL Encashment** - Full feature with approval workflow
5. ✅ **CL Combination Validation** - Cannot be adjacent to other leaves
6. ✅ **ML >14 Days Advisory** - Soft warning implemented
7. ✅ **Service Eligibility** - Enforced per Policy 6.18
8. ✅ **Maternity Pro-rating** - For employees <6 months service

### Major Issues - 9 of 12 RESOLVED:
9. ✅ **Paternity Occasion/Interval** - 2 occasions, 36-month gap
10. ✅ **Study Leave Duration** - Max 2 years (1 year + 1 year extension)
11. ✅ **Quarantine Duration** - Max 30 days validated
12. ✅ **Special Disability Duration** - Max 180 days (6 months)
13. ✅ **Extraordinary Duration** - Service-based limits
14. ✅ **Study Leave Retirement** - 5-year buffer enforced
15. ❌ **Study Leave Loan Repayment** - Requires loan system
16. ✅ **Fitness Certificate** - Required for ML >7 days on duty return
17. ⚠️ **CL 5-Day Retention** - Needs policy clarification
18. ✅ **Leave Lapse Logic** - Annual reset for CL, ML, QUARANTINE
19. ❌ **EL Exit Payment** - Requires comprehensive exit workflow
20. ✅ **CL Notice Period** - Correctly exempt from notice requirement

---

## Implementation Priority

### High Priority (Business Critical)
1. **EL Exit Payment** - Affects employee settlements and legal compliance

### Medium Priority (Process Improvement)
2. **Study Leave Loan Repayment** - Important for study leave governance
3. **CL 5-Day Retention Clarification** - Resolve policy ambiguity

### Low Priority (Nice to Have)
4. Leave Recall Travel Allowance
5. Working Hours Tracking (if attendance integration needed)

### Out of Scope (External Systems)
- Overtime Calculation (Payroll)
- On-Call Allowance (Payroll)
- Absenteeism Guidelines (Attendance/HR)

---

## Recommendations

### For LMS Development Team:
1. **Focus on EL exit payment feature** - This has legal/compliance implications
2. **Clarify CL 5-day retention policy** with HR before implementing
3. **Document integration points** for future loan system integration
4. **Maintain current scope** - Don't expand into attendance/payroll functions

### For HR/Management:
1. **Clarify CL 5-day retention policy** - Is this an actual rule or legacy code?
2. **Plan loan system integration** if study leave with loans is common
3. **Consider dedicated exit workflow** for employee offboarding
4. **Evaluate need for attendance system integration** with LMS

### For Future Integration:
- **Loan System API** - For study leave loan clearance checks
- **Payroll API** - For exit EL payment and travel allowances
- **Attendance API** - For absenteeism tracking and working hours

---

## Conclusion

The CDBL Leave Management System has achieved **comprehensive policy compliance** for all core leave management functions:

- ✅ **8 of 8 Critical issues** resolved (100%)
- ✅ **9 of 12 Major issues** resolved (75%)
- ⚠️ **3 Major issues** require external systems or policy clarification

The remaining items are either:
1. **Out of scope** (payroll, attendance, HR functions)
2. **Require integration** with systems not yet available
3. **Need policy clarification** from management

**The LMS is production-ready** for its core leave management functions while maintaining clear documentation of future enhancement opportunities.
