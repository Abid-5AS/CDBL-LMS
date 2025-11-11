# CDBL Leave Management System - User Roles & Permissions

**Version:** 2.0
**Last Updated:** January 2025
**Status:** Production Ready

## Overview

This document defines the role hierarchy, permission matrix, and access control implementation for the CDBL Leave Management System. All roles benefit from system-wide enhancements including 2-Factor Authentication (2FA), improved UI/UX, and accessibility features introduced in v2.0.

---

## Role Hierarchy

The system implements a 5-tier role hierarchy with distinct permissions and access levels:

```
CEO (Highest Authority)
  └── HR_HEAD
      └── HR_ADMIN
          └── DEPT_HEAD
              └── EMPLOYEE (Base Role)
```

### Role Definitions

1. **EMPLOYEE**: Base role, all regular employees
2. **DEPT_HEAD**: Department head or team manager
3. **HR_ADMIN**: HR administrator, first-level approver
4. **HR_HEAD**: HR department head, final approver
5. **CEO**: Chief Executive Officer, highest authority

---

## Complete Permission Matrix

### Leave Management

| Action | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_HEAD | CEO |
|--------|----------|-----------|----------|---------|-----|
| **Apply for Leave** | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **View Own Leaves** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View All Leaves** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Cancel Own Leave** (Pending) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cancel Any Leave** | ❌ | ❌ | ❌ | ❌ | ❌ (Future) |
| **Approve Leave** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Reject Leave** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Forward Leave** | ❌ | ✅ (to HR_HEAD) | ✅ (to DEPT_HEAD) | ❌ | ❌ |
| **Self-Approval** | ❌ | ❌ | ❌ | ❌ | ❌ |

### Employee Management

| Action | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_HEAD | CEO |
|--------|----------|-----------|----------|---------|-----|
| **View Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Profile** | ❌ | ❌ | ❌ | ❌ | ❌ (Future) |
| **View Employees** | ❌ | ✅ (Team only) | ✅ (EMPLOYEE, DEPT_HEAD) | ✅ (All except CEO) | ✅ (All) |
| **Edit Employees** | ❌ | ❌ | ✅ (EMPLOYEE, DEPT_HEAD) | ✅ (All except CEO, HR_HEAD) | ✅ (All) |
| **Create Employees** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Assign Roles** | ❌ | ❌ | ✅ (EMPLOYEE, DEPT_HEAD) | ✅ (EMPLOYEE, DEPT_HEAD, HR_ADMIN) | ✅ (All) |

### Dashboard & Analytics

| Action | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_HEAD | CEO |
|--------|----------|-----------|----------|---------|-----|
| **Personal Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Team Dashboard** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Department Analytics** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Org-Wide Analytics** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Executive Dashboard** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Policy Compliance** | ❌ | ❌ | ❌ | ✅ | ✅ |

### Administrative Functions

| Action | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_HEAD | CEO |
|--------|----------|-----------|----------|---------|-----|
| **Holiday Management** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Policy Configuration** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Audit Logs** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **System Settings** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ✅ | ✅ | ✅ |

### Balance & Leave Data

| Action | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_ADMIN | CEO |
|--------|----------|-----------|----------|----------|-----|
| **View Own Balance** | ✅ | ✅ | ✅ | ✅ | ❌ (Executive view) |
| **View Employee Balance** | ❌ | ❌ | ✅ | ✅ | ❌ (Executive view) |
| **Adjust Balance** | ❌ | ❌ | ❌ (Future) | ❌ (Future) | ❌ (Future) |

---

## Role-Based Dashboards

### EMPLOYEE Dashboard

**Location**: `/dashboard`

**Features**:
- Personal leave balances (EL, CL, ML)
- Leave history (last 10 requests)
- Quick apply button
- Monthly leave usage trend
- Leave type distribution chart
- Policy reminders
- Today's status

**Enhanced Features (v2.0)** ✨:
- **Approval Stage Tracking**: KPIs now show which role is currently reviewing pending requests
- **Average Wait Time**: Displays average waiting time for pending requests
- **Dynamic Icons**: Role-specific icons (HR Admin, Manager, HR Head, CEO) in KPI cards
- **Improved Accessibility**: Color-blind friendly status indicators with multi-modal encoding

**Access**: Own data only

---

### DEPT_HEAD Dashboard

**Location**: `/manager/dashboard`

**Features**:
- Team member leave overview
- Pending approvals from team
- Team leave statistics
- Department calendar view
- Team member profiles (read-only)

**Access**: Team members in their department only

---

### HR_ADMIN Dashboard

**Location**: `/admin`

**Features**:
- All pending leave requests (organization-wide)
- Employee directory
- Leave request approval queue
- Holiday management interface
- Audit logs access
- Employee management (create, edit)

