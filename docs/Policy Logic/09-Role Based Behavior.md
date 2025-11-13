# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks**
> **Phase 9 (Policy v2.0) — Frontend Updates**
> 1) **Status Visibility:** Added badges and tooltips for new statuses across all dashboards and leave lists.
> 2) **Dashboard Panels:** Updated Cancellation Requests Panel and Returned Requests Panel (from Phase 4) to use new status badges.
> 3) **Toast Messages:** All role-based actions (approve, reject, cancel, return) now use centralized toast messages.
> 4) **Filter Options:** Updated status filter dropdowns to include new statuses in My Leaves and approval pages.

> **Change Log & Engineering Tasks**
> 
> **Phase 4 (Policy v2.0 - RBAC & Role Logic):**
> 1) **RBAC extensions:** Added `canCancel(role, isOwnLeave)` and `canReturn(role)` functions to `lib/rbac.ts`.
> 2) **Cancellation permissions:** HR_ADMIN, HR_HEAD, CEO can cancel any approved leave; EMPLOYEE can initiate cancellation for own leave.
> 3) **Return permissions:** HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD can return requests for modification.
> 4) **Dashboard panels:** Added CancellationRequestsPanel and ReturnedRequestsPanel components.
> 5) **HR Admin dashboard:** Added Cancellation Requests panel.
> 6) **HR Head dashboard:** Added both Returned for Modification and Cancellation Requests panels.
> 7) **CEO dashboard:** Enhanced SystemOverviewCards with cancellation and returned request metrics.
> 
> **Previous Tasks:**
> 8) **Approval logic alignment:** Adjusted approver roles to use new per-type workflow chain via `getChainFor(type)`.
> 9) **Supervisor review:** Confirm if DEPT_HEAD can approve CL directly as final approver under new workflow.

## Part 9: Role-Based Behavior

This document summarizes role-based features, dashboards, visibility, and access restrictions.

---

## 1. Role Enum (Database Schema)

### Role Definition
```prisma
enum Role {
  EMPLOYEE
  DEPT_HEAD
  HR_ADMIN
  HR_HEAD
  CEO
}
```

**Source**: `prisma/schema.prisma`

---

## 2. Role Hierarchy

### Hierarchy (Lowest to Highest)
1. **EMPLOYEE** - Base role, applies for leave
2. **DEPT_HEAD** - Department head, intermediate approver
3. **HR_ADMIN** - HR administrator, first approver
4. **HR_HEAD** - HR head, final approver
5. **CEO** - Chief Executive, highest authority

---

## 3. Role-Based Permissions

### View All Requests
- **Function**: `canViewAllRequests(role)`
- **Returns true for**: `HR_ADMIN`, `HR_HEAD`, `CEO`, `DEPT_HEAD`
- **Returns false for**: `EMPLOYEE` (can only view own requests)
- **Location**: `lib/rbac.ts` lines 3-5

### Can Approve
- **Function**: `canApprove(role)`
- **Returns true for**: `HR_ADMIN`, `HR_HEAD`, `CEO`, `DEPT_HEAD`
- **Returns false for**: `EMPLOYEE`
- **Location**: `lib/rbac.ts` lines 7-9

### Can View Employee
- **Function**: `canViewEmployee(viewerRole, targetRole)`
- **Location**: `lib/rbac.ts` lines 16-37

**Rules**:
- **CEO**: Can view everyone
- **HR_HEAD**: Can view everyone except CEO
- **HR_ADMIN**: Can view only EMPLOYEE and DEPT_HEAD
- **DEPT_HEAD**: Can view only EMPLOYEE
- **EMPLOYEE**: Can view only self

### Can Edit Employee
- **Function**: `canEditEmployee(viewerRole, targetRole)`
- **Location**: `lib/rbac.ts` lines 44-60

**Rules**:
- **CEO**: Can edit everyone
- **HR_HEAD**: Can edit HR_ADMIN, EMPLOYEE, DEPT_HEAD (not CEO, not HR_HEAD)
- **HR_ADMIN**: Can edit only EMPLOYEE and DEPT_HEAD
- **DEPT_HEAD**: Cannot edit others
- **EMPLOYEE**: Cannot edit others

### Can Assign Role
- **Function**: `canAssignRole(viewerRole, targetRole)`
- **Location**: `lib/rbac.ts` lines 87-103

**Rules**:
- **CEO**: Can assign any role
- **HR_HEAD**: Can assign EMPLOYEE, DEPT_HEAD, HR_ADMIN
- **HR_ADMIN**: Can assign only EMPLOYEE and DEPT_HEAD
- **Others**: Cannot assign roles

