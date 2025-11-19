# CDBL Leave Management System - User Credentials Documentation

**Last Updated:** November 16, 2025  
**System:** CDBL Leave Management System (LMS)  
**Environment:** Development/Demo

---

## 🔐 Default Password for All Demo Users

```
demo123
```

---

## 👥 User Accounts by Role

### 1️⃣ System Administrators

| Name                 | Email                        | Password  | Employee Code | Department |
| -------------------- | ---------------------------- | --------- | ------------- | ---------- |
| System Administrator | `sysadmin@cdbl.local`        | `demo123` | SYS001        | IT         |
| Abid Shahriar        | `abidshahriar@iut-dhaka.edu` | `demo123` | SYS-002       | IT         |

**Permissions:** Full system access, user management, policy configuration, audit logs

---

### 2️⃣ Executive Level

| Name    | Email            | Password  | Employee Code | Department |
| ------- | ---------------- | --------- | ------------- | ---------- |
| CEO One | `ceo@demo.local` | `demo123` | CEO001        | Executive  |

**Permissions:** View all reports, final approval authority, admin console access

---

### 3️⃣ HR Leadership

| Name     | Email                | Password  | Employee Code | Department |
| -------- | -------------------- | --------- | ------------- | ---------- |
| HR Head  | `hrhead@demo.local`  | `demo123` | HRH001        | HR         |
| HR Admin | `hradmin@demo.local` | `demo123` | HRA01         | HR         |

**Permissions:**

- **HR Head:** Approve leaves, view all employee data, manage audit logs
- **HR Admin:** Process leave requests, manage employees, configure holidays

---

### 4️⃣ Department Heads

| Name               | Email                         | Password  | Employee Code | Department |
| ------------------ | ----------------------------- | --------- | ------------- | ---------- |
| IT Department Head | `manager@demo.local`          | `demo123` | ITDH01        | IT         |
| HR Operations Lead | `depthead.hr@cdbl.local`      | `demo123` | HRDH01        | HR         |
| Finance Controller | `depthead.finance@cdbl.local` | `demo123` | FINDH01       | Finance    |

**Permissions:** Approve team member leave requests, view department reports

---

### 5️⃣ Employees

#### **Featured Employees**

| Name           | Email                  | Password  | Employee Code | Department |
| -------------- | ---------------------- | --------- | ------------- | ---------- |
| Employee One   | `employee1@demo.local` | `demo123` | IT001         | IT         |
| Employee Two   | `employee2@demo.local` | `demo123` | FIN001        | Finance    |
| Employee Three | `employee3@demo.local` | `demo123` | HR001         | HR         |
| Employee Four  | `employee4@demo.local` | `demo123` | FIN002        | Finance    |

#### **Additional Generated Employees**

The system auto-generates additional employee accounts following this pattern:

**IT Department:**

- `it.employee01@cdbl.local` to `it.employee08@cdbl.local` (Employee Codes: IT002-IT008)
- All password: `demo123`

**HR Department:**

- `hr.employee01@cdbl.local` to `hr.employee08@cdbl.local` (Employee Codes: HR002-HR008)
- All password: `demo123`

**Finance Department:**

- `finance.employee01@cdbl.local` to `finance.employee08@cdbl.local` (Employee Codes: FIN003-FIN008)
- All password: `demo123`

**Permissions:** Submit leave requests, view personal leave balance, access policies/FAQ

---

## 📋 Leave Balance Information

All employees have been provisioned with the following annual leave balances for the current year:

| Leave Type         | Accrued Days | Typical Usage     |
| ------------------ | ------------ | ----------------- |
| Earned Leave (EL)  | 24 days      | 2-8 days (varies) |
| Casual Leave (CL)  | 10 days      | 2-6 days (varies) |
| Medical Leave (ML) | 14 days      | 1-4 days (varies) |

**Note:** Non-management roles (SYSTEM_ADMIN, CEO, HR_HEAD, HR_ADMIN, DEPT_HEAD) have **zero used days** to reflect administrative positions.

---

## 🏢 Organization Structure

