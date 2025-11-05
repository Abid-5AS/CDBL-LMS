# LeavePolicy_CDBL_Extracted.md

**Source of Truth — Derived from CDBL HR Policy & Procedures Manual (Chapter 06: Working Hours & Leave Entitlements, pp. 32–41)**
_No external or Bangladesh Labour Act clauses included._

---

## 01 — Working Hours and Attendance

### 6.1 Working Hours

- Normal office hours : **9 AM – 5 PM**, Sunday through Thursday.
- 1 hour break (1 PM – 2 PM) for lunch and prayer.
- May be adjusted during Ramadan or for special situations decided by management.

**System Logic:**
Attendance module should enforce check-in and check-out within these hours and apply configurable exceptions for Ramadan mode or special days.

---

### 6.2 Daily Attendance

- Biometric attendance is mandatory.
- Failure to register attendance = absence from duty unless adequately explained.
- Department Heads/Supervisors are responsible for disciplinary action and notification to HRD.

**System Logic:**
LMS should sync with attendance data to mark unauthorized absence and notify HR Admin.

---

### 6.3 Efficiency, Performance, Absence & Tardiness

- Work must fit within normal hours.
- Promptness is mandatory; late arrival or early exit is tardiness.
- Unscheduled absence hurts workflow and must be reported within 1 hour of start time.
- Failure to report = disciplinary action.

**System Logic:**
Implement alerts for repeated late entries and track “Absence without notification”.

---

### 6.4 Overtime Work

- Permitted for operational needs only.
- Overtime payment = **Hourly pay rate × 2**.
- One-day salary = Gross Salary ÷ 22.
- One-hour salary = (One-day salary) ÷ 8.

**System Logic:**
Optional overtime computation module using these formulas.

---

### 6.5 On-Call Duties

- Extra hours outside normal schedule may be required.
- Allowances: Executive Tk 1,500 / General Staff Tk 700 per event.
- Higher allowance at MD & CEO discretion.

---

### 6.6 Absenteeism Guidelines

- Absence = missing a day or habitual delay/early leave.
- Exceptions: approved leave or emergency approved absence.
- Excessive absence leads to disciplinary action.
- Tardiness examples: ≥ 10–15 min late repeatedly, > 6 instances per 30 days, or after verbal warning.

**System Logic:**
Flag patterns of absence or tardiness and record in employee discipline history.

---

## 02 — Leave Entitlements and Eligibility

### 6.7 Leave Entitlements

- Applies to **permanent employees**.
- Leave year = January 1 – December 31.
- Pro-rata basis for new joiners.
- Contractual employees follow contract terms.

### 6.8 Leave is Not a Right

- Management may refuse or shorten leave for service exigency.
- No absence without prior approval.
- Medical leave requires certificate.
- Unauthorized leave = disciplinary action / possible dismissal.

---

### 6.9 Recall from Leave

- Management may recall an employee before leave expiry.
- Employee is treated as on duty from recall date and entitled to travel allowance.

**System Logic:**
Workflow for “Recall Request” triggered by Manager/HR; recompute unused days.

---

### 6.10 Leave Procedure & Record

a. HRD maintains official leave accounts.
b. First day = next working day after handover; last day = working day before return.
c. All records logged in Leave Register.
d. Applications ( except Casual Leave ) sent through Dept Head → HRD → Management.
e. Extensions also via Dept Head/Supervisor.
f–n. Medical certificate rules, handover of duties, ban on other employment, frequent leave monitoring, tentative EL plan each year, salary withholding for unapproved leave.

**System Logic:**
Workflow must enforce approval chain and support upload of medical certificates, delegation, and leave plans.

---

### 6.11 Application for Leave

- All non-sick leave → submit ≥ 5 working days ahead ( Casual and Quarantine exempt ).
- Sick leave → submit upon return.
- Leave must use prescribed form and include address during leave.
- Unauthorized leave after applying = disciplinary action.

---

### 6.12 Leave Salary

- Full-pay leave = last drawn salary.
- Leave without pay = no salary.
- Unauthorized leave = no salary until regularized.

---

### 6.13 Overstay of Leave

- Overstay without approval = disciplinary offense and possible break in service.
- No pay for overstay period unless approved.

---

### 6.14 Return to Duties after Leave

- Report on expiry or earlier if shortened.
- Medical leave → fitness certificate required unless ≤ 7 days.

**System Logic:**
Auto-prompt for fitness certificate upload on return from medical leave > 7 days.

---

### 6.15 Consideration for Approval

Priority factors when multiple employees apply simultaneously:

- Date of application
- Who can be spared without impact to operations
- Applicant’s leave balance and service importance

**System Logic:**
Approver dashboard can rank requests by these parameters.

---

### 6.16 Lapse of Leave

- All unused leave lapses on termination or resignation except Earned Leave.
- At year-end, unused leave lapses except Earned Leave (max carry-over 60 days).

---

### 6.17 Kinds of Leave

1. Earned Leave (full pay)
2. Casual Leave
3. Medical Leave
4. Extraordinary Leave (with/without pay)
5. Maternity Leave
6. Paternity Leave
7. Study Leave
8. Special Disability Leave
9. Quarantine Leave

---

### 6.18 Eligibility of Various Leaves

