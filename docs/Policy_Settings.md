Admin “Knobs & Tweaks”
======================

To allow policy changes without redeploys, expose these in an Admin → Policy Settings page (stored in a `policy_settings` collection):

```
{
  year: 2025,
  weekendsCountAsLeave: true,
  require5DayNoticeExceptML: true,
  cl: { annualCap: 10, consecutiveCap: 3, lapsesEndOfYear: true },
  ml: { annualCap: 14, certificateThresholdDays: 3 },
  el: { monthlyAccrual: 2, maxCarry: 60 },
  quarantine: { standardCap: 21, exceptionalCap: 30, requireCertificate: true },
  paternity: { days: 6, maxOccasions: 2, minMonthsBetween: 36 },
  approvalsFlow: ['HR_ADMIN','DEPT_HEAD','HR_SENIOR','CEO'] // per dept override possible
}
```