```
CEO (ceo@demo.local)
├── HR Head (hrhead@demo.local)
│   ├── HR Admin (hradmin@demo.local)
│   └── HR Department Head (depthead.hr@cdbl.local)
│       ├── Employee Three (employee3@demo.local)
│       └── Additional HR Employees (7)
│
├── IT Department Head (manager@demo.local)
│   ├── Employee One (employee1@demo.local)
│   └── Additional IT Employees (7)
│
└── Finance Department Head (depthead.finance@cdbl.local)
    ├── Employee Two (employee2@demo.local)
    ├── Employee Four (employee4@demo.local)
    └── Additional Finance Employees (6)

System Administrators:
├── System Administrator (sysadmin@cdbl.local)
└── Abid Shahriar (abidshahriar@iut-dhaka.edu)
```

---

## 📝 Leave Approval Workflow

All leave requests follow this approval chain:

```
Employee Submits Request
    ↓
HR Admin Reviews
    ↓
Department Head Reviews
    ↓
HR Head Reviews
    ↓
CEO Final Approval
    ↓
Approved / Rejected / Returned for Clarification
```

---

## 🔄 Sample Leave Data

The system is seeded with realistic leave request data:

- **Total Leave Requests:** ~240-360 (varies per run)
- **Currently On Leave:** ~8 employees
- **Approved:** ~55%
- **Pending:** ~20%
- **Submitted:** ~8%
- **Rejected:** ~7%
- **Returned for Clarification:** ~5%
- **Cancellation Requested:** ~2%
- **Cancelled:** ~3%

---

## 🎉 Holidays (2025-2026)

The system includes major Bangladesh holidays:

- New Year's Day (Jan 1)
- Shaheed Day & International Mother Language Day (Feb 21)
- Bangabandhu's Birthday (Mar 17)
- Independence & National Day (Mar 26)
- Bengali New Year (Apr 14)
- May Day (May 1)
- Eid-ul-Fitr (Apr 9-11, 2025)
- Eid-ul-Azha (Jun 16-17, 2025)
- Bank Holiday (Jul 1)
- National Mourning Day (Aug 15)
- Durga Puja (Oct 2)
- Eid-e-Milad-un-Nabi (Oct 12)
- Victory Day (Dec 16)
- Christmas Day (Dec 25)

---

## ⚙️ Technical Details

### Password Hash Algorithm

- **Method:** bcryptjs
- **Cost Factor:** 10
- **All Demo Passwords:** Hashed version of `demo123`

### Employee Code Format

- **System Admin:** `SYS001`, `SYS-002`
- **CEO:** `CEO001`
- **HR Head:** `HRH001`
- **HR Admin:** `HRA01`, `HRA02`, etc.
- **Dept Heads:** `{DEPT}DH01`, `{DEPT}DH02`, etc. (e.g., `ITDH01`, `HRDH01`)
- **Employees:** `{DEPT}{SEQ}` (e.g., `IT001`, `HR001`, `FIN001`)

### Department Codes

- **IT:** Information Technology
- **HR:** Human Resources
- **Finance:** Finance & Accounts
- **Executive:** C-Suite Level

---

## 🔐 Security Notes

⚠️ **IMPORTANT:** This is a demo/development system only.

- All credentials shown here are for **demo purposes only**
- Never use these credentials in production
- Password `demo123` is intentionally simple for ease of testing
- All data is stored in a development database
- No real sensitive information is contained

---

## 🧪 Testing Scenarios

### Quick Login Tests

1. **HR Admin View:** Login as `hradmin@demo.local` / `demo123`

   - View all pending leaves
   - Process employee requests
   - Access audit logs

2. **Department Head Approval:** Login as `manager@demo.local` / `demo123`

   - View team member requests
   - Approve/Reject leaves
   - Check team leave balance

3. **Employee Self-Service:** Login as `employee1@demo.local` / `demo123`

   - Submit new leave request
   - View personal leave balance
   - Check request history

4. **CEO Dashboard:** Login as `ceo@demo.local` / `demo123`

   - Access executive reports
   - View organization-wide analytics
   - Final approval authority

5. **System Administration:** Login as `sysadmin@cdbl.local` / `demo123`
   - User management
   - Policy configuration
   - System audit logs

---

## 📞 Support Information

- **System Email:** `info@cdbl.local`
- **HR Email:** `hr@cdbl.local`
- **Support Workflow:** Employee → Department Head → HR Admin → HR Head → CEO

---

## 📅 Last Updated

- **Documentation:** November 16, 2025
- **System Version:** Next.js 16.0.0
- **Database:** MySQL with Prisma ORM
- **Seed Version:** v2.0

---

**End of User Credentials Documentation**
