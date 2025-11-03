# QA Testing Guide: Role-Aware Dock Verification

This guide provides instructions for completing the automated browser tests for the FloatingDock component.

## Prerequisites

1. **Dev Server Running:**

   ```bash
   npm run dev
   ```

   Server should be running on `http://localhost:3000`

2. **Test Credentials:**
   - EMPLOYEE: `employee1@demo.local` / `demo123`
   - DEPT_HEAD: `manager@demo.local` / `demo123`
   - HR_ADMIN: `hradmin@demo.local` / `demo123`
   - HR_HEAD: `hrhead@demo.local` / `demo123`
   - CEO: `ceo@demo.local` / `demo123`

## Test Matrix

### Routes to Test (8 total)

- `/dashboard`
- `/leaves`
- `/leaves/apply`
- `/approvals`
- `/employees`
- `/reports`
- `/policies`
- `/admin/audit`

### Roles to Test (5 total)

- EMPLOYEE
- DEPT_HEAD
- HR_ADMIN
- HR_HEAD
- CEO

**Total Combinations:** 5 × 8 = 40 tests

## Testing Procedure

### For Each Role:

1. **Login:**

   - Navigate to `http://localhost:3000/login`
   - Enter credentials for the role
   - Wait for dashboard to load

2. **For Each Route:**

   - Navigate to the route
   - Wait 2-3 seconds for page to fully load
   - Extract dock actions using browser console:
     ```javascript
     const dock = document.querySelector(
       '[role="navigation"][aria-label="Page actions"]'
     );
     const buttons = dock?.querySelectorAll("button[aria-label]");
     const actions = Array.from(buttons || [])
       .map((btn) => btn.getAttribute("aria-label") || "")
       .filter(Boolean);
     console.log(JSON.stringify(actions));
     ```
   - Take screenshot: Save to `qa/artifacts/screenshots/{role}-{route}.png`
   - Record result using `scripts/qa-browser-test.ts`:
     ```typescript
     addResult('ROLE', '/route', ['Action 1', 'Action 2', ...]);
     ```

3. **Logout (for role switching):**
   - Click Profile menu → Logout
   - Or navigate to `/api/logout`

## Expected Actions (from DOCK_MATRIX)

### EMPLOYEE

- DASHBOARD: `APPLY_LEAVE`, `MY_REQUESTS`, `VIEW_POLICY`
- LEAVES_LIST: `APPLY_LEAVE`, `DASHBOARD`, `VIEW_POLICY`
- LEAVES_APPLY: `MY_REQUESTS`, `DASHBOARD`
- Others: _none_ (dock should not appear)

### DEPT_HEAD

- DASHBOARD: `APPROVAL_QUEUE`, `MY_REQUESTS`, `VIEW_POLICY`
- LEAVES_LIST: `APPLY_LEAVE`, `APPROVAL_QUEUE`, `VIEW_POLICY`
- LEAVES_APPLY: `MY_REQUESTS`, `APPROVAL_QUEUE`
- APPROVALS: `APPROVAL_QUEUE`, `BULK_APPROVE`, `BULK_REJECT` (when hasSelection)

### HR_ADMIN

- DASHBOARD: `APPROVAL_QUEUE`, `EMPLOYEE_DIRECTORY`, `VIEW_POLICY`
- LEAVES_LIST: `REVIEW_REQUESTS`, `EXPORT_CSV`, `VIEW_POLICY`
- APPROVALS: `APPROVAL_QUEUE`, `BULK_APPROVE`, `BULK_REJECT`, `EXPORT_CSV`
- EMPLOYEES: `EMPLOYEE_DIRECTORY`, `APPROVAL_QUEUE`
- REPORTS: `EXPORT_CSV`

### HR_HEAD

- DASHBOARD: `REPORTS`, `APPROVAL_QUEUE`, `VIEW_POLICY`
- APPROVALS: `APPROVAL_QUEUE`, `BULK_APPROVE`, `BULK_REJECT`, `EXPORT_CSV`
- REPORTS: `EXPORT_CSV`
- LEAVES_LIST: `REVIEW_REQUESTS`, `EXPORT_CSV`

### CEO

- DASHBOARD: `REPORTS`, `AUDIT_LOGS`, `VIEW_POLICY`
- REPORTS: `EXPORT_CSV`
- AUDIT: `EXPORT_CSV`

## Action Label Mapping

The following UI labels map to canonical Action types:

| UI Label                       | Canonical Action   |
| ------------------------------ | ------------------ |
| Apply Leave                    | APPLY_LEAVE        |
| My Requests / Leave Requests   | MY_REQUESTS        |
| Dashboard / Go to Dashboard    | DASHBOARD          |
| Approval Queue / Team Requests | APPROVAL_QUEUE     |
| Review Requests                | REVIEW_REQUESTS    |
| Employee Directory / Employees | EMPLOYEE_DIRECTORY |
| Reports / Insights             | REPORTS            |
| Audit Logs                     | AUDIT_LOGS         |
| View Policy / Control Center   | VIEW_POLICY        |
| Export CSV                     | EXPORT_CSV         |
| Approve Selected               | BULK_APPROVE       |
| Reject Selected                | BULK_REJECT        |

## Validation Rules

1. **Banned Actions for EMPLOYEE:**

   - EMPLOYEE should NEVER see: `EXPORT_CSV`, `REPORTS`, `AUDIT_LOGS`, `BULK_APPROVE`, `BULK_REJECT`
   - If found, mark as CRITICAL mismatch

2. **Missing Dock:**

   - If dock doesn't appear, check:
     - User is logged in
     - Page is recognized in `routeToPage()`
     - No console errors

3. **Unknown Pages:**
   - If route isn't mapped in `routeToPage()`, it's an unknown page
   - Should be added to `lib/role-ui.ts`

## Generating Final Summary

After completing all tests:

```bash
# Run the summary generator
tsx scripts/qa-browser-test.ts
# Or manually call generateSummary() after all addResult() calls
```

This will update `qa/QA_AUTOMATED_SUMMARY.md` with complete results.

## Current Test Status

✅ **Completed:**

- EMPLOYEE → /dashboard
- EMPLOYEE → /leaves
- EMPLOYEE → /leaves/apply

❌ **Remaining:** 37 test combinations

## Notes

- Some pages may show contextual actions that differ from the canonical matrix (e.g., form pages)
- Screenshots are saved to `qa/artifacts/screenshots/`
- Test artifacts (JSON) are saved to `qa/artifacts/`
- Unit tests for role-ui.ts: ✅ All passing (34/34)
