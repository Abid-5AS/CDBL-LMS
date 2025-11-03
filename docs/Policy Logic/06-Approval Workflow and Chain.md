# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **Per‑type approval chains:** Introduced configurable chains by leave type to honor Policy 6.10 (CL exception).
> 2) **Default vs CL:** Default chain unchanged; **CASUAL** uses a shorter chain (provisionally DEPT_HEAD only) pending HR confirmation.
> 3) **Permissions rule updated:** Final step in the active chain can **APPROVE/REJECT**; intermediate steps can only **FORWARD**.
> 4) **Endpoints:** Approve/Reject/Forward now resolve next role from the leave type’s chain, not a single global chain.
> 5) **UI:** Approval timeline and labels must read from the active chain for the specific request.
> 6) **Supervisor check:** Confirm whether CL chain is `["DEPT_HEAD"]` or `["DEPT_HEAD", "HR_HEAD"]`. Update `WORKFLOW_CHAINS.CASUAL` accordingly.

## Part 6: Approval Workflow & Chain

This document summarizes the approval workflow, chain of command, and role-based permissions.

---

## 1. Approval Chain (Sequential Order)

### Chain Definition
- **Source**: `lib/workflow.ts` - `WORKFLOW_CHAINS` map
- **Definition**:
  ```typescript
  export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", Role[]> = {
    DEFAULT: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
    CASUAL:  ["DEPT_HEAD"], // ⬅️ provisional per Policy 6.10; confirm if ["DEPT_HEAD","HR_HEAD"] is required
  };

  export function getChainFor(type: LeaveType): Role[] {
    return WORKFLOW_CHAINS[type] ?? WORKFLOW_CHAINS.DEFAULT;
  }
  ```
- **Rationale**: Policy 6.10 states **“Applications (except Casual Leave) sent through Dept Head → HRD → Management.”** Therefore CL follows a different route.

### Step Numbers
- Steps are **derived from the active chain** for the leave type.
- Example:
  - DEFAULT EL/ML: 1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO
  - CASUAL: 1=DEPT_HEAD
- **Function**: `getStepForRole(role, type)` returns 1‑indexed step within the active chain.

---

## 2. Leave Status Lifecycle

### Status Enum
```typescript
enum LeaveStatus {
  DRAFT       // Created but not submitted
  SUBMITTED   // Employee submitted → goes to HR_ADMIN
  PENDING     // In approval process (forwarded between roles)
  APPROVED    // Final approval granted
  REJECTED    // Final rejection
  CANCELLED   // Employee cancelled before approval
}
```

**Source**: `prisma/schema.prisma` (enum definition)

### Status Transitions

```
DRAFT → SUBMITTED → PENDING → { APPROVED | REJECTED }
                              ↓
                         CANCELLED (can happen from PENDING)
```

**Initial Status**: `SUBMITTED` (after employee submits)
- **Function**: `getInitialStatus()` returns `"SUBMITTED"`
- **Location**: `lib/workflow.ts` lines 59-61

---

## 3. Approval Actions

### Action Types
```typescript
type ApprovalAction = "FORWARD" | "APPROVE" | "REJECT"
```

### Action Permissions by Role
**Rule**: Permissions depend on **position in the active chain** for the request’s leave type.

| Position in Chain | FORWARD | APPROVE | REJECT |
|-------------------|---------|---------|--------|
| Intermediate step | ✅ Yes  | ❌ No   | ❌ No  |
| Final step        | ❌ No   | ✅ Yes  | ✅ Yes |

**Functions**:
- `isFinalApprover(role, type)` → true if `role` is last in `getChainFor(type)`.
- `canPerformAction(role, action, type)`:
  - `FORWARD` → allowed if not final step
  - `APPROVE/REJECT` → allowed only if final step

---

## 4. Approval Model (Database)

### Schema
```prisma
model Approval {
  id          Int              @id @default(autoincrement())
  leaveId     Int
  step        Int              // Step in chain: 1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO
  approverId  Int
  decision    ApprovalDecision @default(PENDING)
  toRole      String?          // Role forwarded to (if FORWARDED)
  comment     String?
  decidedAt   DateTime?

  leave       LeaveRequest     @relation(...)
  approver    User             @relation(...)
}
```

### Approval Decision Enum
```prisma
enum ApprovalDecision {
  APPROVED
  REJECTED
  FORWARDED
  PENDING
}
```

---

## 5. Approval Workflow Logic

### Step Sequence
- **Rule**: Steps must be sequential (cannot skip steps)
- **Enforcement**: System tracks `step` number, must be incremental

### Forward Action
- **Forward Action**: Next role is `getNextRoleInChain(currentRole, type)`.
- **Approve/Reject**: Only valid when `isFinalApprover(actorRole, type)` is true.

---

## 6. Approval Endpoints

### Approve Endpoint
- **Route**: `POST /api/leaves/[id]/approve`
- **Location**: `app/api/leaves/[id]/approve/route.ts`
- **Validation**:
  1. User authenticated
  2. User can perform "APPROVE" action
  3. Leave exists
  4. No self-approval (`leave.requesterId !== user.id`)
  5. Status is `SUBMITTED` or `PENDING`
- **Actions**:
  1. Resolve active chain: `const chain = getChainFor(leave.type)`
  2. Derive `step` and whether actor is final approver from `chain`
  3. Create `Approval` record with `decision`
  4. Update `LeaveRequest.status` accordingly (PENDING/APPROVED/REJECTED)

### Reject Endpoint
- **Route**: `POST /api/leaves/[id]/reject`
- **Location**: `app/api/leaves/[id]/reject/route.ts`
- **Same validations** as approve (except action = "REJECT")
- **Actions**: (see above)

