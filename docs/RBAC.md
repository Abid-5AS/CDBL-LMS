# Roles & Permissions (RBAC)

EMPLOYEE
- Create/edit own leave (DRAFT/PENDING), upload attachments.
- View own balances/requests, cancel own PENDING requests.

DEPT_HEAD
- Approve/reject/return requests of department staff after HR step.
- View department requests & balances summary.

HR_ADMIN
- First-line validation & approval; see org-wide; edit balances (manual corrections).
- Bypass 5-day notice with reason (`overrideReason` stored).

HR_SENIOR
- Third approver; can approve exceptional QUAR up to 30 days; perform policy overrides.

CEO
- Final approver (default flow) or per-dept delegate if configured.

SYS_ADMIN
- Manage users/departments/roles; edit policy settings; force overrides; view audit logs.

- Employee: can CREATE leave, VIEW own, CANCEL own (PENDING only).
- Approver roles unchanged.
