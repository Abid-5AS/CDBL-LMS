CDBL Leave Policy — System Summary
==================================

Source: HR Policy & Procedures Manual (pages 32–41) and provided form.  
System of record: MongoDB `leaves` collection via Mongoose `Leave` model / `LeaveSchema` (`models/leave.ts`).

1) Working Hours, Attendance & Context
--------------------------------------
- Office hours: 9am–5pm, Sun–Thu; lunch/prayer 1–2pm; may vary (Mgmt).
- Attendance: biometric; failure to register is absence requiring explanation (6.2).
- On-call/extra hours: handled outside LMS (policy 6.5); not in scope for leave.

2) Leave Principles
-------------------
- Leave is not a right (6.8). Management may refuse/shorten for service needs.
- Weekends/holidays inside a leave period count as leave (per company direction).
- Overstay beyond approval requires explanation and may affect pay/discipline (6.13).
- Recall from leave possible; duty resumes from date of travel (6.9).
- Return to duty on expiry/shorten/extend; ML requires fitness certificate to return unless waived for ≤7 days total ML (6.14).

3) Leave Types & Core Rules (enforced where feasible)
----------------------------------------------------

| Type                         | Annual/Limit                                        | Carry Forward | Key Rules (system-enforced unless noted)                                                                 |
|------------------------------|----------------------------------------------------|---------------|-----------------------------------------------------------------------------------------------------------|
| Earned Leave (EL)            | Accrues 2 working days / month while on duty; max 60 days carried; excess credited up to 180 days as special leave (6.19) | Yes, to 60    | System accrual job; balance check; encashment/credit handling is out-of-scope for MVP (manual).           |
| Casual Leave (CL)            | 10 working days/year; ≤3 consecutive at a time; only within calendar year; lapses Dec 31 (6.20) | No            | Enforce annual cap, consecutive cap, year scope, auto-lapse.                                             |
| Medical Leave (ML)           | Max 14 working days/year; no carry forward (6.21)   | No            | If ML > 3 days in a single request → medical certificate required with prescription (6.21b); management may extend up to 30 days with recommendation (manual override). |
| Extraordinary Leave w/ pay   | Up to 12 months (rare)                              | N/A           | Admin-only grant; not auto-approved.                                                                      |
| Extraordinary Leave w/o pay  | Up to 6 months if <5 yrs service; up to 12 months otherwise (6.22b) | N/A        | Admin-only; excludes other leave availability.                                                            |
| Maternity Leave              | 8 weeks full pay (6.23a); other conditions apply    | N/A           | Admin-only validation for eligibility.                                                                    |
| Paternity Leave              | 6 working days, ≤2 occasions in career; ≥36 months between occasions (6.24) | N/A       | Eligibility check against past records.                                                                   |
| Study Leave                  | ≤1 year (unpaid), eligibility: ≥3 yrs continuous service; and payback rules (6.25) | N/A   | Admin flow.                                                                                               |
| Special Disability Leave     | As per Board; ≤6 months; can be combined; counts as duty for gratuity (6.27) | N/A       | Board/Admin flow.                                                                                         |
| Quarantine Leave             | ≤21 days (exceptionally 30); certificate from Medical/Public Health Officer (6.28) | N/A   | Certificate attachment required; excess becomes EL/ML per rules.                                          |

4) Application Timing & Documents
---------------------------------
- All leave except Sick/ML: submit ≥5 working days ahead; HRD via Dept Head (6.11a).
- Sick/ML: may be submitted on day of rejoining (6.11a, Sick exception).
- ML > 3 days: medical certificate & prescription required (6.21b).
- Copy of approved applications retained by HRD (6.12f).

5) Approval Hierarchy (Standard)
--------------------------------
1. HR Admin – process validation, due/available/balance check (form “Processed by”).
2. Department Head – functional approval.
3. Department of HR & Admin (senior HR) – verification.
4. CEO/MD – final approval (per form; policy 6.11b “as per delegation”).

The system supports role-aware routing and allows per-department overrides.

6) System Enforcement Matrix (high level)
-----------------------------------------
- Date rules: Start ≤ End, duration auto-counts calendar days (incl. weekends/holidays).
- Balance checks: CL/ML annual caps; EL against accrued balance.
- ML certificate required when type=ML and workingDays > 3.
- Anti-abuse: block CL > 3 consecutive; CL total > 10 in year; ML total > 14 in year.
- Quarantine requires medical/public health certificate.
- Attachments optional except the cases above.
