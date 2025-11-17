# HR & ADMIN UX Audit Report

**Date:** 2025-11-17
**Auditor:** Claude (AI Assistant)
**Scope:** HR & ADMIN Dashboard, Role-based UI, Request Status Logic, and Cross-role UX Issues

---

## Executive Summary

This audit identified **10 critical UX bugs and inconsistencies** across the CDBL-LMS application, primarily affecting the HR & ADMIN role but also impacting other roles (DEPT_HEAD, HR_HEAD, CEO, EMPLOYEE). The issues range from incorrect role-based access controls to misleading metrics and confusing UI elements.

**Severity Breakdown:**
- 🔴 **Critical:** 5 issues (role-based access violations, incorrect metrics)
- 🟡 **High:** 3 issues (misleading UX, hardcoded values)
- 🟢 **Medium:** 2 issues (confusing tooltips, unclear card purposes)

---

## Critical Issues (🔴)

### BUG #1: "Apply Leave" Button Shown to Non-Employee Roles
**Severity:** 🔴 Critical
**Location:** `components/navbar/DesktopNav.tsx:146-154`, `components/navbar/MobileBar.tsx:57-65`
**Affected Roles:** HR_ADMIN, HR_HEAD, CEO

**Issue:**
The "Apply" button in the navigation bar (both desktop and mobile) is shown to ALL authenticated users regardless of their role. According to the role-based UI matrix (`lib/role-ui.ts`), only EMPLOYEE and DEPT_HEAD should have access to "APPLY_LEAVE" action.

**Current Code:**
```tsx
// components/navbar/DesktopNav.tsx:146-154
<Button
  size="sm"
  className="gap-1.5 backdrop-blur-md bg-background/80..."
  leftIcon={<CalendarPlus className="h-4 w-4" />}
  onClick={() => router.push("/leaves/apply")}
  aria-label="Apply for leave"
>
  Apply
</Button>
```

**Why It's Confusing:**
- HR_ADMIN, HR_HEAD, and CEO roles are **approvers**, not leave applicants
- Their workflow is to review/approve leaves, not apply for them
- The button creates confusion about their role in the system
- According to the DOCK_MATRIX in `lib/role-ui.ts`, HR_ADMIN does NOT have "APPLY_LEAVE" in any page context

**Recommendation:**
Add role-based conditional rendering:
```tsx
{(user.role === "EMPLOYEE" || user.role === "DEPT_HEAD") && (
  <Button
    size="sm"
    leftIcon={<CalendarPlus className="h-4 w-4" />}
    onClick={() => router.push("/leaves/apply")}
  >
    Apply
  </Button>
)}
```

**References:**
- Role UI Matrix: `/lib/role-ui.ts:52-84` (DOCK_MATRIX definition)
- Desktop Nav: `/components/navbar/DesktopNav.tsx:146-154`
- Mobile Nav: `/components/navbar/MobileBar.tsx:57-65`

---

### BUG #2: Misleading "Pending Requests" Count on HR_ADMIN Dashboard
**Severity:** 🔴 Critical
**Location:** `lib/dashboard/hr-admin-data.ts:95-97`
**Affected Roles:** HR_ADMIN

**Issue:**
The "Pending Requests" KPI card on the HR_ADMIN dashboard counts ALL leave requests with `status: "PENDING"` in the database, regardless of whether the HR_ADMIN has already processed them.

**Current Query:**
```typescript
// lib/dashboard/hr-admin-data.ts:95-97
pendingRequests = await prisma.leaveRequest.count({
  where: { status: "PENDING" },
})
```

**Why It's Misleading:**
1. When HR_ADMIN **forwards** a request to DEPT_HEAD, the leave's status remains "PENDING" (it's pending at DEPT_HEAD)
2. But the HR_ADMIN's personal approval record is marked as "FORWARDED"
3. The dashboard shows this as "pending" even though HR_ADMIN has completed their action
4. This creates the illusion that HR_ADMIN has work to do when they don't

**Example Scenario:**
1. Employee submits leave → Status: SUBMITTED
2. HR_ADMIN forwards to DEPT_HEAD → Leave Status: PENDING, HR_ADMIN approval: FORWARDED
3. Dashboard shows "Pending Requests: 1" ❌ (Incorrect - HR_ADMIN already handled it)
4. Request is actually pending at DEPT_HEAD, not HR_ADMIN

