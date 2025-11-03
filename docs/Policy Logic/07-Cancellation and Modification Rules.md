# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks**
> 
> **Phase 5 (Policy v2.0 - Cancellation / Recall / Return Endpoints):**
> 1) **Employee cancellation:** Updated `PATCH /api/leaves/[id]` - SUBMITTED/PENDING → CANCELLED, APPROVED → CANCELLATION_REQUESTED.
> 2) **Admin cancellation:** Created `POST /api/leaves/[id]/cancel` - HR roles can cancel APPROVED or approve CANCELLATION_REQUESTED with balance restoration.
> 3) **Balance restoration:** Implemented balance restoration on admin cancellation - decrements `Balance.used` and updates `Balance.closing`.
> 4) **Return for modification endpoint:** Created `POST /api/leaves/[id]/return-for-modification` - approvers can return SUBMITTED/PENDING requests for modification (sets RETURNED status).
> 5) **Recall endpoint:** Created `POST /api/leaves/[id]/recall` - HR roles can recall employees from APPROVED leave, restores remaining balance.
> 6) **Balance on approval:** Updated approve endpoint to increment balance when leave is approved.
> 7) **Audit logging:** All cancellation, return, and recall actions create audit log entries.
> 
> **Previous Tasks:**
> 8) **Partial cancellation support:** Future enhancement - allow employee to request partial cancellation.
> 9) **UI flow updates:** Confirmation modal for cancel, success toast, audit display in leave history.

---

## 1. Cancellation Rules

### Who Can Cancel
- **Employee**: Can cancel their own leave requests
- **Authorization Check**: `leave.requesterId === me.id`
- **Location**: `app/api/leaves/[id]/route.ts` line 14

### When Can Cancel
- **Valid Status**: `SUBMITTED` or `PENDING`
- **Invalid Status**: `APPROVED`, `REJECTED`, `CANCELLED`, `DRAFT`
- **Enforcement**: Hard block
- **Error Code**: `cannot_cancel_now`
- **Location**: `app/api/leaves/[id]/route.ts` lines 18-20

### Cancellation Endpoint
- **Method**: `PATCH /api/leaves/[id]`
- **Action**: Updates `status` to `CANCELLED`
- **Location**: `app/api/leaves/[id]/route.ts` lines 5-28

### Cancellation Logic
```typescript
if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
  return NextResponse.json({ error: "cannot_cancel_now" }, { status: 400 });
}

const updated = await prisma.leaveRequest.update({
  where: { id },
  data: { status: "CANCELLED" },
});
```

---

## 2. Balance Restoration (On Cancellation)

### Policy Expectation
- **Rule**: If employee cancels a previously approved request, balance should be restored
- **Current Implementation**: **NOT IMPLEMENTED**

### What Should Happen
1. Check if leave was `APPROVED` before cancellation
2. Restore balance: `Balance.used -= workingDays`
3. Update `Balance.closing` field
4. Create audit log entry

### Proposed Implementation

```typescript
if (leave.status === "APPROVED" && action === "CANCEL") {
  await prisma.balance.update({
    where: { userId_type_year: { userId: leave.requesterId, type: leave.type, year: currentYear } },
    data: {
      used: { decrement: leave.workingDays },
      closing: { decrement: leave.workingDays },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "LEAVE_CANCELLED",
      targetEmail: leave.requester.email,
      details: { leaveId: leave.id, previousStatus: leave.status, cancelledAt: new Date() },
    },
  });
}
```

### Current Gap
- **Status**: Balance restoration logic is **missing**
- **Location**: `app/api/leaves/[id]/route.ts` (only updates status)
- **Note**: This is a known gap in implementation

---

## 3. HR/Admin Override

### Policy & Implementation
- **Authorized Roles:** HR_ADMIN, HR_HEAD, CEO
- **Action:** Can cancel any leave request regardless of requester
- **Endpoint:** `POST /api/leaves/[id]/cancel/admin`
- **Validation:**
  - Checks `canApprove(role)` or `role in ["HR_ADMIN","HR_HEAD","CEO"]`
  - Records audit log with `actorEmail` and `targetEmail`
  - Triggers balance restoration if applicable

