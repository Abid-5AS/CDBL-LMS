# CDBL Leave Management System - Demo Guide

## Overview

This document provides a comprehensive guide for demonstrating the CDBL Leave Management System, including role capabilities, policy enforcement, and testing procedures.

## Role Matrix

### EMPLOYEE
**Can See:**
- Own dashboard with leave balances
- Own leave history
- Leave application form
- Policies and holidays calendar

**Can Do:**
- Apply for leave (EL, CL, ML, etc.)
- View own leave requests status
- Cancel pending leave requests (before approval)
- Customize own dashboard layout

**Cannot Do:**
- View other employees' profiles
- Approve/forward leave requests
- Access admin functions

---

### DEPT_HEAD (Department Head / Manager)
**Can See:**
- Team dashboard
- Team members' profiles (in their department only)
- Leave requests from team members
- Team leave overview

**Can Do:**
- Forward leave requests (to HR Head only)
- View team members' leave history
- View team statistics

**Cannot Do:**
- Approve or reject leave requests (can only forward)
- View employees outside their department
- View HR roles or CEO
- Edit team member details (read-only)

---

### HR_ADMIN (HR & Admin)
**Can See:**
- Employee Directory (EMPLOYEE and DEPT_HEAD only)
- All pending leave requests
- Employee detail pages (admin view)
- Audit logs
- Admin console

**Can Do:**
- Forward leave requests (to Dept Head)
- Edit employee information (EMPLOYEE and DEPT_HEAD)
- Triage leave requests
- Access audit logs

**Cannot Do:**
- Approve or reject leave requests (can only forward)
- View HR_HEAD or CEO roles
- See personal balances in employee detail pages (admin panels only)

---

### HR_HEAD
**Can See:**
- All employees (except CEO)
- All leave requests
- Policy compliance dashboard
- Escalations
- Organization-wide analytics
- Audit & System Health

**Can Do:**
- Approve/reject leave requests
- Forward to CEO when needed
- Edit employee information (except CEO and HR_HEAD)
- View policy compliance

**Cannot Do:**
- View CEO profile (read-only if included)
- See personal balances in ControlCenter (executive view)

---

### CEO / MD
**Can See:**
- All employees (including HR roles)
- Organization-wide analytics
- Top KPIs
- Executive dashboard
- Audit & System Health

**Can Do:**
- Final approval/rejection of leave requests
- Edit any employee
- Assign any role
- Access all admin functions

**Cannot Do:**
- See personal leave balances (executive view)

---

## Policy Rules Enforcement

### Hard Blocks (Prevent Submission)

1. **Earned Leave (EL)**
   - Maximum carry forward: 60 days (blocks if exceeded)
   - Advance notice: 15 days minimum (hard requirement)
   - Accrual: 2 days/month (enforced via balance calculations)

2. **Casual Leave (CL)**
   - Maximum 3 consecutive days per spell (hard block)
   - Annual cap: 10 days/year (hard block if exceeded)
   - Cannot touch holidays or weekends (hard block with suggestion to use EL)

3. **Medical Leave (ML)**
   - More than 3 days requires medical certificate (hard block if missing)
   - Annual cap: 14 days/year (hard block if exceeded)

4. **Backdate Rules**
   - Controlled by `orgSettings.allowBackdate`:
     - `EL = "ask"` → Shows confirmation modal, logs audit
     - `CL = false` → Hard block
     - `ML = true` → Allowed
   - Maximum backdate window: 30 days (configurable)

### Soft Rules (Warnings, Allow Submit)

1. **CL Advance Notice**
   - If start date < 5 working days away → Warning banner
   - Submission allowed (management may reject/shorten)

2. **Backdate Confirmation**
   - For EL with `allowBackdate.EL = "ask"` → Confirmation modal required
   - Client-side confirmation + server audit log

---

## Approval Workflow

### Chain Order
```
Employee → HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO
```

### Actions by Role

| Role | Can Forward? | Can Approve? | Can Reject? | Forward To |
|------|-------------|--------------|-------------|------------|
| EMPLOYEE | ❌ | ❌ | ❌ | - |
| HR_ADMIN | ✅ | ❌ | ❌ | DEPT_HEAD |
| DEPT_HEAD | ✅ | ❌ | ❌ | HR_HEAD |
| HR_HEAD | ✅ | ✅ | ✅ | CEO (optional) |
| CEO | ❌ | ✅ | ✅ | - |

### Status Flow
- `DRAFT` → Employee creates
- `SUBMITTED` → Employee submits (goes to HR_ADMIN)
- `PENDING` → Forwarded through chain
- `APPROVED` → Final approval (HR_HEAD or CEO)
- `REJECTED` → Rejected by HR_HEAD or CEO
- `CANCELLED` → Cancelled by employee (before approval)

### Audit Logging
All transitions log to `AuditLog`:
- Action: `LEAVE_FORWARD`, `LEAVE_APPROVE`, `LEAVE_REJECT`
- Details: `{ leaveId, fromRole, toRole, step }`

---

## Running Policy Audit

### Automated Policy Audit Script

```bash
pnpm policy:audit
```