**Access**: 
- Can view: EMPLOYEE, DEPT_HEAD, HR_ADMIN
- Cannot view: HR_HEAD, CEO

---

### HR_HEAD Dashboard

**Location**: `/hr-head/dashboard`

**Features**:
- All pending leave requests
- Policy compliance dashboard
- Organization-wide analytics
- Escalations view
- Audit & system health
- Employee management (broader access)

**Access**:
- Can view: All except CEO
- Can edit: EMPLOYEE, DEPT_HEAD, HR_ADMIN
- Cannot edit: CEO, HR_HEAD

---

### CEO Dashboard

**Location**: `/ceo/dashboard`

**Features**:
- Executive dashboard with KPIs
- Organization-wide analytics
- Top-level metrics
- Strategic insights
- System health overview
- Full access to all employees

**Access**:
- Can view: Everyone (including CEO)
- Can edit: Everyone (including CEO)
- Full administrative access

---

## Permission Implementation

### Access Control Functions

Located in `lib/rbac.ts`:

#### `canViewAllRequests(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD

#### `canApprove(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD

**Note**: `canApprove()` returns true for all approvers, but actual approve/reject is restricted to HR_HEAD and CEO via workflow logic.

#### `canViewEmployee(viewerRole, targetRole)`

| Viewer Role | Can View |
|-------------|----------|
| CEO | Everyone |
| HR_HEAD | Everyone except CEO |
| HR_ADMIN | EMPLOYEE, DEPT_HEAD only |
| DEPT_HEAD | EMPLOYEE only |
| EMPLOYEE | Self only |

#### `canEditEmployee(viewerRole, targetRole)`

| Viewer Role | Can Edit |
|-------------|----------|
| CEO | Everyone |
| HR_HEAD | EMPLOYEE, DEPT_HEAD, HR_ADMIN |
| HR_ADMIN | EMPLOYEE, DEPT_HEAD only |
| DEPT_HEAD | None |
| EMPLOYEE | None |

#### `canAssignRole(viewerRole, targetRole)`

| Viewer Role | Can Assign |
|-------------|------------|
| CEO | Any role |
| HR_HEAD | EMPLOYEE, DEPT_HEAD, HR_ADMIN |
| HR_ADMIN | EMPLOYEE, DEPT_HEAD only |
| Others | None |

#### `canCreateEmployee(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO

---

## Approval Workflow Permissions

### Approval Chain Steps

```
Step 1: HR_ADMIN → Can FORWARD to DEPT_HEAD
Step 2: DEPT_HEAD → Can FORWARD to HR_HEAD
Step 3: HR_HEAD → Can APPROVE/REJECT or FORWARD to CEO
Step 4: CEO → Can APPROVE/REJECT (final decision)
```

### Workflow Permissions

**FORWARD Permission**:
- HR_ADMIN: ✅ Can forward to DEPT_HEAD
- DEPT_HEAD: ✅ Can forward to HR_HEAD
- HR_HEAD: ❌ Cannot forward (or can forward to CEO)
- CEO: ❌ Cannot forward (final step)

**APPROVE/REJECT Permission**:
- HR_ADMIN: ❌ Cannot approve/reject
- DEPT_HEAD: ❌ Cannot approve/reject
- HR_HEAD: ✅ Can approve/reject
- CEO: ✅ Can approve/reject

**Self-Approval**: Prevented for all roles (cannot approve own requests)

---

## User Personas & Use Cases

### Persona 1: Regular Employee (EMPLOYEE)

**Profile**: 
- Regular employee, no management responsibilities
- Needs to apply for leave and track own balances

**Use Cases**:
1. Apply for leave (EL, CL, ML)
2. View leave balances
3. Check leave request status
4. View leave history
5. Cancel pending leave requests
6. View company holidays
7. Access help/support

**Pain Points Solved**:
- No need to submit paper forms
- Real-time balance visibility
- Transparent approval status

---

### Persona 2: Department Head (DEPT_HEAD)

**Profile**:
- Manages a team/department
- Needs oversight of team leave

**Use Cases**:
1. All EMPLOYEE use cases (for own leave)
2. View team member leave requests
3. Forward team leave requests to HR_HEAD
4. View team leave statistics
5. Monitor team leave patterns

**Pain Points Solved**:
- Team leave visibility
- Forward requests without full approval authority
- Team analytics

---

### Persona 3: HR Administrator (HR_ADMIN)

**Profile**:
- Day-to-day HR operations
- First point of contact for leave requests

**Use Cases**:
1. All DEPT_HEAD use cases
2. View all pending leave requests
3. Forward leave requests in approval chain
4. Manage employee profiles
5. Manage holiday calendar
6. View audit logs
7. Create new employees

**Pain Points Solved**:
- Centralized leave request management
- Employee data management
- Holiday calendar control

