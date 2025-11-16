# Automated Cron Jobs

This document describes the automated cron jobs that maintain data integrity and policy compliance in the CDBL LMS system.

## Overview

The system uses **Vercel Cron Jobs** to automate critical background tasks:

1. **Monthly EL Accrual** - Adds 2 days of Earned Leave to all employees each month (Policy 6.19)
2. **Annual Leave Lapse** - Resets Casual, Medical, and Quarantine leave balances at year-end (Policy 6.16, 6.21.a)

## Cron Jobs

### 1. Monthly EL Accrual

**Endpoint:** `/api/cron/el-accrual`
**Schedule:** `0 0 1 * *` (Midnight UTC on the 1st of every month)
**Dhaka Time:** 6:00 AM on the 1st of every month

**What it does:**
- Adds 2 days of Earned Leave to each employee's balance
- Skips employees who were on approved leave for the entire previous month
- Handles 60-day carry-forward cap (Policy 6.19.b)
- Transfers excess EL to SPECIAL leave (up to 120 days total)
- Creates audit log entries for transparency

**Business Logic:**
```typescript
// Normal accrual
EL Balance += 2 days

// When approaching cap (60 days)
if (EL Balance > 60 days):
  - Keep EL at 60 days
  - Transfer excess to SPECIAL leave (max 120 days)
  - Log: "EL_ACCRUED" and "EL_TRANSFERRED_TO_SPECIAL"

// Skip if on leave entire month
if (employee was on approved leave for entire previous month):
  - Skip accrual for this month
  - Log: "EL_ACCRUED with skipped=true"
```

### 2. Annual Leave Lapse

**Endpoint:** `/api/cron/auto-lapse`
**Schedule:** `59 17 31 12 *` (5:59 PM UTC on December 31)
**Dhaka Time:** 11:59 PM on December 31

**What it does:**
- Resets Casual Leave (CL) balances to 0
- Resets Medical Leave (ML) balances to 0
- Resets Quarantine Leave balances to 0
- Creates audit log entries for each lapsed balance
- **Does NOT** affect Earned Leave (EL) - it carries forward

**Business Logic:**
```typescript
For each employee:
  For each leave type in [CASUAL, MEDICAL, QUARANTINE]:
    - Set balance to 0 (opening, accrued, used, closing all = 0)
    - Log: "{LEAVE_TYPE}_LAPSED" with previous balance
```

## Security

All cron endpoints are protected by bearer token authentication:

```typescript
Authorization: Bearer {CRON_SECRET}
```

Vercel automatically includes this header when triggering scheduled cron jobs.

### Setup: Environment Variables

In your Vercel project settings, add the following environment variable:

```bash
CRON_SECRET=your-random-secret-token-here
```

**How to generate a secure secret:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important:**
- Use a strong, random value (at least 32 characters)
- Keep this secret secure - it protects your cron endpoints from unauthorized access
- Add it to all environments (production, preview, development)

## Manual Testing

You can manually trigger the cron jobs for testing:

### Test EL Accrual
```bash
curl -X POST https://your-domain.com/api/cron/el-accrual \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Annual Lapse
```bash
curl -X POST https://your-domain.com/api/cron/auto-lapse \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "EL accrual completed successfully",
  "summary": {
    "totalEmployees": 150,
    "accrued": 148,
    "skipped": 2,
    "totalDaysAccrued": 296,
    "durationMs": 1234
  },
  "results": [...]
}
```

## Monitoring

### Vercel Dashboard
1. Go to your Vercel project
2. Navigate to **Deployments** → **Cron Jobs**
3. View execution history, logs, and status

### Audit Logs
All cron job actions are logged in the `audit_log` table:
- `EL_ACCRUED` - Employee received monthly EL accrual
- `EL_TRANSFERRED_TO_SPECIAL` - Excess EL transferred to SPECIAL
- `CASUAL_LAPSED` - CL balance reset at year-end
- `MEDICAL_LAPSED` - ML balance reset at year-end
- `QUARANTINE_LAPSED` - Quarantine balance reset at year-end

Query audit logs:
```sql
SELECT * FROM audit_log
WHERE action IN ('EL_ACCRUED', 'CASUAL_LAPSED', 'MEDICAL_LAPSED')
ORDER BY timestamp DESC;
```

## Troubleshooting

### Cron job failed with 401 Unauthorized
- **Cause:** Missing or incorrect `CRON_SECRET`
- **Fix:** Verify the `CRON_SECRET` environment variable is set correctly in Vercel

### Cron job succeeded but no balances updated
- **Cause:** No employees in database, or all employees were on leave
- **Fix:** Check the response `summary` object for details

### Cron job timeout (>10 seconds on Hobby plan)
- **Cause:** Large number of employees (>1000)
- **Fix:** Consider upgrading to Pro plan (60s timeout) or implementing batch processing

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Cron Scheduler                 │
│  (Triggers at scheduled times with Bearer token)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─> GET /api/cron/el-accrual
                     │   └─> processELAccrual()
                     │       └─> Update Balance table
                     │           └─> Create Audit logs
                     │
                     └─> GET /api/cron/auto-lapse
                         └─> processAnnualLapse()
                             └─> Reset Balance table
                                 └─> Create Audit logs
```

## Files

- `/app/api/cron/el-accrual/route.ts` - EL accrual API endpoint
- `/app/api/cron/auto-lapse/route.ts` - Annual lapse API endpoint
- `/scripts/jobs/el-accrual.ts` - EL accrual business logic
- `/scripts/jobs/auto-lapse.ts` - Annual lapse business logic
- `/vercel.json` - Cron schedule configuration

## Policy References

- **Policy 6.16:** All leave except EL lapses on December 31
- **Policy 6.19:** EL accrues 2 days per month while on duty
- **Policy 6.19.b:** Maximum 60 days EL can be carried forward
- **Policy 6.19.c:** Excess EL transfers to SPECIAL leave (up to 180 days total: 60 EL + 120 SPECIAL)
- **Policy 6.21.a:** Medical leave does not carry forward

## Production Checklist

Before deploying to production:

- [ ] Set `CRON_SECRET` environment variable in Vercel
- [ ] Deploy application with `vercel.json` included
- [ ] Verify cron jobs appear in Vercel dashboard
- [ ] Test both endpoints manually using curl
- [ ] Monitor first automatic execution
- [ ] Verify audit logs are created correctly
- [ ] Check employee balances after first run
- [ ] Set up alerting for cron job failures (Vercel integrations)

## Future Enhancements

- **Email notifications:** Send monthly summary emails to HR after EL accrual
- **Year-end rollover:** Create opening balances for next year's EL carry-forward
- **Batch processing:** Handle large employee counts (>1000) efficiently
- **Dry-run mode:** Preview changes before applying them
- **Admin dashboard:** View cron job history and manually trigger runs