### Forward Endpoint
- **Route**: `POST /api/leaves/[id]/forward`
- **Location**: `app/api/leaves/[id]/forward/route.ts`
- **Validations**:
  1. User can perform "FORWARD" action
  2. Next role exists in chain
  3. Cannot forward to invalid target
- **Actions**: (see above)

---

## 7. Self-Approval Prevention

### Rule
- **Enforcement**: Hard block
- **Check**: `leave.requesterId === user.id`
- **Error Code**: `self_approval_disallowed` (approve) or `self_rejection_disallowed` (reject)
- **Location**: 
  - `app/api/leaves/[id]/approve/route.ts` line 55
  - `app/api/leaves/[id]/reject/route.ts` line 56

---

## 8. Status After Action

### Function: `getStatusAfterAction()`
- **Location**: `lib/workflow.ts` lines 66-83
- **Logic**:
  - `APPROVE` → `APPROVED`
  - `REJECT` → `REJECTED`
  - `FORWARD` → `PENDING`

---

## 9. Next Role Calculation

### Function: `getNextRoleInChain(currentRole, type)`
- Returns the immediate next role within `getChainFor(type)`, or `null` if `currentRole` is last.
- `canForwardTo(actorRole, targetRole, type)` validates forwarding to the **immediate** next role only.

---

## 10. Audit Trail

### Audit Log Creation
Every approval action creates an audit log entry:

```typescript
await prisma.auditLog.create({
  data: {
    actorEmail: user.email,
    action: "LEAVE_APPROVE" | "LEAVE_REJECT" | "LEAVE_FORWARD",
    targetEmail: leave.requester.email,
    details: {
      leaveId,
      actorRole: userRole,
      step,
      toRole: <nextRole> // if FORWARDED
    },
  },
});
```

**Location**: Approval endpoints (approve, reject, forward)

---

## 11. Approval Timeline

### Display Logic
- **Order**: Approvals sorted by `step` ascending
- **Query**: `orderBy: { step: "asc" }`
- **Location**: `app/api/leaves/route.ts` (GET endpoint) lines 58-60

### Timeline Display
Shows sequence:
1. Created by Employee
2. HR_ADMIN → (FORWARDED to DEPT_HEAD or APPROVED/REJECTED)
3. DEPT_HEAD → (FORWARDED to HR_HEAD or APPROVED/REJECTED)
4. HR_HEAD → (APPROVED or REJECTED)
5. CEO → (APPROVED or REJECTED)

---

## 12. Edge Cases

### No Next Role
- **Condition**: Current role is last in chain (CEO)
- **Error Code**: `no_next_role`
- **Message**: "No next role in approval chain"
- **Location**: `app/api/leaves/[id]/forward/route.ts`

### Invalid Status
- **Valid States for Approval**: `SUBMITTED` or `PENDING`
- **Invalid States**: `DRAFT`, `APPROVED`, `REJECTED`, `CANCELLED`
- **Error Code**: `invalid_status`
- **Response**: `{ error: "invalid_status", currentStatus: <status> }`

### Missing Approver
- **Check**: System prevents unassigned HRs from acting
- **Note**: Delegation handled via HR Admin assignment (policy note)

---

## 13. Casual Leave Approval Chain Exception (Resolved)

### Policy Reference
- Policy 6.10: “Applications (**except Casual Leave**) sent through Dept Head → HRD → Management.”

### System Resolution
- **Type‑specific chains** implemented via `WORKFLOW_CHAINS`.
- **CASUAL** currently set to `["DEPT_HEAD"]` (single‑step approval).  
  - **Supervisor Confirmation Needed**: If HR wants HR_HEAD to approve CL as well, set to `["DEPT_HEAD","HR_HEAD"]`.

### Implications
- DEPT_HEAD becomes **final approver** for CL (as configured).
- Permissions automatically adapt:
  - DEPT_HEAD can **APPROVE/REJECT** CL
  - HR_ADMIN/HR_HEAD/CEO not involved for CL unless chain is reconfigured

---

## 14. MVP Simplification

### Current Implementation
- **Documentation** (Policy_Implementation_Map.md) mentions: "MVP focuses on HR Admin as single approver"
- **However**: Code implements full 4-step chain
- **Discrepancy**: Documentation suggests simplification, but codebase has full workflow

### Future Enhancement
- Can be simplified to single HR_ADMIN approver if needed
- Full chain remains in code for future use

---

## 15. Source Files

- **Workflow Logic**: `lib/workflow.ts`
- **Approval Endpoints**: 
  - `app/api/leaves/[id]/approve/route.ts`
  - `app/api/leaves/[id]/reject/route.ts`
  - `app/api/leaves/[id]/forward/route.ts`
- **Schema**: `prisma/schema.prisma` (Approval model, ApprovalDecision enum)
- **Workflow Spec**: `docs/Workflow_Spec.md`
- **RBAC**: `lib/rbac.ts` (role definitions)

---

## 16. Engineering Tasks

1. Implement `WORKFLOW_CHAINS` and helper functions:
   - `getChainFor(type)`, `getNextRoleInChain(currentRole, type)`, `isFinalApprover(role, type)`, `getStepForRole(role, type)`
2. Update approval endpoints to use per‑type chains.
3. Update `canPerformAction` logic to depend on final‑step detection.
4. Update UI timeline to derive steps from active chain.
5. Seed RBAC tests ensuring DEPT_HEAD can approve CL when final.
6. Add admin setting to change CL chain between `["DEPT_HEAD"]` and `["DEPT_HEAD","HR_HEAD"]`.


**Next Document**: [07-Cancellation and Modification Rules](./07-Cancellation-and-Modification-Rules.md)

