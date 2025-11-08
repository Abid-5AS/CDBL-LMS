# Seed Data Setup Guide

This document explains how to populate the CDBL Leave Management database with realistic demo data for development and testing.

## Overview

The seed script generates:
- **Users**: 1 CEO, 1 HR_HEAD, 1 HR_ADMIN, 3 DEPT_HEAD, 12 EMPLOYEE (1 SYSTEM_ADMIN)
- **Balances**: Realistic leave balances for all employees
- **Leave Requests**: Historical and upcoming leave requests with proper approval chains
- **Holidays**: Bangladesh national holidays for current and next year
- **Audit Logs**: ~50 audit trail entries for realism

## Running the Seed

### Option 1: Using Prisma Seed Command

```bash
npx prisma db seed
```

### Option 2: Using npm script

```bash
npm run prisma:seed
# or
pnpm prisma:seed
```

### Option 3: Reset and Seed (Fresh Start)

```bash
npx prisma migrate reset
# This will:
# 1. Drop all tables
# 2. Recreate schema
# 3. Run migrations
# 4. Execute seed script automatically
```

### Option 4: Manual Reset and Seed

```bash
# Set environment variable to reset tables
SEED_RESET=true npx prisma db seed
```

## Default Credentials

All seeded users have the password: **`demo123`**

### User Accounts

| Role | Email | Password |
|------|-------|----------|
| SYSTEM_ADMIN | sysadmin@cdbl.local | demo123 |
| CEO | ceo@cdbl.local | demo123 |
| HR_HEAD | hrhead@cdbl.local | demo123 |
| HR_ADMIN | hradmin1@cdbl.local | demo123 |
| DEPT_HEAD (IT) | depthead.it@cdbl.local | demo123 |
| DEPT_HEAD (HR) | depthead.hr@cdbl.local | demo123 |
| DEPT_HEAD (Finance) | depthead.finance@cdbl.local | demo123 |
| EMPLOYEE | Various (e.g., ahmed.rahman1@cdbl.local) | demo123 |

## Data Distribution

### Leave Request Statuses

- **APPROVED**: 60%
- **PENDING**: 20%
- **REJECTED**: 10%
- **RETURNED**: 10%
- **CANCELLATION_REQUESTED**: 5%
- **OVERSTAY_PENDING**: 2%
- **CANCELLED**: 1%

### Leave Request Timeline

- **Past 6 months**: Historical requests (APPROVED, REJECTED, RETURNED, CANCELLED)
- **Upcoming 1 month**: Future requests (PENDING, APPROVED, SUBMITTED)

### Leave Balances

Each employee gets:
- **Earned Leave**: 23-24 days remaining (1-2 used)
- **Casual Leave**: 4-6 days remaining (4-6 used)
- **Medical Leave**: 8-10 days remaining (4-6 used)

## Policy Compliance

All seeded data respects **Policy v2.0**:
- ✅ CL ≤ 10 days/year, ≤ 3 consecutive days
- ✅ ML > 3 days requires certificate
- ✅ ML > 7 days requires fitness certificate on return
- ✅ EL notice ≥ 5 working days
- ✅ CL cannot start/end on Friday, Saturday, or holidays

## Helper Functions

Seed utilities are available in `lib/seed-utils.ts`:
- `randomDateWithin()` - Generate dates within year range
- `randomDuration()` - Policy-aware duration generation
- `randomStatus()` - Weighted status distribution
- `randomReason()` - Realistic reason generation
- `generateBangladeshiName()` - Local name generation

## Frontend Fallbacks

If API returns empty results, the frontend uses demo data from `lib/demo-data.ts`:
- `demoTeamOnLeave` - Team members on leave
- `demoHeatmapData` - Heatmap visualization data
- `demoInsights` - Dashboard insights
- `demoRecentRequests` - Recent leave requests

## Verification

After seeding, verify the data:

```bash
# Check user count
npx prisma studio
# Navigate to User table and verify 18 users

# Check leave requests
# Navigate to LeaveRequest table and verify ~100+ requests

# Check balances
# Navigate to Balance table and verify all employees have balances
```

## Troubleshooting

### Issue: Seed fails with "Unique constraint failed"

**Solution**: Reset the database first:
```bash
SEED_RESET=true npx prisma db seed
```

### Issue: Seed script doesn't run automatically

**Solution**: Ensure `package.json` has:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Issue: Missing data in dashboard

**Solution**: 
1. Verify seed ran successfully
2. Check API endpoints return data
3. Frontend should fallback to `lib/demo-data.ts` if APIs are empty

## Next Steps

After seeding:
1. Login with any seeded account
2. Navigate to dashboard
3. Verify all sections show populated data:
   - Days Used This Year
   - Team on Leave Today
   - Insights
   - Heatmap
   - Leave Type Distribution
   - Active Timeline

## Seed Data Structure

```
User (18 total)
├── SYSTEM_ADMIN (1)
├── CEO (1)
├── HR_HEAD (1)
├── HR_ADMIN (1)
├── DEPT_HEAD (3)
│   ├── IT
│   ├── HR
│   └── Finance
└── EMPLOYEE (12)
    ├── IT (4)
    ├── HR (4)
    └── Finance (4)

Balance (18 users × 3 types = 54 records)
LeaveRequest (~100+ records)
Approval (~200+ records)
Holiday (~15-20 records)
AuditLog (~50 records)
```





