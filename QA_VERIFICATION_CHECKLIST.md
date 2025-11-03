# QA Verification Checklist: Role-Aware Dock System

**Objective**: Manually verify that dock actions match canonical matrix and Policy v2.0 requirements across all Role × Page combinations.

**Environment**: Staging  
**Test Method**: Manual visual inspection + dev console verification  
**Duration**: ~30 minutes

---

## Quick Setup Instructions

### Enable Dev Mode Validation

Ensure you're in development mode to see validation logs:

```bash
npm run dev
```

### Watch for Console Messages

Keep browser dev tools console open to catch:
- `[Dock] Unclassified route` warnings
- `[Dock Assertion Failed]` errors
- Any other validation messages

### Test Accounts Needed

Create/use test users for each role:
- **EMPLOYEE**: employee@test.com
- **DEPT_HEAD**: depthead@test.com
- **HR_ADMIN**: hradmin@test.com
- **HR_HEAD**: hrhead@test.com
- **CEO**: ceo@test.com

---

## Master Test Matrix

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Expected (pass if visible) |
| ❌ | Expected (pass if not visible) |
| 🔍 | Check console for warning |
| ⚠️ | Should see dev warning |

---

## 1. EMPLOYEE Tests

### EMPLOYEE @ DASHBOARD (`/dashboard`)

**Expected Dock Actions**:
- ✅ "Apply Leave" → `/leaves/apply`
- ✅ "Leave Requests" → `/leaves`
- ✅ Control Center toggle
- ❌ Export CSV
- ❌ Reports
- ❌ Bulk Approve
- ❌ Audit Logs

**Verification**:
- [ ] All expected actions visible
- [ ] No admin actions visible
- [ ] Icons render correctly
- [ ] Hover effects work
- [ ] Clicking navigates correctly

---

### EMPLOYEE @ LEAVES_LIST (`/leaves`)

**Expected Dock Actions** (No Selection):
- ✅ "Apply Leave" → `/leaves/apply`
- ✅ "My Requests" → `/leaves`
- ✅ "Dashboard" → `/dashboard`
- ❌ Export CSV
- ❌ Bulk Approve

**Expected Dock Actions** (With Selection):
- ✅ "Cancel Selected (N)" → Bulk cancel
- ❌ "Approve Selected"
- ❌ "Reject Selected"

**Verification**:
- [ ] No selection: navigation actions only
- [ ] With selection: cancel button appears
- [ ] No admin bulk actions ever
- [ ] Badge shows correct count

---

### EMPLOYEE @ LEAVES_APPLY (`/leaves/apply`)

**Expected Dock Actions**:
- ✅ "Cancel Application" → Back/Close
- ✅ "View Leave Requests" → `/leaves`
- ✅ "Go to Dashboard" → `/dashboard`
- ❌ Export CSV
- ❌ Reports
- ❌ Apply Leave (would be redundant)

**Verification**:
- [ ] Only navigation helpers visible
- [ ] Form submit/cancel handled by form buttons
- [ ] No admin actions

---

### EMPLOYEE @ Other Pages

**POLICIES** (`/policies`):
- [ ] Dock renders (if implemented)
- [ ] Or: No dock shown

**REPORTS** (`/reports`):
- [ ] ⚠️ Should NOT render dock (no mapping)
- [ ] 🔍 Console shows: "Unclassified route" warning

**EMPLOYEES** (`/employees`):
- [ ] ⚠️ Should NOT render dock (no mapping)
- [ ] 🔍 Console warning

**AUDIT** (`/audit`):
- [ ] ⚠️ Should NOT render dock (no mapping)
- [ ] 🔍 Console warning

---

## 2. DEPT_HEAD Tests

### DEPT_HEAD @ DASHBOARD (`/dashboard`)

**Expected Dock Actions**:
- ✅ "Team Requests" → `/approvals`
- ✅ "Team Calendar" → `/holidays` (or requests if missing)
- ❌ Export CSV
- ❌ Audit Logs

**Verification**:
- [ ] Team-focused actions visible
- [ ] Can see approval queue access

