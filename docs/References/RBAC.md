# Roles & Permissions (RBAC) - Complete Reference

## Role Hierarchy

```
CEO (Highest Authority)
  └── HR_HEAD
      └── HR_ADMIN
          └── DEPT_HEAD
              └── EMPLOYEE (Base Role)
```

---

## Complete Role Matrix

### EMPLOYEE

**Can Do**:
- Create own leave requests (DRAFT status)
- Submit own leave requests (→ SUBMITTED/PENDING)
- View own leave requests and history
- Cancel own pending requests (before approval)
- View own leave balances
- View company holidays
- View policies

**Cannot Do**:
- View other employees' profiles
- Approve/forward/reject leave requests
- Access admin functions
- Edit any user information
- View audit logs

**Dashboard**: Personal dashboard with own data only

---

### DEPT_HEAD (Department Head / Manager)

**Can Do**:
- All EMPLOYEE permissions (for own leave)
- View team members (EMPLOYEE only)
- View team leave requests
- Forward leave requests to HR_HEAD
- View team statistics and analytics
- View team member leave history (read-only)

**Cannot Do**:
- Approve or reject leave requests (can only forward)
- View employees outside their department
- View HR roles or CEO
- Edit team member details (read-only access)
- View organization-wide data

**Dashboard**: Manager dashboard with team overview

---

### HR_ADMIN (HR Administrator)

**Can Do**:
- All DEPT_HEAD permissions
- View all employees (EMPLOYEE, DEPT_HEAD, HR_ADMIN)
- View all leave requests (organization-wide)
- Forward leave requests to DEPT_HEAD
- Edit employee information (EMPLOYEE and DEPT_HEAD only)
- Create new employees
- Assign roles (EMPLOYEE, DEPT_HEAD only)
- Manage holiday calendar
- Access audit logs
- Manage user accounts

**Cannot Do**:
- Approve or reject leave requests (can only forward)
- View HR_HEAD or CEO profiles
- Edit HR_HEAD or CEO
- Assign HR_HEAD or CEO roles
- View personal balances in employee detail pages (admin view only)

**Dashboard**: HR Admin dashboard with approval queue and user management

---

### HR_HEAD

**Can Do**:
- All HR_ADMIN permissions
- View all employees (except CEO)
- Approve/reject leave requests (final authority)
- Forward to CEO when needed
- Edit employee information (except CEO and HR_HEAD)
- Assign roles (EMPLOYEE, DEPT_HEAD, HR_ADMIN)
- View policy compliance dashboard
- Organization-wide analytics
- System health monitoring

**Cannot Do**:
- View CEO profile (read-only if included)
- Edit CEO
- Assign CEO or HR_HEAD roles
- See personal balances in executive view

**Dashboard**: HR Head dashboard with policy compliance and analytics

---

### CEO / MD

**Can Do**:
- Full system access
- View all employees (including HR roles and CEO)
- Approve/reject leave requests (final authority)
- Edit any employee (including CEO)
- Assign any role
- Access all admin functions
- Organization-wide analytics
- Executive dashboard with KPIs
- System configuration

**Cannot Do**:
- See personal leave balances (executive view shows org-wide metrics instead)

**Dashboard**: Executive dashboard with strategic insights

---

## Permission Functions

Located in `lib/rbac.ts`:

### `canViewAllRequests(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD  
Returns `false` for: EMPLOYEE

### `canApprove(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD  
**Note**: Actual approve/reject restricted to HR_HEAD and CEO via workflow logic

### `canViewEmployee(viewerRole, targetRole)`
- CEO → Can view everyone
- HR_HEAD → Can view everyone except CEO
- HR_ADMIN → Can view EMPLOYEE, DEPT_HEAD only
- DEPT_HEAD → Can view EMPLOYEE only
- EMPLOYEE → Can view self only

### `canEditEmployee(viewerRole, targetRole)`
- CEO → Can edit everyone
- HR_HEAD → Can edit EMPLOYEE, DEPT_HEAD, HR_ADMIN (not CEO, not HR_HEAD)
- HR_ADMIN → Can edit EMPLOYEE, DEPT_HEAD only
- DEPT_HEAD → Cannot edit others
- EMPLOYEE → Cannot edit others

### `canAssignRole(viewerRole, targetRole)`
- CEO → Can assign any role
- HR_HEAD → Can assign EMPLOYEE, DEPT_HEAD, HR_ADMIN
- HR_ADMIN → Can assign EMPLOYEE, DEPT_HEAD only
- Others → Cannot assign roles

### `canCreateEmployee(role)`
Returns `true` for: HR_ADMIN, HR_HEAD, CEO

### `getVisibleRoles(role)`
Returns array of roles the viewer can see in employee management:
- CEO → All roles
- HR_HEAD → EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD
- HR_ADMIN → EMPLOYEE, DEPT_HEAD, HR_ADMIN
- DEPT_HEAD → EMPLOYEE only
- EMPLOYEE → Empty array

---

## Approval Permissions by Role

| Role | Can Forward? | Can Approve? | Can Reject? | Forward To |
|------|-------------|--------------|-------------|------------|
| EMPLOYEE | ❌ | ❌ | ❌ | - |
| DEPT_HEAD | ✅ | ❌ | ❌ | HR_HEAD |
| HR_ADMIN | ✅ | ❌ | ❌ | DEPT_HEAD |
| HR_HEAD | ❌* | ✅ | ✅ | CEO (if needed) |
| CEO | ❌ | ✅ | ✅ | - |

*HR_HEAD can forward to CEO but typically approves/rejects directly

---

## Access Control Implementation

### Route Protection
- Middleware validates JWT and role
- Components check permissions before rendering
- API routes validate permissions server-side

### Self-Approval Prevention
- All roles: Cannot approve own leave requests
- Check: `leave.requesterId !== user.id`

### Resource Ownership
- Employees can only access their own resources
- Managers can access team resources
- HR can access organization-wide resources
- CEO has full access

---

## Related Documentation

- **Complete User Roles**: [User Roles & Permissions](./../04-User-Roles-and-Permissions.md)
- **RBAC Functions**: `lib/rbac.ts`
- **Workflow Permissions**: `lib/workflow.ts`

---

**Document Version**: 1.0 (Updated)  
**Last Updated**: Current  
**Role Count**: 5 roles  
**Permission Functions**: 6 core functions

