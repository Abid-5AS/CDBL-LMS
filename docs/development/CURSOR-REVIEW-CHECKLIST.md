# CDBL Leave Management - Cursor Review Checklist

**Purpose:** Automated verification checklist for demo readiness  
**Usage:** Run through each item and verify before demo presentation

---

## ✅ Database & Migration Status

- [ ] `OrgSettings` table exists in database
- [ ] `Approval.decision` enum includes `FORWARDED`, `APPROVED`, `REJECTED`, `PENDING`
- [ ] `Approval.toRole` field exists and is nullable
- [ ] All migrations applied successfully
- [ ] Seed script runs without errors

**Verification Commands:**
```bash
npx prisma studio  # Check OrgSettings table
npx prisma migrate status  # Verify migrations
pnpm prisma:seed  # Run seed
```

---

## ✅ Demo Data Seeded

- [ ] 8 demo users created:
  - [ ] Employee One (Engineering)
  - [ ] Employee Two (Operations)
  - [ ] Employee Three (Engineering)
  - [ ] Employee Four (Engineering)
  - [ ] Dept Head (Engineering)
  - [ ] HR Admin
  - [ ] HR Head
  - [ ] CEO
- [ ] All passwords set to `demo123`
- [ ] 5 leave requests created with different statuses:
  - [ ] PENDING (forwarded to Dept Head)
  - [ ] APPROVED (full chain: HR Admin → Dept Head → HR Head → CEO)
  - [ ] REJECTED (missing medical certificate)
  - [ ] PENDING (forwarded to Dept Head)
  - [ ] CANCELLED
- [ ] Approval records created with FORWARDED decisions
- [ ] Audit logs created for key actions
- [ ] Holidays seeded for 2025
- [ ] OrgSettings initialized with backdate toggles

**Verification:**
```bash
pnpm prisma:seed
# Check output for "✅ Seeded leave requests"
```

---

## ✅ FloatingDock Hydration

- [ ] FloatingDock appears immediately after login (no refresh)
- [ ] `UserProvider` in `lib/user-context.tsx` sets `status = "ready"` after `/api/auth/me` resolves
- [ ] `FloatingDock` component checks `status !== "ready"` before rendering
- [ ] Login form uses `window.location.assign()` for hard navigation

**Test:**
1. Clear browser cache
2. Login as `employee1@demo.local`
3. Verify FloatingDock appears without page refresh

---

## ✅ RBAC & Page Access

- [ ] **Employee** can access:
  - [ ] `/dashboard` ✅
  - [ ] `/leaves` ✅
  - [ ] `/leaves/apply` ✅
  - [ ] `/policies` ✅
  - [ ] `/holidays` ✅