---

### DEPT_HEAD @ LEAVES_LIST (`/leaves`)

**Expected Dock Actions**:
- ✅ "Apply Leave" → `/leaves/apply`
- ✅ "Approval Queue" → `/approvals`
- ❌ Bulk approve/reject (no selection)

**Expected Dock Actions** (With Selection):
- ✅ "Approve Selected (N)"
- ✅ "Return for Modification (N)"
- ❌ Export CSV

**Verification**:
- [ ] Can apply own leave
- [ ] Can approve team requests
- [ ] Selection shows bulk actions
- [ ] No export option

---

### DEPT_HEAD @ LEAVES_APPLY (`/leaves/apply`)

**Expected Dock Actions**:
- ✅ "My Requests" → `/leaves`
- ✅ "Approval Queue" → `/approvals`
- ❌ Export CSV

---

### DEPT_HEAD @ APPROVALS (`/approvals`)

**Expected Dock Actions** (No Selection):
- ✅ "Approval Queue" → `/approvals`
- ❌ Bulk actions
- ❌ Export CSV

**Expected Dock Actions** (With Selection):
- ✅ "Approve Selected (N)"
- ✅ "Return for Modification (N)"
- ✅ "Reject Selected (N)" (if implemented)
- ❌ Export CSV

**Verification**:
- [ ] Bulk actions only with selection
- [ ] Badge shows count
- [ ] Actions execute correctly
- [ ] Toast messages work

---

## 3. HR_ADMIN Tests

### HR_ADMIN @ DASHBOARD (`/dashboard`)

**Expected Dock Actions**:
- ✅ "Approvals" → `/approvals`
- ✅ "Employees" → `/employees`
- ✅ "Audit Logs" → `/admin/audit` (or `/audit`)
- ❌ Apply Leave (would be for own use, not shown)

**Verification**:
- [ ] Admin-focused dashboard
- [ ] Can navigate to all sections

---

### HR_ADMIN @ LEAVES_LIST (`/leaves`)

**Expected Dock Actions**:
- ✅ "Review Requests" → `/approvals`
- ✅ "Export CSV"
- ✅ "View Policy" (if implemented)
- ❌ Apply Leave (if not own leaves)

**Verification**:
- [ ] Export button functional
- [ ] CSV download works
- [ ] No bulk actions without selection

---

### HR_ADMIN @ APPROVALS (`/approvals`)

**Expected Dock Actions** (No Selection):
- ✅ "Approval Queue" → `/approvals`
- ✅ "Export CSV"
- ❌ Bulk actions

**Expected Dock Actions** (With Selection):
- ✅ "Approve Selected (N)"
- ✅ "Return for Modification (N)"
- ✅ "Export CSV"
- ✅ "Reject Selected (N)" (if implemented)

**Verification**:
- [ ] Export always available
- [ ] Bulk actions with selection
- [ ] All actions execute correctly
- [ ] Toast messages appropriate

---

### HR_ADMIN @ EMPLOYEES (`/employees`)

**Expected Dock Actions**:
- ✅ "Employee Directory" → `/employees`
- ✅ "Approval Queue" → `/approvals`
- ❌ Export CSV (if no table data)

**Verification**:
- [ ] Can manage employees
- [ ] Quick nav to approvals

---

### HR_ADMIN @ REPORTS (`/reports`)

**Expected Dock Actions**:
- ✅ "Export CSV"
- ❌ Bulk actions
- ❌ Add Employee

**Verification**:
- [ ] CSV export works
- [ ] No irrelevant actions

---

## 4. HR_HEAD Tests

### HR_HEAD @ DASHBOARD (`/dashboard`)

**Expected Dock Actions**:
- ✅ "Reports" → `/reports`
- ✅ "Approval Queue" → `/approvals`
- ✅ "Audit Logs" → `/audit`
- ❌ Apply Leave

**Verification**:
- [ ] Executive-focused dashboard
- [ ] Access to all sections

---

### HR_HEAD @ APPROVALS (`/approvals`)

