# CDBL Leave Management - Spoken Demo Script (1 Page)

**Duration:** 12-15 minutes | **Audience:** HR Stakeholders & Management

---

## 🎤 Opening (30 seconds)

> "Today I'll demonstrate our Leave Management System, which automatically enforces CDBL HR policies and provides role-based access. The system ensures compliance while streamlining approvals through a clear workflow chain."

---

## 👤 Employee Flow (3 minutes)

**LOGIN:** `employee1@demo.local` / `demo123`

> "Notice the FloatingDock appears immediately—no refresh needed. The system knows the employee's role and shows relevant navigation."

**APPLY LEAVE - Scenario 1: Valid CL**
- Select Casual Leave, 3 days, 6 days ahead
- Submit → "The system shows a soft warning for advance notice but allows submission—management can still reject."

**APPLY LEAVE - Scenario 2: Policy Block**
- Try CL 4 days → **"This is blocked. Our policy limits CL to 3 days per spell, and the system enforces this automatically."**

**APPLY LEAVE - Scenario 3: Holiday Rule**
- Try CL touching a holiday → **"Also blocked. CL cannot be adjacent to holidays—this prevents policy violations."**

---

## 👔 HR Admin Triage (2 minutes)

**LOGIN:** `hradmin@demo.local` / `demo123`

> "HR Admin sees the triage view. Notice the Employee Directory shows only Employees and Department Heads—role-based filtering ensures they only see what they should manage."

**VIEW EMPLOYEE DETAIL:**
- Click Employee One → **"See the difference? No personal widgets like 'Customize Layout'—this is an admin view with only relevant information."**

**FORWARD REQUEST:**
- Navigate to Approvals → Click "Forward" → **"HR Admin forwards to the next role. They cannot approve directly—this enforces our approval chain."**

---

## 🎯 Department Head Review (1.5 minutes)

**LOGIN:** `manager@demo.local` / `demo123`

> "Department Heads see only their team members—department-based filtering. They're in Engineering, so they only see Engineering employees."

**FORWARD TO HR HEAD:**
- Approvals → Click "Forward" → **"Same pattern—they forward, they don't approve. This ensures proper escalation."**

---

## 👑 HR Head Approval (2 minutes)

**LOGIN:** `hrhead@demo.local` / `demo123`

> "HR Head can approve or reject. Notice the ControlCenter—no personal leave balances shown, as this is an executive view focused on organizational data."

**APPROVE REQUEST:**
- Approvals → Click "Approve" → **"HR Head makes the decision. This completes the workflow, or they can forward to CEO if needed for final approval."**

---

## 📊 Audit & Compliance (2 minutes)

**NAVIGATE:** `/admin/audit`

> **"Every action is logged. Notice this banner at the top—we've flagged an EL backdate policy conflict that needs HR confirmation before go-live."**

**SCROLL AUDIT LOG:**
- Point to LEAVE_FORWARD entries → **"We can see the full chain: HR Admin forwarded to Dept Head, Dept Head forwarded to HR Head, HR Head approved. Complete audit trail."**

**RUN POLICY AUDIT:**
- Terminal → `pnpm policy:audit` → **"This automated script validates all policy rules. All critical checks pass. The warnings are expected—one for the EL backdate toggle that needs confirmation, and one because we haven't generated test forward chains yet. Overall: PASSED."**

---

## ✏️ Edit Employee (1 minute)

**HR Admin → Employee Detail → Edit**

> "The edit form has a sticky footer that appears when you make changes—prevents accidental data loss. When saved, all changes are logged to the audit trail with details of what changed."

**DEMONSTRATE:** Make a change, show sticky footer, save → **"Changes logged as EMPLOYEE_EDIT with field-level tracking."**

---

## 🏢 CEO Executive View (1 minute)

**LOGIN:** `ceo@demo.local` / `demo123`

> "CEO sees the full organizational view. Notice: no personal leave balances in the ControlCenter—executives see organizational metrics, not individual data."

**VIEW EMPLOYEE DIRECTORY:**
- Navigate to `/employees` → **"CEO can see everyone, including HR roles. Full visibility for executive oversight."**

---

## 🎯 Closing (30 seconds)

> "To summarize: The system automatically enforces all CDBL HR leave policies. Every action is audited. Role-based access ensures security. The approval workflow enforces proper escalation. And we have automated compliance validation.

**One outstanding item:** HR needs to confirm the EL backdate policy toggle setting, which we've flagged in the audit page.

The system is production-ready and compliant with our documented policies."

---

## 🚨 Quick Troubleshooting Notes

**If FloatingDock missing:** Hard refresh (Cmd+Shift+R) or check console.

**If policy blocks fail:** Verify orgSettings table exists (run migration).

**If forward fails:** Check Approval.decision enum includes FORWARDED.

---

## ✅ Demo Checklist

- [ ] Test logins for all 5 roles
- [ ] Verify FloatingDock appears on first login
- [ ] Test CL policy blocks (4-day spell, holiday touch)
- [ ] Test forward chain (HR Admin → Dept Head → HR Head)
- [ ] Verify audit log entries
- [ ] Run policy audit script
- [ ] Show EL backdate banner
- [ ] Test employee edit with sticky footer
- [ ] Verify role-based directory filtering

---

**Key Message:** *"Automated policy enforcement + Complete audit trail + Role-based security = Production-ready compliance."*

