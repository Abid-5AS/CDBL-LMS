# Leave Workflow (State Machine) - Updated Specification

## States

Complete state lifecycle:

```
DRAFT → SUBMITTED → PENDING → { APPROVED | REJECTED | CANCELLED }
```

### State Definitions

- **DRAFT**: Employee creates but hasn't submitted yet
- **SUBMITTED**: Employee submits (automatically goes to HR_ADMIN)
- **PENDING**: In approval process (forwarded between roles)
- **APPROVED**: Final approval granted
- **REJECTED**: Final rejection
- **CANCELLED**: Employee cancelled (before approval)

---

## Transitions by Role

### 1. EMPLOYEE

**Actions**:
- Create DRAFT leave request
- Submit DRAFT → SUBMITTED (then auto → PENDING)
- Cancel SUBMITTED/PENDING → CANCELLED

**Status Changes**:
- `DRAFT` → `SUBMITTED` (on submit)
- `SUBMITTED` → `PENDING` (automatic, goes to HR_ADMIN)
- `PENDING` → `CANCELLED` (on cancel)

---

### 2. HR_ADMIN (Step 1)

**Actions**:
- Forward to DEPT_HEAD
- Cannot approve or reject

**Status Changes**:
- `PENDING` → `PENDING` (forwarded, remains pending)

**Creates**: Approval record with `decision: FORWARDED`, `toRole: "DEPT_HEAD"`

---

### 3. DEPT_HEAD (Step 2)

**Actions**:
- Forward to HR_HEAD
- Cannot approve or reject

**Status Changes**:
- `PENDING` → `PENDING` (forwarded, remains pending)

**Creates**: Approval record with `decision: FORWARDED`, `toRole: "HR_HEAD"`

---

### 4. HR_HEAD (Step 3)

**Actions**:
- Approve → APPROVED
- Reject → REJECTED
- Forward to CEO (optional)

**Status Changes**:
- `PENDING` → `APPROVED` (on approve)
- `PENDING` → `REJECTED` (on reject)
- `PENDING` → `PENDING` (if forwarded to CEO)

**Creates**: Approval record with `decision: APPROVED` or `REJECTED` or `FORWARDED`

---

### 5. CEO (Step 4)

**Actions**:
- Approve → APPROVED
- Reject → REJECTED

**Status Changes**:
- `PENDING` → `APPROVED` (on approve)
- `PENDING` → `REJECTED` (on reject)

**Creates**: Approval record with `decision: APPROVED` or `REJECTED`

---

## Approval Chain

**Sequential Order**: HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO

**Steps**:
- Step 1: HR_ADMIN
- Step 2: DEPT_HEAD
- Step 3: HR_HEAD
- Step 4: CEO

**Rules**:
- Steps must be sequential (cannot skip)
- Step number stored in `Approval.step` field
- Each step creates an `Approval` record

**Location**: `lib/workflow.ts` - `APPROVAL_CHAIN` constant

---

## Rules

### Sequential Steps
- Steps must be incremental (1, 2, 3, 4)
- Skipping steps is blocked
- Each role can only forward to the next role in chain

### Audit Trail
- Every action appends an entry to `approvals[]`
- Every action creates an `AuditLog` record
- Approval records track full chain history

### Balance Impact
- **On APPROVED**: Balance should be decremented (EL/CL/ML)
  - **Status**: Logic not found in approval endpoint (gap)
  - **Expected**: Update `Balance.used += workingDays`
- **On REJECTED**: Nothing is decremented
- **On CANCELLED**: Balance should be restored if was approved
  - **Status**: Not implemented (gap)

### Self-Approval Prevention
- Users cannot approve their own requests
- Check: `leave.requesterId !== user.id`
- Error: `self_approval_disallowed`

---

## Edge Cases

### Overstay (Future)
- If `actualReturnDate > endDate`:
  - Mark `overstay=true`
  - Create audit log
  - Block new leave until HR marks regularized
- **Status**: Not implemented

### Recall (Future)
- Create "recall" marker with date
- `endDate` shifts to recall date
- Notify employee
- Balance adjusts
- **Status**: Not implemented

### Return to Duty (Future)
- ML requires fitness certificate to return (unless waived for ≤7 days total ML)
- **Status**: Not implemented

### Returned Status (Future)
- PENDING can be RETURNED (for changes) by approvers
- Employee edits and resubmits
- **Status**: Not implemented (status not in enum)

---

## Notifications (Future)

- Email/Teams internal notice to next approver on transitions
- **Status**: Not implemented

---

## Employee: Request Detail View

**Displays**:
- Leave type (full name)
- Dates (start, end)
- Working days
- Reason
- Attachments (certificate URL)
- Status
- Approval timeline
- Approver comments
- Audit log

**Timeline Example**:
```
Created → HR_ADMIN (forwarded) → DEPT_HEAD (forwarded) → HR_HEAD (approved)
```

---

## Employee: Cancel Request

**Preconditions**:
- `status == PENDING` or `status == SUBMITTED`

**Action**:
- `PATCH /api/leaves/:id` → `status = CANCELLED`

**Expected Behavior**:
- Update status to CANCELLED
- Create audit entry
- Restore balance if was approved (not implemented)
- Notification to approver queue to drop item (future)

**Current Implementation**:
- Updates status only
- Balance restoration missing

---

## Status Transition Matrix

| Current Status | Action | Next Status | Role Required |
|----------------|--------|-------------|---------------|
| DRAFT | Submit | SUBMITTED | EMPLOYEE |
| SUBMITTED | Auto | PENDING | System |
| PENDING | Forward | PENDING | HR_ADMIN, DEPT_HEAD |
| PENDING | Approve | APPROVED | HR_HEAD, CEO |
| PENDING | Reject | REJECTED | HR_HEAD, CEO |
| PENDING | Cancel | CANCELLED | EMPLOYEE |
| SUBMITTED | Cancel | CANCELLED | EMPLOYEE |

---

## Approval Record Structure

Each approval action creates:

```typescript
{
  leaveId: number,
  step: number,           // 1-4 (HR_ADMIN → CEO)
  approverId: number,
  decision: "APPROVED" | "REJECTED" | "FORWARDED" | "PENDING",
  toRole: string | null,  // Next role if FORWARDED
  comment: string | null,
  decidedAt: DateTime | null
}
```

---

## Workflow Functions

Located in `lib/workflow.ts`:

### `APPROVAL_CHAIN`
Array defining chain order: `["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]`

### `getNextRoleInChain(currentRole)`
Returns next role in chain, or `null` if current role is last

### `getStepForRole(role)`
Returns step number (1-4) for a role

### `canPerformAction(role, action)`
Checks if role can perform FORWARD, APPROVE, or REJECT

### `getStatusAfterAction(currentStatus, action)`
Returns new status after action:
- `APPROVE` → `APPROVED`
- `REJECT` → `REJECTED`
- `FORWARD` → `PENDING`

---

## Related Documentation

- **Approval Workflow Details**: [Policy Logic - Approval Workflow](./../Policy%20Logic/06-Approval-Workflow-and-Chain.md)
- **Workflow Functions**: `lib/workflow.ts`
- **Approval Model**: [Database Schema](./../03-Database-Schema.md)

---

**Document Version**: 1.0 (Updated)  
**Last Updated**: Current  
**Approval Steps**: 4 steps  
**Status Count**: 6 statuses

