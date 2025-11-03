# CDBL Policy v2.0 — Role Context Enforcement Rule

> **Source of Truth**: Always reference `docs/Policy Logic/` files before implementing role features

## Quick Reference

### Primary Policy Documents

- **Role Behavior**: `docs/Policy Logic/09-Role Based Behavior.md`
- **Approval Workflows**: `docs/Policy Logic/06-Approval Workflow and Chain.md`
- **RBAC Functions**: `lib/rbac.ts`
- **Workflow Functions**: `lib/workflow.ts`
- **UI Actions**: `lib/page-context.ts`

---

## Rule Enforcement

### Before Working on Role Features

1. **READ** relevant Policy Logic file FIRST from `docs/Policy Logic/`
2. **VERIFY** role permissions in `lib/rbac.ts` match policy
3. **CHECK** workflow chains in `lib/workflow.ts` for approval logic
4. **ONLY THEN** implement changes

### When Creating UI Components/Pages

```typescript
// ✅ CORRECT: Use existing RBAC functions
import { canViewAllRequests, canCancel, canReturn } from '@/lib/rbac';
import { getActionsForContext } from '@/lib/page-context';

// Generate role-aware actions
const actions = getActionsForContext(user.role, pageContext, selectionCount);

// Check permissions
if (canCancel(role, isOwnLeave)) {
  // Show cancel button
}

// ❌ WRONG: Hardcode role checks
if (role === 'HR_ADMIN' || role === 'HR_HEAD') { ... }
```

### When Creating API Handlers

```typescript
// ✅ CORRECT: Guard with RBAC functions
import { canCancel, canReturn, isFinalApprover } from '@/lib/rbac';
import { getChainFor } from '@/lib/workflow';

// Check permission
if (!canCancel(user.role, leave.requesterId === user.id)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Check approval chain position
const chain = getChainFor(leave.type);
const canApprove = isFinalApprover(user.role, leave.type);
if (canApprove && action === 'APPROVE') {
  // Final approver can approve
}

// ❌ WRONG: Assume role permissions
if (user.role === 'HR_ADMIN') { ... }
```

---

## Role Permissions Matrix

### EMPLOYEE

**Can Do:**

- Apply Leave
- Cancel Leave (SUBMITTED/PENDING)
- Initiate Cancellation Request (APPROVED → CANCELLATION_REQUESTED)
- View Own Requests
- View Own Balances
- View Policy Document

**Cannot Do:**

- Approve Any Requests
- Access Other Employee Data
- Generate Reports
- Self-approve (hard block)

**Approval Chain:** NOT IN CHAIN

---

### DEPT_HEAD

**Can Do:**

- Forward to next step in chain
- Approve/Reject CASUAL (final step in CL chain)
- View Team Members
- Return Requests for Modification
- Cancel Any Approved Leave (admin override)

**Cannot Do:**

- Approve/Reject non-CASUAL (intermediate only)
- View/Edit HR_HEAD, CEO, or other DEPT_HEADS
- Create/Edit Employees

**Approval Chain:** Step 2 in DEFAULT, Step 1 (final) in CASUAL

---

### HR_ADMIN

**Can Do:**

- Forward to next step in chain
- Review Requests (first step)
- Return Requests for Modification
- Cancel Any Approved Leave
- View Employees & DEPT_HEAD
- Create/Edit Employees
- Assign EMPLOYEE/DEPT_HEAD roles
- Generate Reports & Audit Logs

**Cannot Do:**

- Approve/Reject non-CASUAL (intermediate only)
- View/Edit HR_HEAD or CEO
- Assign HR_HEAD/CEO roles

**Approval Chain:** Step 1 in DEFAULT chain

---

### HR_HEAD

**Can Do:**

- Approve/Reject (final step)
- Forward to CEO if in chain
- Return Requests for Modification
- Cancel Any Approved Leave
- View Everyone Except CEO
- Edit Everyone Except CEO
- Assign EMPLOYEE/DEPT_HEAD/HR_ADMIN roles
- All HR_ADMIN features

**Cannot Do:**

- View/Edit CEO
- Assign CEO role

**Approval Chain:** Step 3 in DEFAULT (final approver for non-CASUAL)

---

### CEO

**Can Do:**

- Approve/Reject (final step in chain)
- Return Requests for Modification
- Cancel Any Approved Leave
- View Everyone (full access)
- Edit Everyone (full access)
- Assign Any Role
- Organization-wide Analytics
- System Health & Diagnostics

**Cannot Do:**

- Self-approve own requests
- Modify Policy Configurations

**Approval Chain:** Step 4 in DEFAULT (final fallback)

---

## Workflow Chains (Per Leave Type)

### DEFAULT Chain

**Type:** EARNED, MEDICAL, EXTRAWITHPAY, EXTRAWITHOUTPAY, MATERNITY, PATERNITY, STUDY, SPECIAL_DISABILITY, QUARANTINE

**Chain:** `HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO`

**Actions:**

- HR_ADMIN: FORWARD to DEPT_HEAD
- DEPT_HEAD: FORWARD to HR_HEAD
- HR_HEAD: **APPROVE/REJECT** (final)
- CEO: APPROVE/REJECT (fallback final)

### CASUAL Chain

**Type:** CASUAL

**Chain:** `DEPT_HEAD` (single step)

**Actions:**

- DEPT_HEAD: **APPROVE/REJECT** (final)

### Critical Rule

