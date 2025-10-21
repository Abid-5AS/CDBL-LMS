Clause → System Behavior → Enforcement
======================================

Model reference: `Leave` (Mongoose), collection `leaves`.  
Roles: `employee`, `dept_head`, `hr_admin`, `hr_head`, `ceo`.

Submission & Timing
-------------------
- **6.11a (5-day notice except sick)**  
  *Behavior*: UI warns and blocks submit if `type !== "ML"` and `startDate < today + 5 working days`.  
  *Enforcement*: Hard block with override toggle for `hr_admin`.
- **ML same-day submission on rejoin**  
  *Behavior*: Allow ML after return; UI label explains exception.  
  *Enforcement*: Allowed; still checks certificate if >3 days.

Duration Counting
-----------------
- **Weekends/holidays count as leave (company directive)**  
  *Behavior*: Working-day field = calendar-day count inclusive.  
  *Enforcement*: Hard enforced; no skipping weekends/holidays.

Type-Specific Rules
-------------------
- **CL: 10 days/year, ≤3 consecutive (6.20)**  
  Hard enforce cap and consecutive limit; auto-lapse Dec 31 (nightly job).
- **EL: accrual 2 days/month, carry ≤60 (6.19)**  
  Accrual job; requests blocked if balance < requested days. Excess credit to special leave is manual.
- **ML: 14 days/year; >3 days needs certificate (6.21)**  
  Hard enforce annual cap; require attachment flag when days > 3.
- **Paternity: 6 days; max twice; 36-month gap (6.24)**  
  Hard enforce by counting prior approved paternity leaves.
- **Quarantine: up to 21 (30 exceptional) + certificate (6.28)**  
  Hard enforce certificate; >21 needs `hr_head` override up to 30.

Approval Flow
-------------
- **Form & policy (6.11b, form footer)**  
  Route: `hr_admin` → `dept_head` → `hr_head` → `ceo`.  
  System prevents skipping steps; delegations configurable per department.

Return/Fitness
--------------
- **6.14c (fitness to resume after ML)**  
  On “Return to Duty” record, require fitness certificate unless total ML ≤ 7 (waivable). Admin can mark “waived”.

Overstay
--------
- **6.13**  
  If employee’s actual return date > approved end: create “Overstay” marker; block future leave until regularized by HR.

Data Retention
--------------
- **6.12f**  
  All final approvals retained; exportable PDF.
