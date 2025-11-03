# Test Plan (MVP)

Unit (Zod/validators):
- CL: 3-day consecutive limit; 10-day annual cap; Dec 31 lapse.
- ML: >3 requires medical docs; 14-day annual cap.
- EL: balance block; accrual math (2/month); carry <= 60.
- QUAR: cert required; 21/30-day cap + override.

API (integration):
- POST /api/leaves: happy paths for EL/CL/ML; negative cases for each rule.
- Approval chain: 4-step workflow (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO).
- HR_ADMIN and DEPT_HEAD can forward; HR_HEAD and CEO can approve/reject.
- Cancel restores balance (if previously approved); reject keeps balance.
- Return-to-duty for ML with and without fitness certificate (future feature).

E2E (Playwright):
- Employee submits CL (2 days) -> HR Admin forwards -> Dept Head forwards -> HR Head approves -> visible in dashboard.
- ML (5 days) without certificate -> blocked; with certificate -> allowed.
- Quarantine with certificate -> HR Admin override to 25 days.
- Overstay scenario -> block new request until HR regularizes (future feature).