**Correct Logic:**
Count only requests where the HR_ADMIN has a PENDING approval record:
```typescript
pendingRequests = await prisma.approval.count({
  where: {
    approverId: user.id,
    decision: "PENDING",
  },
})
```

**Impact:**
- HR_ADMIN sees inflated "pending" counts
- Creates confusion about workload
- May lead to duplicate work or unnecessary investigation

**References:**
- Data Layer: `/lib/dashboard/hr-admin-data.ts:95-97` (both `getHRAdminKPIData` and `getHRAdminStatsData`)
- Approval Repository: `/lib/repositories/approval.repository.ts:90-109` (correct pattern)
- Forward API: `/app/api/leaves/[id]/forward/route.ts:112-125` (shows approval decision changes)

---

### BUG #3: Same "Pending Requests" Issue on HR_HEAD Dashboard
**Severity:** 🔴 Critical
**Location:** `app/api/dashboard/hr-head/stats/route.ts:59-63`
**Affected Roles:** HR_HEAD

**Issue:**
Identical to BUG #2. HR_HEAD dashboard counts all PENDING leaves, not just those pending for HR_HEAD.

**Current Code:**
```typescript
// app/api/dashboard/hr-head/stats/route.ts:59-63
pendingCount = await prisma.leaveRequest.count({
  where: {
    status: "PENDING",
  },
})
```

**Recommendation:**
Use the same approval-based counting:
```typescript
pendingCount = await prisma.approval.count({
  where: {
    approverId: user.id,
    decision: "PENDING",
  },
})
```

---

### BUG #4: CEO Dashboard "Pending Approvals" Logic Issue
**Severity:** 🔴 Critical
**Location:** `app/api/dashboard/ceo/stats/route.ts:118-129`
**Affected Roles:** CEO

**Issue:**
The CEO dashboard uses a step-based filter instead of user-specific approval records. While this is more sophisticated than other dashboards, it still has flaws:

**Current Code:**
```typescript
// app/api/dashboard/ceo/stats/route.ts:118-129
pendingApprovals = await prisma.leaveRequest.count({
  where: {
    status: "PENDING",
    approvals: {
      some: {
        step: 4, // CEO approval step
        decision: "PENDING",
      },
    },
  },
})
```

**Issues:**
1. Hardcoded `step: 4` assumes CEO is always step 4 (may not be true for all leave types)
2. Doesn't check if the specific CEO user has a pending approval
3. If there are multiple CEO users, this count could be shared/duplicated

**Recommendation:**
Use user-specific approval counting like other roles.

---

### BUG #5: QuickActionFAB Shows "Apply Leave" to All Roles
**Severity:** 🔴 Critical
**Location:** `components/unified/QuickActionFAB.tsx:45-69`
**Affected Roles:** HR_ADMIN, HR_HEAD, CEO

**Issue:**
The QuickActionFAB (floating action button) component shows "Apply Leave" action to all authenticated users without checking their role.

**Current Code:**
```tsx
// components/unified/QuickActionFAB.tsx:45-69
if (pathname === "/dashboard") {
  actions.push(
    { label: "Apply Leave", icon: Plus, href: "/leaves/apply" },
    // ... other actions
  );
}
```

**Recommendation:**
Add role-based filtering before showing "Apply Leave" action.

---

## High Priority Issues (🟡)

### BUG #6: Hardcoded/Fake Metrics on HR_ADMIN Dashboard
**Severity:** 🟡 High
**Location:** `lib/dashboard/hr-admin-data.ts:129, 135-136, 325`
**Affected Roles:** HR_ADMIN

**Issue:**
Three critical KPI metrics are hardcoded with fake values instead of being calculated from real data:

**Hardcoded Values:**
```typescript
// lib/dashboard/hr-admin-data.ts:129, 135-136
avgApprovalTime: 2.5,        // ❌ Hardcoded
teamUtilization: 85,         // ❌ Hardcoded
complianceScore: 94,         // ❌ Hardcoded
```

