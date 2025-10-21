# Validation Rules (Centralized)

Shared pre-checks:
- startDate/endDate present; startDate <= endDate; days = inclusive calendar days.
- If type !== ML, enforce 5-working-day notice unless HR override.
- Weekends/holidays count toward `days`.

Per type:
- CL: days <= 3; yearTotal(CL)+days <= 10; year scope only.
- ML: yearTotal(ML)+days <= 14; if days > 3 -> require MEDICAL_CERT (+ PRESCRIPTION).
- EL: currentBalance(EL) >= days.
- QUAR: require QUARANTINE_CERT; days <= 21 (<=30 with HR_SENIOR override).
- PAT: remainingOccasions >=1 and monthsSinceLast >= 36; days <= policy.paternity.days.

Balance timing:
- Deduct on final APPROVED; restore on CANCEL before start.
- Auto-lapse CL at year-end; EL accrual monthly (cron/queue).

Overrides:
- Any hard rule may be overridden by HR_SENIOR/SYS_ADMIN with `overrideReason` logged.