---

### Persona 4: HR Head (HR_HEAD)

**Profile**:
- Strategic HR management
- Final approval authority

**Use Cases**:
1. All HR_ADMIN use cases
2. Approve/reject leave requests
3. Forward to CEO for sensitive cases
4. View organization-wide analytics
5. Monitor policy compliance
6. Manage policy settings

**Pain Points Solved**:
- Final decision authority
- Strategic insights
- Policy compliance monitoring

---

### Persona 5: Chief Executive (CEO)

**Profile**:
- Executive oversight
- Final approval for sensitive/strategic cases

**Use Cases**:
1. All HR_HEAD use cases
2. Executive dashboard with KPIs
3. Organization-wide strategic view
4. Final approval authority
5. Full system access

**Pain Points Solved**:
- Executive-level insights
- Full system visibility
- Strategic decision making

---

## Access Control Implementation

### Route Protection

Routes are protected via middleware and component-level checks:

**Protected Routes**:
- `/dashboard` - All authenticated users
- `/leaves/*` - All authenticated users
- `/admin/*` - HR_ADMIN, HR_HEAD, CEO
- `/hr-head/*` - HR_HEAD, CEO
- `/ceo/*` - CEO only
- `/manager/*` - DEPT_HEAD and above

### Component-Level Access

Components check permissions via `lib/rbac.ts` functions:

```typescript
import { canViewEmployee, canEditEmployee } from '@/lib/rbac';

// In component
if (canViewEmployee(currentUser.role, targetUser.role)) {
  // Show user profile
}
```

### API-Level Protection

API routes validate permissions:

```typescript
const user = await getCurrentUser();
if (!canApprove(user.role)) {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}
```

---

## Permission Inheritance

Roles inherit permissions from lower roles:

- **CEO**: Has all permissions
- **HR_HEAD**: Has HR_ADMIN + DEPT_HEAD + EMPLOYEE permissions (with own restrictions)
- **HR_ADMIN**: Has DEPT_HEAD + EMPLOYEE permissions
- **DEPT_HEAD**: Has EMPLOYEE permissions + team management
- **EMPLOYEE**: Base permissions only

---

## Visible Roles Matrix

Function: `getVisibleRoles(role)` in `lib/rbac.ts`

| Viewer Role | Can See Roles |
|-------------|--------------|
| CEO | All roles (EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO) |
| HR_HEAD | EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD |
| HR_ADMIN | EMPLOYEE, DEPT_HEAD, HR_ADMIN |
| DEPT_HEAD | EMPLOYEE only |
| EMPLOYEE | None (own profile only) |

---

## Special Access Rules

### Self-Approval Prevention

**Rule**: Users cannot approve their own leave requests

**Implementation**: 
- Check: `leave.requesterId !== user.id`
- Error: `self_approval_disallowed` or `self_rejection_disallowed`

**Applies to**: All roles with approval permission

### Balance Visibility

**Rule**: Executive roles (CEO) don't see personal balances in executive dashboard

**Implementation**: Executive dashboard shows org-wide metrics instead of personal balances

### Profile View Restrictions

**Rule**: HR_ADMIN cannot view HR_HEAD or CEO profiles

**Implementation**: `canViewEmployee()` function enforces hierarchy

---

## Permission Testing

### Test Scenarios

1. **EMPLOYEE**:
   - ✅ Can apply for own leave
   - ❌ Cannot view other employees
   - ❌ Cannot approve any leave

2. **DEPT_HEAD**:
   - ✅ Can view team members
   - ✅ Can forward team leave requests
   - ❌ Cannot approve/reject
   - ❌ Cannot view other departments

3. **HR_ADMIN**:
   - ✅ Can view all employees (except HR_HEAD, CEO)
   - ✅ Can forward leave requests
   - ❌ Cannot approve/reject
   - ✅ Can manage holidays

4. **HR_HEAD**:
   - ✅ Can approve/reject leave requests
   - ✅ Can view all employees (except CEO)
   - ✅ Can forward to CEO

5. **CEO**:
   - ✅ Full access to everything
   - ✅ Can approve/reject
   - ✅ Can view/edit anyone

---

## Related Documentation

- **Approval Workflow**: [Approval Workflow Documentation](./Policy%20Logic/06-Approval-Workflow-and-Chain.md)
- **RBAC Functions**: `lib/rbac.ts`
- **Workflow Logic**: `lib/workflow.ts`
- **Role Definitions**: [Database Schema](./03-Database-Schema.md)

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Role Count**: 5 roles (unchanged from v1.0)
**Permission Functions**: 6 core functions in `lib/rbac.ts`
**System-Wide Enhancements (v2.0)**: 2FA for all roles, Enhanced dashboard KPIs, Improved accessibility