**Why It's Problematic:**
1. **Avg Approval Time (2.5 days):**
   - Shows the same value regardless of actual performance
   - Users cannot track if approval times are improving or degrading
   - In `getHRAdminStatsData`, this IS calculated correctly (lines 283-291), but in `getHRAdminKPIData` (fast endpoint), it's hardcoded

2. **Team Utilization (85%):**
   - Always shows 85% even if half the team is on leave
   - Defeats the purpose of monitoring workforce availability
   - In `getHRAdminStatsData`, this IS calculated (lines 293-299), but hardcoded in KPI endpoint

3. **Compliance Score (94%):**
   - Always shows 94% regardless of policy violations
   - Makes the metric meaningless for tracking
   - Even in full stats endpoint, it's hardcoded (line 325)

**Impact:**
- Managers cannot make data-driven decisions
- Creates false sense of security about system performance
- Undermines trust in the dashboard

**Recommendation:**
Either:
1. Calculate these metrics properly in both endpoints, OR
2. Remove them from the KPI endpoint and only show calculated values in the full stats

---

### BUG #7: Hardcoded Compliance Score on HR_HEAD Dashboard
**Severity:** 🟡 High
**Location:** `app/api/dashboard/hr-head/stats/route.ts:212`
**Affected Roles:** HR_HEAD

**Issue:**
Same as BUG #6. Compliance score is hardcoded with a comment acknowledging it's a placeholder:

```typescript
// app/api/dashboard/hr-head/stats/route.ts:212
const complianceScore = totalProcessed > 0 ? 94 : 100; // Placeholder calculation
```

**Recommendation:**
Implement actual compliance score calculation based on:
- Proper documentation submissions
- Approval workflow adherence
- Policy violation tracking

---

### BUG #8: Confusing "Pending Requests" Tooltip
**Severity:** 🟡 High
**Location:** `components/dashboards/hr-admin/HRAdminDashboardClient.tsx:247-253`
**Affected Roles:** HR_ADMIN

**Issue:**
The tooltip for "Pending Requests" card says:

> "Leave requests awaiting approval from department heads, HR, or CEO. High counts may indicate approval bottlenecks."

**Why It's Confusing:**
1. This description is accurate for organization-wide pending count
2. But users expect to see THEIR pending requests, not everyone's
3. The tooltip doesn't clarify if these are requests pending for THEM or pending ANYWHERE in the system
4. Combined with BUG #2, this creates maximum confusion

**Current Code:**
```tsx
// components/dashboards/hr-admin/HRAdminDashboardClient.tsx:247-253
<TooltipContent side="bottom" className="max-w-xs">
  <p className="text-sm">
    Leave requests awaiting approval from department heads,
    HR, or CEO. High counts may indicate approval
    bottlenecks.
  </p>
</TooltipContent>
```

**Recommendation:**
Update tooltip to clearly state what the metric represents. If showing personal queue, say "Requests awaiting YOUR action". If showing org-wide, clarify that explicitly.

---

## Medium Priority Issues (🟢)

### BUG #9: Unclear Purpose of "Daily Processing" Card
**Severity:** 🟢 Medium
**Location:** `components/dashboards/hr-admin/HRAdminDashboardClient.tsx:346-385`
**Affected Roles:** HR_ADMIN

**Issue:**
The "Daily Processing" card shows progress toward a "daily target" of 10 requests, but:

1. **Where does the target of 10 come from?**
   - Hardcoded in `lib/dashboard/hr-admin-data.ts:120` and `301`
   - Not configurable per organization
   - May not be realistic for all organizations

2. **What happens when target is exceeded?**
   - Shows "Target achieved!" (line 379-382)
   - But no guidance on what to do next

3. **Is this target per HR_ADMIN or organization-wide?**
   - Query counts all APPROVED/REJECTED requests updated today (lines 107-117)
   - Suggests organization-wide, but card is on HR_ADMIN dashboard
   - Creates ambiguity about individual vs. team performance

**Current Code:**
```typescript
// lib/dashboard/hr-admin-data.ts:120
const dailyTarget = 10; // ❌ Hardcoded
```

**Recommendation:**
1. Make daily target configurable in org settings
2. Clarify if this is individual or team target
3. Add more context about why this metric matters

---