✅ **Only final step in chain can APPROVE/REJECT**  
❌ **Intermediates can FORWARD or RETURN only**

---

## Leave Status Lifecycle

| Status                 | Description                                       |
| ---------------------- | ------------------------------------------------- |
| DRAFT                  | Created, not submitted                            |
| SUBMITTED              | Employee submitted → goes to first chain step     |
| PENDING                | In approval process (forwarded between roles)     |
| APPROVED               | Final approval granted                            |
| REJECTED               | Final rejection                                   |
| CANCELLED              | Employee cancelled before approval                |
| RETURNED               | Returned for modification                         |
| CANCELLATION_REQUESTED | Employee requested cancellation of APPROVED leave |
| RECALLED               | Recalled by HR before end date                    |
| OVERSTAY_PENDING       | Past end date without return confirmation         |

---

## UI Enforcement

### Dashboard Locations

- **Employee**: `/app/dashboard/page.tsx` → Apply Leave, My Requests, Own Balances
- **Manager**: `/app/manager/dashboard/page.tsx` → Team Requests, Approvals
- **HR Admin**: `/app/admin/page.tsx` → All Requests, Approval Queue, Employees, Holidays, Audit
- **HR Head**: `/app/hr-head/dashboard/page.tsx` → All HR_ADMIN + Final Approvals, Full Audit
- **CEO**: `/app/ceo/dashboard/page.tsx` → Org Analytics, Top KPIs, System Health

### FloatingDock Actions

Use `getActionsForContext()` from `lib/page-context.ts` to provide role-aware actions.

---

## RBAC Functions Reference

### From `lib/rbac.ts`

```typescript
// Permission checks
canViewAllRequests(role: AppRole): boolean
canApprove(role: AppRole): boolean
canCancel(role: AppRole, isOwnLeave: boolean): boolean
canReturn(role: AppRole): boolean

// Employee visibility
canViewEmployee(viewerRole: AppRole, targetRole: AppRole): boolean
canEditEmployee(viewerRole: AppRole, targetRole: AppRole): boolean

// Role assignment
canAssignRole(viewerRole: AppRole, targetRole: AppRole): boolean
canCreateEmployee(role: AppRole): boolean

// Role lists
getVisibleRoles(role: AppRole): AppRole[]
```

### From `lib/workflow.ts`

```typescript
// Workflow chains
getChainFor(type: LeaveType): AppRole[]
getNextRoleInChain(currentRole: AppRole, type: LeaveType): AppRole | null
getStepForRole(role: AppRole, type: LeaveType): number

// Approval permissions
isFinalApprover(role: AppRole, type: LeaveType): boolean
canPerformAction(role: AppRole, action: ApprovalAction, type: LeaveType): boolean
canForwardTo(actorRole: AppRole, targetRole: AppRole, type: LeaveType): boolean

// Status transitions
getInitialStatus(): LeaveStatus
getStatusAfterAction(currentStatus: LeaveStatus, action: ApprovalAction, targetRole?: AppRole): LeaveStatus
```

---

## Critical Safeguards

❌ **NEVER** allow EMPLOYEE to approve ANY requests (even own)  
❌ **NEVER** allow HR_ADMIN to approve/reject DEFAULT chain (only FORWARD)  
❌ **NEVER** allow intermediate roles to APPROVE/REJECT (only final approver)  
❌ **NEVER** create shared dashboards without role checks  
❌ **NEVER** expose HR/Admin APIs to employees  
❌ **NEVER** create shared states without checking roleContext  
❌ **NEVER** hardcode approval sequences (use getChainFor(type))  
❌ **NEVER** skip balance restoration on admin cancellation

✅ **ALWAYS** use per-type workflow chains  
✅ **ALWAYS** verify permissions before rendering UI actions  
✅ **ALWAYS** log role context in audit trail  
✅ **ALWAYS** cross-reference Policy Logic docs

---

## Common Mistakes to Avoid

1. **Don't assume HR_ADMIN can approve non-CASUAL** (they forward only)
2. **Don't forget CASUAL uses different chain** than DEFAULT
3. **Don't allow self-approval** without checking `leave.requesterId !== user.id`
4. **Don't mix employee/HR dashboard features**
5. **Don't skip balance restoration** on admin cancellation
6. **Don't bypass canCancel() or canReturn()** checks

---

## Example Implementation Flow

### Scenario: Adding Cancel Action to FloatingDock

```typescript
// 1. Check Policy Logic/09-Role Based Behavior.md
// 2. Verify canCancel() signature in lib/rbac.ts
// 3. Add action conditionally in lib/page-context.ts

case "requests":
  if (role === "EMPLOYEE") {
    if (selectionCount > 0) {
      actions.push({
        label: `Cancel Selected (${selectionCount})`,
        icon: X,
        onClick: () => window.dispatchEvent(new CustomEvent("lms:bulkCancel")),
        badge: selectionCount,
        requiresSelection: true,
        priority: "primary"
      });
    }
  }
  break;

// 4. Guard API handler with canCancel()
POST /api/leaves/[id]/cancel
if (!canCancel(user.role, leave.requesterId === user.id)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 5. Handle approval workflow if APPROVED
if (leave.status === 'APPROVED') {
  // Admin review required
  await prisma.leaveRequest.update({
    where: { id },
    data: { status: 'CANCELLATION_REQUESTED' }
  });
}
```

---

**Last Updated**: Aligned with Policy v2.0 implementation  
**Version**: 2.0  
**Maintainer**: CDBL Leave Management System
