# CDBL Leave Management - Demo Run Sheet

**Duration:** ~15 minutes  
**Audience:** HR stakeholders, management, IT  
**Goal:** Demonstrate compliance, workflow, and role-based access

---

## 🎬 Demo Flow

### Opening (30 seconds)
> "Today I'll demonstrate the CDBL Leave Management System, which enforces our HR policy automatically and provides role-based access for employees, managers, and HR teams."

---

## 1️⃣ Employee Experience (3 minutes)

### Login as Employee
- Navigate to `/login`
- Email: `employee1@demo.local`
- Password: `demo123`

**Demo Points:**
- ✅ FloatingDock appears immediately (no refresh needed)
- ✅ Role-based redirect to `/dashboard`
- ✅ Personal dashboard with leave balances

**Say:** "After login, employees see their dashboard immediately with current leave balances."

### Apply for Leave - Policy Enforcement Demo

**Scenario A: Valid CL Request**
1. Click "Apply for Leave"
2. Select "Casual Leave"
3. Choose dates: 3 days, starting 6 days from today
4. Enter reason
5. Submit

**Expected:** ✅ Soft warning banner (if <5 working days), but allows submission

**Say:** "The system enforces our 5-day advance notice policy with a soft warning—submission is allowed, but management may reject."

**Scenario B: Policy Block - CL 4-Day Spell**
1. Try to apply CL for 4 consecutive days
2. Submit

**Expected:** ❌ Error: "CL cannot exceed 3 consecutive days per spell"

**Say:** "The system hard-blocks requests that violate policy—here, CL exceeds the 3-day maximum."

**Scenario C: CL Touching Holiday**
1. Try to apply CL where start/end date touches a holiday
2. Submit

**Expected:** ❌ Error: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."

**Say:** "Policy enforcement prevents CL from touching holidays, as per our manual."

---

## 2️⃣ HR Admin Triage (2 minutes)

### Login as HR Admin
- Email: `hradmin@demo.local`
- Password: `demo123`

**Demo Points:**
- ✅ Redirects to `/admin` (role-specific)
- ✅ FloatingDock shows HR-specific navigation
- ✅ Employee Directory shows only EMPLOYEE and DEPT_HEAD roles

**Say:** "HR Admin sees a triage view—they can forward requests but cannot approve."

### View Employee Detail
1. Navigate to `/employees`
2. Click on "Employee One"

**Expected:**
- ✅ Admin panels only (no employee self-widgets like "Customize Layout")
- ✅ Leave statistics and recent requests
- ✅ "Update Employee" button (if can edit)

**Say:** "When HR Admin views an employee, they see administrative information only—not the employee's personal dashboard widgets."

### Forward Leave Request
1. Navigate to `/approvals`
2. Find pending request from Employee One
3. Click "Forward" button

**Expected:**
- ✅ Button labeled "Forward" (not "Approve")
- ✅ Request forwarded to Dept Head
- ✅ Toast: "Leave forwarded successfully"

**Say:** "HR Admin forwards to the next role in the chain—they cannot approve directly."

---

## 3️⃣ Dept Head Review (2 minutes)

### Login as Dept Head
- Email: `manager@demo.local`
- Password: `demo123`
- Department: "Engineering"

**Demo Points:**
- ✅ Employee Directory shows only team members (same department)
- ✅ Cannot see HR roles or CEO

**Say:** "Dept Heads see only their team members—department-based filtering."

### Forward to HR Head
1. Navigate to `/approvals`
2. See forwarded request
3. Click "Forward"

**Expected:**
- ✅ Forwarded to HR Head
- ✅ Toast notification

**Say:** "Dept Head also forwards—they cannot approve, only forward in the chain."

---

## 4️⃣ HR Head Approval (2 minutes)

### Login as HR Head
- Email: `hrhead@demo.local`
- Password: `demo123`

**Demo Points:**
- ✅ Can see all employees (except CEO, or CEO read-only)
- ✅ ControlCenter hides personal leave balances
- ✅ Can approve/reject requests

### Approve Leave Request
1. Navigate to `/approvals`
2. Find forwarded request
3. Click "Approve"

**Expected:**
- ✅ Button labeled "Approve" (not "Forward")
- ✅ Status: APPROVED
- ✅ Toast: "Leave approved successfully"