### Can Create Employee
- **Function**: `canCreateEmployee(role)`
- **Returns true for**: `HR_ADMIN`, `HR_HEAD`, `CEO`
- **Location**: `lib/rbac.ts` lines 109-111

### Can Cancel
- **Function**: `canCancel(role)`
- **Returns true for**: `HR_ADMIN`, `HR_HEAD`, `CEO` (any approved leave)
- **Returns true for**: `EMPLOYEE` (own approved leave — triggers `CANCELLATION_REQUESTED`)
- **Location**: `lib/rbac.ts` lines TBD
- **Purpose**: Restricts who can initiate or finalize leave cancellations.

### Can Return
- **Function**: `canReturn(role)`
- **Returns true for**: `HR_ADMIN`, `HR_HEAD`, `CEO`
- **Purpose**: Allows approver to return a request for modification (sets status to `RETURNED`).

---

## 4. Role-Specific Dashboards

### Employee Dashboard
- **Location**: `app/dashboard/page.tsx`
- **Features**:
  - View own leave requests
  - View own balances
  - Apply for leave
  - View leave history
  - Monthly usage trends

### Manager Dashboard
- **Location**: `app/manager/dashboard/page.tsx`
- **Features**: Not explicitly found (may use employee dashboard with additional approvals)

### HR Admin Dashboard
- **Location**: `app/admin/page.tsx`
- **Features**:
  - View all employee leave requests
  - Approval queue
  - Employee management
  - Holiday management
  - Audit logs

> **Enhancement:** Include a “Cancellation Requests” panel showing all `CANCELLATION_REQUESTED` leaves awaiting HR/Admin review.

### HR Head Dashboard
- **Location**: `app/hr-head/dashboard/page.tsx`
- **Features**: Similar to HR Admin with broader access

> **Enhancement:** Add a “Returned for Modification” list and access to full audit logs.

### CEO Dashboard
- **Location**: `app/ceo/dashboard/page.tsx`
- **Features**:
  - Organization-wide analytics
  - Top KPIs
  - Executive view
  - Audit & System Health
  - All employee access

> **Enhancement:** Include organization-wide overview of Returned and Cancelled leave metrics.

---

## 5. Approval Permissions by Role (v2.0)

### DEFAULT Chain (EL, ML, and most leave types)

#### HR_ADMIN (Step 1)
- **Actions**: Can FORWARD to DEPT_HEAD or REJECT (operational role)
- **Cannot**: APPROVE (not final approver)
- **Function**: `canPerformAction(role, action, type)`
- **Location**: `lib/workflow.ts` lines 75-109
- **Note**: HR_ADMIN can REJECT as operational role to block invalid requests early

#### DEPT_HEAD (Step 2)
- **Actions**: Can FORWARD to HR_HEAD or RETURN for modification
- **Cannot**: APPROVE or REJECT (not final approver in DEFAULT chain)
- **Note**: For CASUAL leave, DEPT_HEAD IS the final approver

#### HR_HEAD (Step 3)
- **Actions**: Can FORWARD to CEO or RETURN for modification
- **Cannot**: APPROVE or REJECT (not final approver in DEFAULT chain)
- **Note**: Intermediate approver, must forward to CEO for final decision

#### CEO (Step 4 - **Final Approver**)
- **Actions**: Can APPROVE or REJECT
- **Cannot**: FORWARD (last in chain)
- **Authority**: CEO is the **sole final approver** for DEFAULT leave types

### CASUAL Chain

#### DEPT_HEAD (Step 1 - **Final Approver**)
- **Actions**: Can APPROVE or REJECT (final approver for CASUAL leave)
- **Chain**: CASUAL uses single-step chain: `["DEPT_HEAD"]`
- **Policy**: Per Policy 6.10 - CASUAL leave bypasses normal approval chain
- **Authority**: DEPT_HEAD is the **sole final approver** for CASUAL leave

> **Key Rules (v2.0)**:
> - Roles determined dynamically from `getChainFor(type)`
> - Only **final approver** in the active chain can **APPROVE**
> - Intermediate roles can only **FORWARD** or **RETURN**
> - HR_ADMIN can **REJECT** as operational role (but cannot APPROVE)
> - CEO is final approver for DEFAULT, DEPT_HEAD is final approver for CASUAL

---

## 6. Leave Application Access

### Who Can Apply
- **All roles** can apply for leave
- **Self-approval**: Prevented (cannot approve own requests)
- **Location**: Approval endpoints check `leave.requesterId !== user.id`

### Who Can View Applications
- **Employee**: Own requests only
- **HR_ADMIN/HR_HEAD/CEO/DEPT_HEAD**: All requests (via `canViewAllRequests()`)

---

## 7. Balance Visibility