- [ ] **Employee** cannot access:
  - [ ] `/admin` (redirects)
  - [ ] `/approvals` (if role doesn't allow)
- [ ] **Dept Head** can access:
  - [ ] `/manager/dashboard` ✅
  - [ ] `/approvals` ✅
  - [ ] `/employees` (only own department) ✅
- [ ] **HR Admin** can access:
  - [ ] `/admin` ✅
  - [ ] `/employees` (EMPLOYEE, DEPT_HEAD only) ✅
  - [ ] `/approvals` ✅
  - [ ] `/admin/audit` ✅
- [ ] **HR Head** can access:
  - [ ] `/hr-head/dashboard` ✅
  - [ ] `/admin` ✅
  - [ ] `/approvals` ✅
  - [ ] `/admin/audit` ✅
- [ ] **CEO** can access:
  - [ ] `/ceo/dashboard` ✅
  - [ ] `/admin` ✅
  - [ ] `/admin/audit` ✅
  - [ ] `/employees` (all roles) ✅

**Test:** Login as each role and verify page access/redirects.

---

## ✅ Policy Enforcement

### Hard Blocks (Prevent Submission)

- [ ] **EL Carry Cap**: Blocks if exceeds 60 days ✅
- [ ] **CL Consecutive Days**: Blocks if >3 days ✅
- [ ] **CL Annual Cap**: Blocks if >10 days/year ✅
- [ ] **CL Holiday Adjacency**: Blocks if touching holidays/weekends ✅
- [ ] **ML Certificate**: Blocks if >3 days without certificate ✅
- [ ] **EL Advance Notice**: Blocks if <15 days notice ✅

### Soft Warnings (Allow Submit)

- [ ] **CL Advance Notice**: Shows warning if <5 working days (allows submit) ✅

### Backdate Rules

- [ ] **EL Backdate**: Uses `orgSettings.allowBackdate.EL` (should be "ask")
- [ ] **CL Backdate**: Hard blocks (CL=false)
- [ ] **ML Backdate**: Allows (ML=true)
- [ ] Backdate window: Max 30 days ✅

**Test:** Try applying leaves that violate each rule and verify behavior.

---

## ✅ Approval Workflow

- [ ] **HR Admin** can only FORWARD (not approve/reject) ✅
- [ ] **Dept Head** can only FORWARD (not approve/reject) ✅
- [ ] **HR Head** can APPROVE, REJECT, or FORWARD to CEO ✅
- [ ] **CEO** can APPROVE or REJECT (final decision) ✅
- [ ] Forward chain: HR Admin → Dept Head → HR Head → CEO ✅
- [ ] Each forward creates `Approval` record with `FORWARDED` decision ✅
- [ ] Each approval creates audit log entry ✅
- [ ] Status updates correctly: SUBMITTED → PENDING → APPROVED/REJECTED ✅

**Test:**
1. Create leave as Employee
2. Login as HR Admin → Forward
3. Login as Dept Head → Forward
4. Login as HR Head → Approve
5. Verify audit log shows full chain

---

## ✅ UI Consistency

- [ ] No "Customize Layout" buttons on employee detail pages for admin views ✅
- [ ] TopNavBar titles match every page ✅
- [ ] FloatingDock uses `getNavItemsForRole(role)` correctly ✅
- [ ] ControlCenter:
  - [ ] Shows role badge ✅
  - [ ] Shows leave balances for Employee/Dept Head/HR Admin ✅
  - [ ] Hides leave balances for HR Head/CEO ✅
- [ ] Employee edit form:
  - [ ] Shows sticky footer when dirty ✅
  - [ ] Has "Save" and "Discard" buttons ✅
  - [ ] Creates audit log on save ✅

**Test:** View employee detail as HR Admin/CEO and verify no personal widgets.

---

## ✅ Audit & Compliance

- [ ] `/admin/audit` page shows EL backdate banner ✅
- [ ] Banner displays: "Policy Toggle Active: EL backdate = ask"
- [ ] Audit log entries created for:
  - [ ] `LEAVE_FORWARD` ✅
  - [ ] `LEAVE_APPROVE` ✅
  - [ ] `LEAVE_REJECT` ✅
  - [ ] `EMPLOYEE_EDIT` ✅
- [ ] Audit entries include:
  - [ ] `actorEmail` ✅
  - [ ] `targetEmail` ✅
  - [ ] `details` with `actorRole`, `toRole`, `step` ✅
  - [ ] `createdAt` timestamp ✅

**Test:** Navigate to `/admin/audit` and verify banner + recent logs.

---

## ✅ Policy Audit Script

- [ ] Script runs: `pnpm policy:audit` ✅
- [ ] Returns exit code 0 (no failures) ✅
- [ ] All critical checks pass:
  - [ ] `el_accrual` ✅
  - [ ] `cl_spell_limit` ✅
  - [ ] `cl_annual_cap` ✅
  - [ ] `ml_certificate` ✅
- [ ] Expected warnings:
  - [ ] `backdate_settings` (EL=ask) ⚠️
  - [ ] `workflow_chain` (no test data) ⚠️
- [ ] JSON output available: `pnpm policy:audit --json` ✅

**Test:**
```bash
pnpm policy:audit
pnpm policy:audit --json
```

---

## ✅ Logout Functionality

- [ ] Logout button calls `/api/logout` POST ✅
- [ ] Uses `window.location.assign("/login")` for hard navigation ✅
- [ ] Session cleared on logout ✅

**Test:** Logout from any role and verify redirect.

---

## ✅ Documentation

- [ ] `README-DEMO.md` exists with:
  - [ ] Role matrix ✅
  - [ ] Policy rules ✅
  - [ ] Test credentials ✅
  - [ ] Troubleshooting guide ✅
- [ ] `DEMO-RUN-SHEET.md` exists with step-by-step walkthrough ✅
- [ ] `DEMO-SPOKEN-SCRIPT.md` exists with condensed script ✅
- [ ] All credentials documented: `demo123` for all users ✅

---

## ✅ Final Verification

- [ ] No TypeScript errors: `pnpm build` ✅
- [ ] No hydration warnings in browser console ✅
- [ ] No console errors during normal operation ✅
- [ ] All API routes return expected status codes ✅
- [ ] Database connection stable ✅

**Test:**
```bash
pnpm build  # Should complete without errors
pnpm dev    # Start dev server, check console
```

---

## 📋 Demo Readiness Summary

**Status:** [ ] Ready [ ] Not Ready

**Outstanding Issues:**
1. _________________________________
2. _________________________________
3. _________________________________

**Notes:**
- Migration status: _________________
- Seed status: _________________
- Policy audit: _________________

---

**Generated:** `date`  
**System:** CDBL Leave Management v1.1  
**Compliance:** Validated against official CDBL HR Leave Policy