---

## 4. Modification Rules

### Current Implementation
- **Status**: **NOT IMPLEMENTED**
- **Policy**: Employees should be able to modify pending requests

### Expected Behavior
- **Valid Status**: `DRAFT` or `PENDING`
- **Allowed Changes**: Dates, reason, certificate
- **Restrictions**: 
  - Cannot change leave type
  - Must re-validate all rules (balance, caps, etc.)

### Alternative Approach
- **Current Workflow**: Cancel and create new request
- **Reason**: Simpler implementation, avoids complex state management

---

## 5. Approval Modification

### Returned Status (Future)
- **Policy**: Approvers should be able to "return" requests for changes
- **Status**: `RETURNED` (not in current enum)
- **Workflow**: `PENDING → RETURNED → PENDING` (after employee edits)

### Current Implementation
- **Status**: Not implemented
- **Note**: `Workflow_Spec.md` mentions "RETURNED" status but not in codebase

> **Engineering Note:** Introduce a `returnForModification()` function allowing approvers to set `status: RETURNED` and attach a reason. Employee can edit and resubmit.

---

## 6. Cancellation After Approval

### Policy
- **Rule**: Once approved, employee cannot directly cancel; must submit partial or full **cancellation request** which HR/Admin reviews.

### Admin Intervention
- **Process**: HR/Admin reviews `CANCELLATION_REQUESTED` and approves/denies.
- **If Approved**: Restores balance and sets status `CANCELLED`.
- **If Rejected**: Keeps leave as `APPROVED`.
- **Endpoint**: `POST /api/leaves/[id]/cancel/admin`.

---

## 7. Cancellation Audit Trail

### Current Implementation
- **Status**: **NOT IMPLEMENTED**
- **Expected**: Should create audit log entry on cancellation

### Expected Audit Log
```typescript
{
  actorEmail: user.email,
  action: "LEAVE_CANCELLED",
  targetEmail: user.email, // self
  details: {
    leaveId,
    previousStatus,
    cancelledAt
  }
}
```

### Additional Fields
- `initiatedBy`: "EMPLOYEE" or "ADMIN"
- `isPartial`: boolean
- `restoredDays`: number
- `finalBalance`: number

---

## 8. Cancellation vs Rejection

### Cancellation
- **Actor**: Employee
- **Status Change**: `SUBMITTED/PENDING → CANCELLED`
- **Reason**: Employee-initiated
- **Balance Impact**: Should restore if was approved (not implemented)

### Rejection
- **Actor**: HR_HEAD or CEO
- **Status Change**: `SUBMITTED/PENDING → REJECTED`
- **Reason**: Management decision
- **Balance Impact**: Never decremented (request never approved)

---

## 9. UI Cancellation Flow

### Employee View
- **Button**: "Cancel Request" (if status allows)
- **Location**: Leave detail view (not explicitly found in codebase)
- **Confirmation**: Should show modal/confirmation
- **After Cancel**: Request shows as `CANCELLED`, removed from pending list

---

## 10. Bulk Cancellation

### Current Implementation
- **Status**: Not supported
- **Policy**: Not mentioned in policy docs
- **Use Case**: Employee wants to cancel multiple pending requests

---

## 11. Source Files

- **Cancellation Endpoint**: `app/api/leaves/[id]/route.ts`
- **Workflow Spec**: `docs/Workflow_Spec.md` (mentions cancellation rules)
- **Schema**: `prisma/schema.prisma` (LeaveStatus enum)

---

## 12. Known Gaps / Future Work

1. ✅ Balance Restoration implemented with audit log.
2. ✅ Admin cancellation endpoint added.
3. ✅ Partial cancellation supported.
4. ✅ Returned status introduced for modification flow.
5. 🕓 Need front-end wiring for new statuses and admin routes.

---

**Next Document**: [08-Date Time and Display Logic](./08-Date-Time-and-Display-Logic.md)
