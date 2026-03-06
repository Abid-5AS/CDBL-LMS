# Balance Maintenance Guide

This document describes how to maintain leave balances, when to run jobs, and the mid-year launch checklist.

## Hybrid System

The system supports three modes of balance maintenance:

1. **Automatic (Cron)** – Runs on schedule (Vercel Cron)
2. **Semi-automatic (Admin trigger)** – Admin runs jobs manually via UI or API
3. **Manual** – CSV import, admin balance adjustments

---

## Scheduled Jobs (Automatic)

| Job | Schedule | What It Does |
|-----|----------|--------------|
| **EL Accrual** | 1st of every month | Adds 2 EL days per employee; skips if on leave entire month; caps at 60, overflow to SPECIAL |
| **Auto-Lapse** | Jan 1 | Resets CL, ML, Quarantine to 0 |
| **Year-End Rollover** | Jan 1 (5:00) | Carries EL up to 60 days to next year; excess to SPECIAL (120 cap) |

See [CRON-JOBS.md](./CRON-JOBS.md) for full details.

---

## Admin-Triggered Jobs (Semi-Automatic)

**UI:** Admin → Jobs (`/admin/jobs`) or Balance Management → Year Actions

**API:** `POST /api/admin/jobs/trigger`
```json
{
  "job": "el-accrual" | "auto-lapse" | "year-end-rollover" | "init-year",
  "params": { "year": 2025, "month": 6, "overwrite": false, "retroactiveEL": false }
}
```

### When to Run Manually

- **EL Accrual** – Retry after a failed cron run; run for a specific past month
- **Auto-Lapse** – Retry if Jan 1 cron failed
- **Year-End Rollover** – Retry after auto-lapse; run if cron was missed
- **Initialize Year** – Create CL (10) and ML (14) balances for a year; use at year start or mid-year launch

### Init-Year Parameters

| Param | Description | Default |
|-------|-------------|---------|
| `year` | Target year | Current year |
| `proRata` | Pro-rate CL/ML for mid-year joiners | true |
| `overwrite` | Replace existing accrued values | false |
| `retroactiveEL` | Add retroactive EL for mid-year launch | false |

---

## Mid-Year Launch Checklist

If launching the web app mid-year (e.g., July):

1. **Load holidays** – Ensure all holidays for the year are in Admin → Holidays.

2. **Initialize year balances** – Run **Initialize Year** for the current year.
   - Creates CL (10 days) and ML (14 days) per employee (pro-rata by join month).
   - Does NOT create EL; that accrues monthly.

3. **Optionally add retroactive EL** – Run **Initialize Year** with `retroactiveEL: true`.
   - Adds 2 EL days per month from Jan to current month (only for months after join date).
   - Use when cron has not been running (e.g., new deployment).
   - Creates `EL_RETROACTIVE_ACCRUAL` audit entries.

4. **Import historical balances** – If you have legacy data:
   - Use Admin → Balance Management → Import CSV.
   - Format: `empCode`, `leaveType`, `year`, `opening`, `accrued`, `used`.
   - See balance import template for full format.

5. **Manual adjustments** – Use Admin → Balance Management → Adjust for edge cases.

---

## Manual Controls

- **CSV import** – Admin → Balance Management → Import
- **Manual adjustment** – Per-employee balance credit/debit (SYSTEM_ADMIN)
- **Export** – Export current year balances to CSV

---

## Balance Types Summary

| Type | Allocation | Carry Forward | Lapses |
|------|------------|---------------|--------|
| **EARNED (EL)** | 2 days/month (accrual) | Yes, up to 60 days | No |
| **CASUAL (CL)** | 10 days/year | No | Dec 31 |
| **MEDICAL (ML)** | 14 days/year | No | Dec 31 |
| **QUARANTINE** | As needed | No | Dec 31 |
| **SPECIAL** | From EL overflow | Yes, up to 120 | No |