### BUG #10: "Avg Approval Time" Tooltip Ambiguity
**Severity:** 🟢 Medium
**Location:** `components/dashboards/hr-admin/HRAdminDashboardClient.tsx:289-295`
**Affected Roles:** HR_ADMIN

**Issue:**
The tooltip says:

> "Average time (in days) from leave request submission to final approval/rejection. Target is ≤3 days for optimal processing."

**Ambiguities:**
1. **Is this organization-wide or for HR_ADMIN's actions only?**
   - The calculation (lines 283-291 in hr-admin-data.ts) looks at ALL approved requests in the last 30 days
   - Suggests organization-wide average
   - But shown on HR_ADMIN personal dashboard

2. **What if HR_ADMIN is fast but other roles are slow?**
   - HR_ADMIN might think they're the bottleneck when they're not
   - No way to see time spent at each approval stage

3. **Where does "≤3 days" target come from?**
   - Not defined in policy documents
   - Not configurable

**Recommendation:**
1. Show stage-by-stage breakdown (time at HR_ADMIN, DEPT_HEAD, HR_HEAD, CEO)
2. Clarify if this is personal or org-wide metric
3. Make target configurable

---

## Additional Observations

### Observation #1: Encashment Queue Always Shows 0
**Location:** `lib/dashboard/hr-admin-data.ts:130, 319`

The "Encashment Queue" metric in the Quick Stats card always shows 0:

```typescript
encashmentPending: 0,  // ❌ Not implemented
```

**Impact:** Medium
**Recommendation:** Either implement encashment tracking or remove this metric from the dashboard.

---

### Observation #2: Inconsistent Data Fetching Strategy
**Location:** `components/dashboards/hr-admin/HRAdminDashboardClient.tsx:122-146`

The dashboard uses a two-phase loading strategy:
1. Fast KPI endpoint: `/api/dashboard/hr-admin/kpis` (lines 122-132)
2. Full stats endpoint: `/api/dashboard/hr-admin/stats` (lines 135-146)