**Expected Dock Actions** (No Selection):
- ✅ "Approval Queue" → `/approvals`
- ✅ "Export CSV"
- ❌ Bulk actions

**Expected Dock Actions** (With Selection):
- ✅ "Approve Selected (N)"
- ✅ "Export CSV"
- ✅ "Return for Modification (N)"
- ✅ "Reject Selected (N)"

**Verification**:
- [ ] Final approver actions
- [ ] Export always available
- [ ] All bulk actions work

---

### HR_HEAD @ REPORTS (`/reports`)

**Expected Dock Actions**:
- ✅ "Export CSV"
- ❌ Bulk actions
- ❌ Add Employee

---

### HR_HEAD @ LEAVES_LIST (`/leaves`)

**Expected Dock Actions**:
- ✅ "Review Requests" → `/approvals`
- ✅ "Export CSV"
- ✅ "View Policy" (if implemented)

---

## 5. CEO Tests

### CEO @ DASHBOARD (`/dashboard`)

**Expected Dock Actions**:
- ✅ "Reports" → `/reports`
- ✅ "Audit Logs" → `/audit`
- ❌ Apply Leave
- ❌ Approval Queue (should be reports-focused)

**Verification**:
- [ ] Executive view
- [ ] Strategic insights access

---

### CEO @ REPORTS (`/reports`)

**Expected Dock Actions**:
- ✅ "Export CSV"
- ❌ Bulk actions
- ❌ Add Employee

**Verification**:
- [ ] CSV export works
- [ ] Clean, executive-focused UI

---

### CEO @ AUDIT (`/audit`)

**Expected Dock Actions**:
- ✅ "Export CSV" (if tabular data)
- ❌ Bulk actions
- ❌ Add Employee

**Verification**:
- [ ] Can export audit logs
- [ ] System health visible

---

## 6. Edge Case Tests

### Unknown Routes

**Test Routes**:
- `/unknown-page`
- `/random/path`
- `/new-feature/not-mapped`

**Expected Behavior**:
- [ ] No dock rendered
- [ ] 🔍 Console shows: `[Dock] Unclassified route; please add to routeToPage(): /unknown-page`
- [ ] Page still renders normally
- [ ] No errors thrown

---

### Multiple Roles (Future Enhancement)

**Note**: If user can have multiple roles, test highest authority resolution:
- [ ] CEO + EMPLOYEE → Uses CEO role
- [ ] HR_HEAD + DEPT_HEAD → Uses HR_HEAD role
- [ ] Correct dock actions shown

---

### Empty/Zero States

**Test Scenarios**:
- [ ] 0 leaves in list
- [ ] 0 pending approvals
- [ ] Empty employee list
- [ ] No reports generated

**Expected**:
- [ ] Dock still renders appropriate actions
- [ ] No errors on empty states
- [ ] Bulk actions hidden when no data

---

## 7. Context Pruning Tests

### CSV Export Pruning

**Test**: Pages without tabular data

**Expected**:
- [ ] `DASHBOARD` → No EXPORT_CSV
- [ ] `LEAVES_APPLY` → No EXPORT_CSV
- [ ] `APPROVALS` (with data) → EXPORT_CSV visible
- [ ] `LEAVES_LIST` (HR role, with data) → EXPORT_CSV visible

---

### Bulk Actions Pruning

**Test**: Pages with/without selection

**Expected**:
- [ ] `APPROVALS` (no selection) → No bulk actions
- [ ] `APPROVALS` (1 selected) → Bulk actions visible
- [ ] Badge shows correct count
- [ ] `LEAVES_LIST` (EMPLOYEE, selection) → Cancel only

---

## 8. Dev Console Verification

### Normal Operation

**For each Role × Page combination**:
- [ ] No errors in console
- [ ] No warnings (except intentionally unclassified routes)
- [ ] No "Dock Assertion Failed" messages

---

### Validation Triggers

**If testing deliberately wrong configuration**:
1. Temporarily change DOCK_MATRIX to include EXPORT_CSV for EMPLOYEE
2. Reload page
3. Expected: `[Dock Assertion Failed]` error logged
4. UI still renders (non-blocking)