| Type                          | Eligibility                                               |
| ----------------------------- | --------------------------------------------------------- |
| Earned                        | After 1 year continuous service; pro-rata for new joiners |
| Casual                        | On joining                                                |
| Medical                       | After 1 year service; pro-rata for new joiners            |
| Extraordinary ( with pay )    | After 3 years service                                     |
| Extraordinary ( without pay ) | After 2 years service                                     |
| Maternity                     | All confirmed female employees                            |
| Paternity                     | All confirmed male employees                              |
| Study                         | After 3 years service                                     |
| Special Disability            | After 3 years service                                     |
| Quarantine                    | All confirmed employees                                   |

---

## 03 — Specific Leave Rules

### 6.19 Earned Leave (EL)

- Granted after 1 year service.
- Accrual: **2 working days per month** = 24 days/year.
- Max accumulation = 60 days.
- Excess up to 180 days → Special Leave category.
- May be refused for service need.
- Encashment > 10 days.
- Full salary during EL.
- Unused EL on death → paid to nominee.

---

### 6.20 Casual Leave (CL)

- For urgent private matters.
- Max 10 days per calendar year.
- Max 3 days per instance.
- Cannot be carried forward or combined with other leaves/holidays.
- Exceeding limit → converted to EL (if due) else Extraordinary Leave (W/P or W/O P).

---

### 6.21 Medical Leave (ML)

- 14 days per year (max).
- No carry-forward.
- > 3 days → medical certificate required.
- Prolonged illness → extension ≤ 30 days with Board approval.
- Extended ML > 14 days adjusted against EL/special leave.
- Management may require medical examination.

---

### 6.22 Extraordinary Leave (with/without pay)

- Max 12 months for special cases.
- With pay → after 3 years service.
- Without pay → after 2 years service.
- ≤ 6 months if service < 5 years.
- May not count towards service tenure (unless decided by management).
- Suspension period may be converted into extraordinary leave.

---

### 6.23 Maternity Leave

- 8 weeks full pay.
- For employees with ≥ 6 months service (pro-rata if < 6 months).
- May be combined with other approved leave at management discretion.

---

### 6.24 Paternity Leave

- 6 working days paid.
- For male employees with ≥ 1 year service.
- Max 2 times in career; interval ≥ 36 months.

---

### 6.25 Study Leave

- Unpaid; ≤ 1 year duration.
- ≥ 3 years service required; not within 5 years of retirement.
- Extension ≤ 1 year if exams not completed.
- Employee must repay loan/advance before leaving.

---

### 6.26 Government Holidays

- Follow Govt. of Bangladesh declared holidays.

---

### 6.27 Special Disability Leave

- For job-related disability/injury.
- Request within 3 months of occurrence.
- Max 6 months per incident.
- Full pay first 3 months, half pay next 3 months.
- Not extendable without Board approval.
- Counts as duty for gratuity.

---

### 6.28 Quarantine Leave

- Granted for infectious disease exposure.
- Max 21 days ( 30 exceptionally ).
- Excess = treated as EL/ML.
- Considered on-duty, not absence.
- Applies for illness types: Cholera, Pox, Jaundice, Plague, Typhoid, Measles, Mumps, Cerebro-spinal issues, Meningitis.

---

### 6.29 Payment of Salary for Unavailed EL

- Unused EL → encashed on termination, resignation, or retirement.

---

## 04 — Salary, Encashment, and Lapse Logic (Summary)

| Aspect            | Rule                       | System Behavior                           |
| ----------------- | -------------------------- | ----------------------------------------- |
| Full-Pay Leave    | EL, CL, ML (within limits) | Paid based on last drawn salary           |
| Leave Without Pay | EOL or unapproved absence  | Mark as zero salary period                |
| Encashment        | EL > 10 days or on exit    | Auto-compute payout based on gross salary |
| Lapse             | At year end ( non-EL )     | Auto reset balances on Jan 1              |
| Overstay          | Without approval           | Mark break in service and deduct pay      |

---

## 05 — Implementation Mapping Notes

| Policy Clause | System Feature                         | Clarification Needed                                                               |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| 6.1 – 6.3     | Attendance integration, lateness rules | Define threshold minutes for late alerts                                           |
| 6.7 – 6.8     | Leave eligibility logic                | Confirm how contractual staff handled                                              |
| 6.10 – 6.11   | Multi-level approval chain             | Verify who approves Casual Leave (bypass HR?)                                      |
| 6.19 – 6.22   | Accrual and encashment calculation     | Need confirmation if Earned Leave rate = 2 days or 1 per 11 days ( spec conflict ) |
| 6.23 – 6.25   | Special leaves                         | Clarify whether study leave counts for service tenure                              |
| 6.27 – 6.28   | Disability and quarantine              | Confirm how system should record half-pay period                                   |
| 6.29          | Exit encashment                        | Confirm whether to include bonus or only basic pay                                 |

---

## 06 — Cross-Reference to Policy Logic Docs

| Internal Doc                                 | Covered Policy Sections | Cross-Check                     |
| -------------------------------------------- | ----------------------- | ------------------------------- |
| 01-Leave Types and Entitlements.md           | 6.7 – 6.18              | Complete match                  |
| 02-Leave Application Rules and Validation.md | 6.10 – 6.15             | Needs Casual Leave bypass logic |
| 03-Holiday and Weekend Handling.md           | 6.26                    | OK                              |
| 04-Leave Balance and Accrual Logic.md        | 6.19 – 6.22             | Check Earned Leave              |