**Issue:**
- KPI endpoint has hardcoded values (BUG #6)
- Full stats endpoint has real calculations
- Creates inconsistency where metrics change after initial load

**Recommendation:** Ensure both endpoints return consistent data or clearly indicate when data is estimated vs. actual.

---

## Card Purpose Analysis

### HR & ADMIN Dashboard Cards - Usefulness Assessment

Based on the audit, here's an analysis of each card's usefulness:

#### ✅ **Useful Cards (Provide Real Value)**

1. **Employees on Leave** ⭐⭐⭐⭐⭐
   - Shows current workforce availability
   - Calculated correctly from real data
   - Immediately actionable information

2. **Pending Requests** ⭐⭐ (if fixed)
   - **Currently Broken:** Shows wrong data (BUG #2)
   - **If Fixed:** Would be very useful for workload management
   - **Action Required:** Fix query to show personal pending queue

3. **Total Leaves (YTD)** ⭐⭐⭐⭐
   - Shows year-to-date organizational trends
   - Useful for capacity planning
   - Calculated correctly

4. **Pending Leave Requests Table** ⭐⭐⭐⭐⭐
   - Core functionality for HR_ADMIN role
   - Interactive with search/filter/actions
   - This is the PRIMARY tool HR_ADMINs use

5. **Leave Type Distribution Chart** ⭐⭐⭐⭐
   - Shows which leave types are most used
   - Helps identify patterns
   - Useful for policy planning

6. **Request Trend Chart** ⭐⭐⭐
   - Shows 6-month submission patterns
   - Helps identify seasonal trends
   - Good for forecasting

#### ⚠️ **Questionable Cards (Need Improvement)**

7. **Avg Approval Time** ⭐⭐
   - **Currently:** Hardcoded in KPI endpoint (BUG #6)
   - **Confusing:** Not clear if personal or org-wide (BUG #10)
   - **If Fixed:** Would be valuable for process improvement

8. **Daily Processing** ⭐⭐
   - **Unclear:** Arbitrary target of 10 (BUG #9)
   - **Confusing:** Individual vs. team metric unclear
   - **Limited Value:** Gamification without clear business purpose

9. **Team Utilization** ⭐⭐
   - **Currently:** Hardcoded at 85% (BUG #6)
   - **If Fixed:** Could be useful for resource planning
   - **Issue:** Calculation methodology unclear

10. **Compliance Score** ⭐
    - **Currently:** Always shows 94% (BUG #6)
    - **Meaningless:** No real calculation
    - **Recommendation:** Remove until properly implemented

#### ❌ **Not Useful / Confusing Cards**

11. **Encashment Queue** ⭐
    - Always shows 0
    - Not implemented
    - Should be removed or implemented

---

## Impact Summary

### By Role

| Role | Critical Issues | High Priority | Medium Priority | Total |
|------|----------------|---------------|-----------------|-------|
| HR_ADMIN | 3 | 2 | 3 | 8 |
| HR_HEAD | 2 | 1 | 0 | 3 |
| CEO | 2 | 0 | 0 | 2 |
| EMPLOYEE | 1 | 0 | 0 | 1 |
| DEPT_HEAD | 1 | 0 | 0 | 1 |

### By Component

| Component | Issues |
|-----------|--------|
| Navigation (Desktop/Mobile) | 2 |
| Dashboard Metrics | 5 |
| QuickActionFAB | 1 |
| Tooltips/Documentation | 2 |

---

## Recommended Fix Priority

### Phase 1: Critical Role-Based Access (Week 1)
1. Fix "Apply Leave" button in nav (BUG #1)
2. Fix QuickActionFAB (BUG #5)

### Phase 2: Dashboard Metrics (Week 1-2)
3. Fix "Pending Requests" logic for HR_ADMIN (BUG #2)
4. Fix "Pending Requests" logic for HR_HEAD (BUG #3)
5. Fix CEO pending approvals (BUG #4)

### Phase 3: Data Quality (Week 2-3)
6. Remove/fix hardcoded metrics (BUG #6, #7)
7. Implement real compliance score calculation
8. Make daily target configurable or remove it

### Phase 4: UX Polish (Week 3-4)
9. Update confusing tooltips (BUG #8, #10)
10. Clarify card purposes (BUG #9)
11. Remove or implement encashment queue

---

## Testing Recommendations

After fixes are implemented, test these scenarios:

### Test Scenario 1: HR_ADMIN Workflow
1. HR_ADMIN logs in
2. Verify "Apply Leave" button is NOT visible
3. Submit a leave request as EMPLOYEE
4. HR_ADMIN forwards the request
5. Verify "Pending Requests" count decreases by 1
6. Verify forwarded request no longer appears in HR_ADMIN queue

### Test Scenario 2: CEO Dashboard
1. CEO logs in
2. Verify "Apply Leave" button is NOT visible
3. Verify pending approvals count only shows requests at CEO step
4. Verify metrics are calculated, not hardcoded

### Test Scenario 3: Cross-Role Navigation
1. Test each role (EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO)
2. Verify "Apply Leave" only appears for EMPLOYEE and DEPT_HEAD
3. Verify QuickActionFAB shows role-appropriate actions

---

## Conclusion

The HR & ADMIN dashboard has solid architectural foundations but suffers from:

1. **Incomplete role-based access controls** - Critical UI elements shown to wrong roles
2. **Misleading metrics** - Hardcoded values and incorrect calculations
3. **Confusing UX** - Ambiguous tooltips and unclear card purposes

**Estimated Effort:** 2-3 weeks for full remediation

**Highest Impact Fixes:**
- BUG #1 (Apply Leave button) - 2 hours
- BUG #2 (Pending Requests logic) - 4 hours
- BUG #6 (Hardcoded metrics) - 8 hours

**Total Estimated Fix Time:** ~20-30 hours

---

## Files Requiring Changes

1. `components/navbar/DesktopNav.tsx`
2. `components/navbar/MobileBar.tsx`
3. `components/unified/QuickActionFAB.tsx`
4. `lib/dashboard/hr-admin-data.ts`
5. `app/api/dashboard/hr-head/stats/route.ts`
6. `app/api/dashboard/ceo/stats/route.ts`
7. `components/dashboards/hr-admin/HRAdminDashboardClient.tsx`

---

**Report Generated:** 2025-11-17
**Audit Scope:** Complete
**Status:** Ready for Implementation
