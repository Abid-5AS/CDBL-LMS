# Leave Workflow (State Machine)

States:
- DRAFT -> PENDING -> { APPROVED | REJECTED }
- APPROVED -> (optional) RETURNED_TO_DUTY (with actualReturnDate/fitnessCert for ML)
- PENDING can be RETURNED (for changes) by approvers

Transitions (roles):
1) EMPLOYEE: create DRAFT; submit -> PENDING
2) HR_ADMIN: approve/reject/return
3) DEPT_HEAD: approve/reject/return (receives only after HR_ADMIN approves)
4) HR_SENIOR: approve/reject/return
5) CEO: approve/reject

Rules:
- Steps must be sequential. Skipping is blocked unless SYS_ADMIN uses override.
- Every action appends an entry to `approvals[]` and an `audit_logs` record.
- On final APPROVED: balance is decremented (EL/CL/ML) atomically.
- On REJECTED: nothing is decremented.
- On CANCEL (employee request before start): if previously approved, restore balance.

Edge cases:
- Overstay: if actualReturnDate > endDate -> mark `overstay=true`, create audit log, block new leave until HR marks regularized.
- Recall: create “recall” marker with date; endDate shifts; notify employee; balance adjusts.

Notifications (future):
- Email/Teams internal notice to next approver on transitions.

### Employee: Request Detail View
- Show timeline: Created -> Dept Head -> HR Admin -> HR Head -> CEO (if required).
- Fields: type (full name), dates, workingDays, reason, attachments, status, approvers, audit log.

### Employee: Cancel Request
- Preconditions: status == PENDING.
- Action: POST /api/leaves/:id/cancel -> status = CANCELLED, audit entry, notification to approver queue to drop item.