### Employee View
- **Can See**: Own balances for all leave types
- **Endpoint**: `GET /api/balance/mine`
- **Location**: `app/api/balance/mine/route.ts`

### Admin View
- **Can See**: All employee balances
- **Purpose**: Leave management and oversight

### CEO View
- **Note**: Documentation mentions "cannot see personal balances" (executive view)
- **Can See**: Organization-wide analytics instead

---

## 8. Employee Management Access

### Visible Roles (per role)
- **Function**: `getVisibleRoles(role)`
- **Location**: `lib/rbac.ts` lines 67-80

**Results**:
- **CEO**: All roles
- **HR_HEAD**: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD
- **HR_ADMIN**: EMPLOYEE, DEPT_HEAD, HR_ADMIN
- **DEPT_HEAD**: EMPLOYEE only
- **EMPLOYEE**: None

---

## 9. Special Features by Role

### HR_ADMIN Features
- **Holiday Management**: Full CRUD operations
- **Employee Management**: Create, edit employees
- **Approval Queue**: First step in approval chain
- **Audit Logs**: Can view audit trail

### HR_HEAD Features
- **All HR_ADMIN features**
- **Final Approval**: Can approve/reject (no forward)
- **Broader Access**: Can view/edit HR_ADMIN users

### CEO Features
- **Executive Dashboard**: Organization-wide analytics
- **Final Approval**: Can approve/reject
- **Full Access**: Can view/edit anyone (including CEO role)
- **System Health**: Access to system diagnostics

### DEPT_HEAD Features
- **Team View**: Can view employees in department
- **Intermediate Approval**: Can forward to HR_HEAD
- **Limited**: Cannot edit/create employees

---

## 10. Admin-Only Leave Types

### Special Leave Types (Admin Grant)
These leave types require admin intervention:

- **EXTRAWITHPAY**: Admin-only grant
- **EXTRAWITHOUTPAY**: Admin-only
- **MATERNITY**: Admin-only (eligibility validation)
- **PATERNITY**: Admin validation (36-month gap check)
- **STUDY**: Admin validation (≥3 yrs service check)
- **SPECIAL_DISABILITY**: Board/Admin flow
- **QUARANTINE**: Admin override for >21 days

**Note**: Implementation details not found in codebase (documented in policy docs)

---

## 11. Role-Based UI Components

### Employee View Component
- **Location**: `components/roles/EmployeeView.tsx`
- **Features**: Leave application, own requests, balances

### Manager View Component
- **Location**: `components/roles/ManagerView.tsx`
- **Features**: Team oversight, approvals

### HR Admin View Component
- **Location**: `components/roles/HRAdminView.tsx`
- **Features**: Full admin capabilities

### HR Head View Component
- **Location**: `components/roles/HRHeadView.tsx`
- **Features**: Broader HR management

### Executive View Component
- **Location**: `components/roles/ExecutiveView.tsx`
- **Features**: CEO-level dashboard

---

## 12. Access Restrictions

### Cannot Do (by role)

**EMPLOYEE**:
- Cannot view other employees
- Cannot approve requests
- Cannot create/edit employees

**DEPT_HEAD**:
- Cannot edit employees
- Cannot create employees
- Cannot approve (only forward)

**HR_ADMIN**:
- Cannot view/edit CEO
- Cannot view/edit HR_HEAD
- Cannot approve (only forward)
- Cannot assign HR_HEAD or CEO roles

**HR_ADMIN/HR_HEAD**:
- Can view and act on `CANCELLATION_REQUESTED` and `RETURNED` statuses.

**HR_HEAD**:
- Cannot view/edit CEO
- Cannot assign CEO role

**CEO**:
- No restrictions (full access)

---

## 13. Source Files

- **RBAC Functions**: `lib/rbac.ts`
- **Workflow Permissions**: `lib/workflow.ts`
- **Role Components**: `components/roles/*.tsx`
- **Dashboard Pages**: 
  - `app/dashboard/page.tsx`
  - `app/admin/page.tsx`
  - `app/hr-head/dashboard/page.tsx`
  - `app/ceo/dashboard/page.tsx`
  - `app/manager/dashboard/page.tsx`
- **Schema**: `prisma/schema.prisma` (Role enum)

---

## 14. Engineering Tasks Summary

1. Implement `canCancel()` and `canReturn()` in `lib/rbac.ts`.
2. Modify approval and cancellation endpoints to respect new permissions.
3. Add UI panels for Returned and Cancellation Requests per dashboard.
4. Extend audit trail logging for return and cancellation actions.
5. Verify DEPT_HEAD final-approver behavior for CL as per HR confirmation.

---

**Next Document**: [10-System Messages and Error Handling](./10-System-Messages-and-Error-Handling.md)