---

## 9. Visual/UX Tests

### Dock Appearance

**For all rendered docks**:
- [ ] Bottom-center position
- [ ] Proper z-index (appears above content)
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Icon + text visible
- [ ] Hover effects smooth
- [ ] Active state highlights correctly
- [ ] Badges positioned correctly

---

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader announcements correct
- [ ] Color contrast adequate

---

## 10. Integration Tests

### With Selection Context

**Verify**:
- [ ] Selection count propagates correctly
- [ ] Bulk actions appear/disappear based on selection
- [ ] Badge updates dynamically
- [ ] Selection cleared after action

---

### With Navigation

**Verify**:
- [ ] Routes navigate correctly
- [ ] Back/forward buttons work
- [ ] URL updates properly
- [ ] Page state persists

---

### With Toast Notifications

**Verify**:
- [ ] Success toasts after actions
- [ ] Error toasts on failures
- [ ] Toast messages policy-compliant
- [ ] Toasts don't overlap with dock

---

## Quick Reference Matrix

```
Page          | EMPLOYEE      | DEPT_HEAD        | HR_ADMIN         | HR_HEAD          | CEO
--------------|---------------|------------------|------------------|------------------|------------------
DASHBOARD     | Apply, My     | Queue, Calendar  | Approvals,       | Reports, Queue   | Reports, Audit
              |               |                  |  Employees,      |                  |
              |               |                  |  Audit           |                  |
LEAVES_LIST   | Apply, My     | Apply, Queue     | Review, Export   | Review, Export   | N/A
LEAVES_APPLY  | My, Dashboard | My, Queue        | My, Dashboard    | My, Dashboard    | N/A
APPROVALS     | N/A           | Queue, Bulk*     | Queue, Bulk*,    | Queue, Bulk*,    | N/A
              |               |                  |  Export*         |  Export*         |
EMPLOYEES     | N/A           | N/A              | Directory, Queue | Directory, Queue | N/A
REPORTS       | N/A           | N/A              | Export           | Export           | Export
POLICIES      | View?         | View?            | View?            | View?            | View?
AUDIT         | N/A           | N/A              | N/A              | N/A              | Export?

* = Only with selection
? = Not confirmed in matrix
```

---

## Sign-Off

### Pre-Merge Checklist

- [ ] All EMPLOYEE tests pass
- [ ] All DEPT_HEAD tests pass
- [ ] All HR_ADMIN tests pass
- [ ] All HR_HEAD tests pass
- [ ] All CEO tests pass
- [ ] Edge cases verified
- [ ] Dev console clean
- [ ] Visual/UX acceptable
- [ ] Accessibility verified
- [ ] Integration tests pass

### Tester Sign-Off

**Tester Name**: ___________________  
**Date**: ___________________  
**Environment**: Staging  
**Browser**: Chrome / Safari / Firefox  
**Version**: ___________________  

**Overall Status**: ⬜ Pass  ⬜ Fail  ⬜ Conditional Pass

**Notes**:
```
[Space for any issues or observations]
```

---

## Known Limitations

1. **No Icon Mapping**: Action strings need to map to icons (future enhancement)
2. **No Dev Overlay**: Visual debug tool not yet implemented
3. **Conservative CSV**: Assumes tabular data present in validation
4. **POLICIES Page**: Mapping exists but not fully implemented
5. **AUDIT Page**: CEO mapping exists but may need adjustment

---

## Reporting Issues

If you find inconsistencies between expected and actual dock actions:

1. **Capture**:
   - Screenshot of dock
   - Console logs
   - Role and page URL
   - Expected vs actual actions

2. **Reference**:
   - `lib/role-ui.ts` → DOCK_MATRIX
   - `FINAL_IMPLEMENTATION_REPORT.md` → Expected behavior

3. **Report**:
   - Create GitHub issue
   - Tag as `role-ui` or `dock-validation`
   - Include captured evidence

---

**Last Updated**: After role-ui.ts implementation  
**Version**: 2.0  
**Maintainer**: CDBL Dev Team