**Checks Performed:**
1. EL accrual math (2 days/month, cap 60, overflow to special up to 180)
2. CL spell >3 → fail
3. CL yearly >10 → fail
4. ML >3 without certificate → fail
5. Advance notice warnings fire for CL <5 working days (but allow)
6. Backdate matrix honors `orgSettings` toggles
7. Workflow: Submitted leave must pass through chain with FORWARD at intermediate roles

**JSON Output (for CI/CD):**
```bash
pnpm policy:audit --json > audit-report.json
```

**Output Format:**
```json
{
  "passed": true,
  "checks": [
    { "name": "el_accrual", "status": "pass", "details": "..." },
    { "name": "cl_spell_limit", "status": "pass", "details": "..." },
    ...
  ],
  "timestamp": "2025-01-XX..."
}
```

---

## Playwright E2E Tests

### Running Tests

```bash
pnpm test:e2e
```

### Test Scenarios

#### Happy Path: Forward Chain
1. Employee applies for CL (3 days)
2. HR Admin forwards to Dept Head
3. Dept Head forwards to HR Head
4. HR Head approves
5. Leave status becomes APPROVED

**Test File:** `tests/e2e/leave-workflow.spec.ts`

#### Policy Block: CL 4-Day Spell
1. Employee attempts to apply CL for 4 consecutive days
2. System blocks with error: `cl_exceeds_consecutive_limit`
3. Request is not created

**Test File:** `tests/e2e/leave-workflow.spec.ts`

---

## Demo Walkthrough

### 1. Employee View
- Navigate to `/dashboard`
- Click "Apply for Leave"
- Select CL, 3 days
- Submit → See warning if <5 days notice
- View in "My Requests" → Status: PENDING

### 2. HR Admin Triage
- Login as HR_ADMIN
- Navigate to `/approvals`
- See pending request
- Click "Forward" → Selects DEPT_HEAD
- Request moves to next stage

### 3. Dept Head Review
- Login as DEPT_HEAD
- Navigate to `/approvals`
- See forwarded request
- Click "Forward" → Selects HR_HEAD
- Request moves to approval stage

### 4. HR Head Approval
- Login as HR_HEAD
- Navigate to `/approvals`
- See forwarded request
- Click "Approve" → Status: APPROVED
- Check audit log: Shows full chain

### 5. Policy Enforcement Demo
- Try CL 4-day spell → Blocked
- Try CL touching holiday → Blocked with suggestion
- Try ML >3 days without cert → Blocked
- Try CL >10 days/year → Blocked (annual cap)

### 6. EL Backdate Conflict Banner
- Navigate to `/admin/audit`
- See amber banner: "Policy Toggle Active: EL backdate = ask"
- Message: "Source notes conflict. Confirm with HR before go-live."

---

## Screenshots / GIF Instructions

### Forward Chain Demonstration
1. Record screen showing:
   - Employee submits CL request
   - HR Admin dashboard showing pending request
   - HR Admin clicking "Forward" button
   - Dept Head dashboard showing forwarded request
   - Dept Head clicking "Forward" button
   - HR Head dashboard showing forwarded request
   - HR Head clicking "Approve" button
   - Final status: APPROVED
   - Audit log showing full chain

### Policy Block Demonstration
1. Record screen showing:
   - Employee attempts CL 4-day spell
   - Error message: "CL cannot exceed 3 consecutive days"
   - Request blocked

### Role-Based Views
1. Record screen showing:
   - HR Admin viewing employee detail (no personal balances widget)
   - CEO viewing employee detail (executive view)
   - Employee viewing own detail (with balances)

---

## Key Features Demonstrated

✅ **FloatingDock** appears immediately after login (no refresh needed)
✅ **Role-aware views** prevent employee self-widgets for admin views
✅ **RBAC filtering** shows only allowed roles in directory
✅ **Edit flow** with Save/Discard sticky footer + audit logging
✅ **Policy enforcement** with hard blocks and soft warnings
✅ **Forward chain** with intermediate roles forwarding only
✅ **Audit logging** for all transitions
✅ **EL backdate conflict** banner in audit page

---

## Database Migrations

After code changes, run:

```bash
pnpm db:migrate
```

**New Migrations:**
1. `OrgSettings` model
2. `Approval.decision` enum (APPROVED | REJECTED | FORWARDED | PENDING)
3. `Approval.toRole` field

**Seed Data:**
- Default `orgSettings` with EL="ask", CL=false, ML=true
- System audit log entry for EL backdate conflict

---

## Troubleshooting

### FloatingDock Not Appearing
- Check `/api/auth/me` endpoint returns user
- Verify SWR fetching on mount
- Check browser console for errors

### Policy Validation Errors
- Verify `orgSettings` are initialized: `pnpm db:seed` (if seed script updated)
- Check `lib/policy.ts` constants match requirements
- Verify holidays table has data for CL holiday checks

### Forward Chain Not Working
- Verify user roles match `APPROVAL_CHAIN` in `lib/workflow.ts`
- Check `Approval.decision` enum includes FORWARDED
- Verify API routes return correct status codes

---

## Support

For issues or questions, refer to:
- Policy documentation: `docs/LeavePolicy_CDBL.md`
- API contracts: `docs/API_Contracts.md`
- Workflow spec: `docs/Workflow_Spec.md`