**Say:** "HR Head can approve or reject—they're the first role that can make final decisions, or forward to CEO if needed."

---

## 5️⃣ Audit & Compliance (2 minutes)

### View Audit Log
1. Navigate to `/admin/audit`
2. Scroll through recent activity

**Expected:**
- ✅ EL Backdate Conflict banner at top
- ✅ Audit entries for LEAVE_FORWARD, LEAVE_APPROVE
- ✅ Shows actorRole, toRole, timestamp

**Say:** "Every action is logged for compliance—we can track the full approval chain."

**Point out banner:**
> "Notice this banner: EL backdate toggle is set to 'ask' due to a policy conflict in source notes. We've flagged this for HR confirmation before go-live."

### Run Policy Audit Script
1. Open terminal
2. Run: `pnpm policy:audit`

**Expected:**
```
✅ el_accrual: EL accrual: 2 days/month, max carry: 60
✅ cl_spell_limit: All CL requests ≤ 3 days per spell
✅ cl_annual_cap: All users within CL annual cap of 10 days
✅ ml_certificate: All ML requests >3 days have certificates
⚠️ backdate_settings: EL=ask (requires confirmation)
⚠️ workflow_chain: No FORWARDED approvals found yet (expected for new system)
Overall: ✅ PASSED
```

**Say:** "This automated audit script validates policy compliance. All critical rules pass, with a warning for the EL backdate toggle that needs HR confirmation."

---

## 6️⃣ Edit Employee (1 minute)

### HR Admin Edit Employee
1. Navigate to `/employees/[id]?edit=true`
2. Change department or role
3. Observe sticky footer appears when dirty
4. Click "Save"

**Expected:**
- ✅ Sticky footer: "You have unsaved changes"
- ✅ "Discard" and "Save" buttons
- ✅ Audit log entry: `EMPLOYEE_EDIT` with changedFields

**Say:** "The edit flow includes a sticky footer to prevent accidental data loss, and all changes are audited."

---

## 7️⃣ CEO Executive View (1 minute)

### Login as CEO
- Email: `ceo@demo.local`
- Password: `demo123`

**Demo Points:**
- ✅ Can see all employees (including HR roles)
- ✅ ControlCenter: no personal leave balances shown
- ✅ Executive dashboard with org-wide analytics

**Say:** "CEO sees the full organizational view—no personal leave balances, only executive-level insights."

---

## 🎯 Closing Points (30 seconds)

1. **Policy Compliance:** All HR manual rules enforced automatically
2. **Workflow Integrity:** Forward chain ensures proper escalation
3. **Audit Trail:** Complete logging for compliance
4. **Role-Based Access:** Each role sees only what they need
5. **Demo-Ready:** Fully functional, ready for production after HR confirmation

**Say:** "The system is production-ready, with one outstanding item: HR needs to confirm the EL backdate policy toggle setting."

---

## 📋 Quick Reference: Test Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Employee | `employee1@demo.local` | `demo123` | `/dashboard` |
| Dept Head | `manager@demo.local` | `demo123` | `/manager/dashboard` |
| HR Admin | `hradmin@demo.local` | `demo123` | `/admin` |
| HR Head | `hrhead@demo.local` | `demo123` | `/hr-head/dashboard` |
| CEO | `ceo@demo.local` | `demo123` | `/ceo/dashboard` |

---

## 🚨 Troubleshooting During Demo

**If FloatingDock doesn't appear:**
- Check browser console for errors
- Verify `/api/auth/me` returns user
- Try hard refresh (Cmd+Shift+R)

**If policy blocks don't work:**
- Verify orgSettings initialized: Check `/admin/audit` for banner
- Check database: `OrgSettings` table exists

**If forward chain fails:**
- Verify Prisma migration ran
- Check `Approval.decision` enum includes `FORWARDED`

---

## 📸 Key Screenshots to Capture

1. Employee dashboard with FloatingDock visible
2. Policy block error (CL 4-day spell)
3. HR Admin viewing employee (no personal widgets)
4. Forward button in approvals (HR Admin view)
5. Audit log showing full chain
6. EL backdate banner in `/admin/audit`
7. Policy audit script output

