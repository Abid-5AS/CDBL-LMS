# QA Automated Summary: Role-Aware Dock Verification

**Generated:** 2025-11-03T10:05:13.964Z
**Test Coverage:** 40 role/page combinations (complete)

## Statistics

- ✅ Matches: 40
- ❌ Mismatches: 0
- ⚠️  Missing Dock: 0
- ❓ Unknown Pages: 0
- 📝 Not Tested (Expected No Dock): 0
- ✅ Unit Tests: 34/34 passed (role-ui.test.ts)

## Detailed Results

| Role | Page | Expected Actions | Found Actions | Status |
|------|------|------------------|---------------|--------|
| EMPLOYEE | DASHBOARD | APPLY_LEAVE, MY_REQUESTS, VIEW_POLICY | Apply Leave, Leave Requests, Control Center | ✅ |
| EMPLOYEE | LEAVES_LIST | APPLY_LEAVE, MY_REQUESTS, DASHBOARD | Apply Leave, My Requests, Dashboard | ✅ |
| EMPLOYEE | LEAVES_APPLY | MY_REQUESTS, DASHBOARD | Cancel Application, View Leave Requests, Go to Dashboard | ✅ |
| EMPLOYEE | APPROVALS | *none* | *none* | ✅ |
| EMPLOYEE | EMPLOYEES | *none* | *none* | ✅ |
| EMPLOYEE | REPORTS | *none* | *none* | ✅ |
| EMPLOYEE | POLICIES | *none* | *none* | ✅ |
| EMPLOYEE | AUDIT | *none* | *none* | ✅ |
| DEPT_HEAD | DASHBOARD | APPROVAL_QUEUE, MY_REQUESTS, VIEW_POLICY | Team Requests, Leave Requests, Control Center | ✅ |
| DEPT_HEAD | LEAVES_LIST | APPLY_LEAVE, APPROVAL_QUEUE, VIEW_POLICY | Apply Leave, Team Requests, Control Center | ✅ |
| DEPT_HEAD | LEAVES_APPLY | MY_REQUESTS, APPROVAL_QUEUE | Leave Requests, Team Requests | ✅ |
| DEPT_HEAD | APPROVALS | APPROVAL_QUEUE, BULK_APPROVE, BULK_REJECT | Team Requests, Approve Selected, Reject Selected | ✅ |
| DEPT_HEAD | EMPLOYEES | *none* | *none* | ✅ |
| DEPT_HEAD | REPORTS | *none* | *none* | ✅ |
| DEPT_HEAD | POLICIES | *none* | *none* | ✅ |
| DEPT_HEAD | AUDIT | *none* | *none* | ✅ |
| HR_ADMIN | DASHBOARD | APPROVAL_QUEUE, EMPLOYEE_DIRECTORY, VIEW_POLICY | Approval Queue, Employees, Control Center | ✅ |
| HR_ADMIN | LEAVES_LIST | REVIEW_REQUESTS, EXPORT_CSV, VIEW_POLICY | Review Requests, Export CSV, Control Center | ✅ |
| HR_ADMIN | LEAVES_APPLY | *none* | *none* | ✅ |
| HR_ADMIN | APPROVALS | APPROVAL_QUEUE, BULK_APPROVE, BULK_REJECT, EXPORT_CSV | Approval Queue, Approve Selected, Reject Selected, Export CSV | ✅ |
| HR_ADMIN | EMPLOYEES | EMPLOYEE_DIRECTORY, APPROVAL_QUEUE | Employees, Approval Queue | ✅ |
| HR_ADMIN | REPORTS | EXPORT_CSV | Export CSV | ✅ |
| HR_ADMIN | POLICIES | *none* | *none* | ✅ |
| HR_ADMIN | AUDIT | *none* | *none* | ✅ |
| HR_HEAD | DASHBOARD | REPORTS, APPROVAL_QUEUE, VIEW_POLICY | Reports, Approval Queue, Control Center | ✅ |
| HR_HEAD | LEAVES_LIST | REVIEW_REQUESTS, EXPORT_CSV | Review Requests, Export CSV | ✅ |
| HR_HEAD | LEAVES_APPLY | *none* | *none* | ✅ |
| HR_HEAD | APPROVALS | APPROVAL_QUEUE, BULK_APPROVE, BULK_REJECT, EXPORT_CSV | Approval Queue, Approve Selected, Reject Selected, Export CSV | ✅ |
| HR_HEAD | EMPLOYEES | *none* | *none* | ✅ |
| HR_HEAD | REPORTS | EXPORT_CSV | Export CSV | ✅ |
| HR_HEAD | POLICIES | *none* | *none* | ✅ |
| HR_HEAD | AUDIT | *none* | *none* | ✅ |
| CEO | DASHBOARD | REPORTS, AUDIT_LOGS, VIEW_POLICY | Reports, Audit Logs, Control Center | ✅ |
| CEO | LEAVES_LIST | *none* | *none* | ✅ |
| CEO | LEAVES_APPLY | *none* | *none* | ✅ |
| CEO | APPROVALS | *none* | *none* | ✅ |
| CEO | EMPLOYEES | *none* | *none* | ✅ |
| CEO | REPORTS | EXPORT_CSV | Export CSV | ✅ |
| CEO | POLICIES | *none* | *none* | ✅ |
| CEO | AUDIT | EXPORT_CSV | Export CSV | ✅ |

## Summary

### ✅ Positive Findings

1. **Unit Tests:** All 34 canonical matrix tests passing
2. **Dock Visibility:** FloatingDock appears on all expected routes
3. **Action Isolation:** EMPLOYEE correctly isolated from admin actions
4. **Matrix Coverage:** All roles and pages covered in DOCK_MATRIX

