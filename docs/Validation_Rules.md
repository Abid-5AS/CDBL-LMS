# Validation Rules

## Request Validation (v1.1)
1) Balances
   - Calculate available = opening + accrued - used.
   - Reject if requestedDays > available for the selected type (after EL carry-forward cap).
2) Backdate rules
   - EARNED, MEDICAL: backdate allowed ≤ 30 days from apply date → start date.
   - CASUAL: backdate disallowed; start date must be ≥ apply date.
3) Notice
   - CASUAL submitted < 5 days before start → accept but emit warning & flag (`clShortNotice`).
4) Medical certificate
   - MEDICAL requests with requestedDays > 3 must include `hasMedicalCertificate`; otherwise 400.
5) Consecutive CL
   - Reject CASUAL if requestedDays > 3 consecutive days.
6) Weekends/holidays
   - All spans count weekends/holidays via inclusive date calculation.
7) Cancellation (unchanged)
   - Employees may cancel only while status == PENDING; cancellation logs audit trail.
