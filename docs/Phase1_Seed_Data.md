# Phase 1 Seed Data Documentation

## Overview

The seed script (`prisma/seed.ts`) generates a comprehensive, realistic dataset for development and testing of the CDBL Leave Management System.

## Data Generation Approach

### Deterministic Seeding

The seed uses a deterministic random number generator (seed-based) for reproducibility. This means:
- Same seed value = same generated data every time
- Useful for testing and debugging
- Predictable user names, dates, and leave patterns

### Seed Reset Option

Run with `SEED_RESET=true` to truncate core tables before seeding:
```bash
SEED_RESET=true npx tsx prisma/seed.ts
```

Without the flag, the script uses upserts (idempotent) to avoid duplicates.

## Generated Data

### Users (37 total)

1. **SYSTEM_ADMIN** (1)
   - Email: `sysadmin@cdbl.local`
   - Department: IT
   - Role: SYSTEM_ADMIN

2. **CEO** (1)
   - Email: `ceo@cdbl.local`
   - Department: Executive
   - Role: CEO

3. **HR_HEAD** (1)
   - Email: `hrhead@cdbl.local`
   - Department: HR
   - Role: HR_HEAD

4. **HR_ADMIN** (2)
   - Emails: `hradmin1@cdbl.local`, `hradmin2@cdbl.local`
   - Department: HR
   - Role: HR_ADMIN

5. **DEPT_HEAD** (4)
   - One per department: IT, HR, Finance, Operations
   - Emails: `depthead.it@cdbl.local`, `depthead.hr@cdbl.local`, etc.
   - Role: DEPT_HEAD

6. **EMPLOYEE** (28)
   - 7 employees per department (IT, HR, Finance, Operations)
   - Each employee has `deptHeadId` pointing to their department head
   - Generated names using realistic Bangladeshi name patterns
   - Emails: `{firstname.lastname}{index}@cdbl.local`

**All passwords:** `demo123`

### Departments

- IT
- HR
- Finance
- Operations

### Balances (Current Year)

For every user:
- **EARNED**: Opening 0, Accrued 24, Used 0-12 (random), Closing calculated
- **CASUAL**: Accrued 10, Used 0-6 (random), Closing calculated
- **MEDICAL**: Accrued 14, Used 0-6 (random), Closing calculated

### Holidays (Next 12 Months)

Includes 15+ holidays covering:
- National holidays (Eid-ul-Fitr, Eid-ul-Azha, Independence Day, etc.)
- Company holidays
- Both current year and next year dates

### Leave Requests (6-10 per Employee)

Each employee gets 6-10 leave requests with:

**Status Distribution:**
- 50% APPROVED
- 20% PENDING
- 10% SUBMITTED
- 8% REJECTED
- 5% CANCELLATION_REQUESTED
- 3% RETURNED
- 2% OVERSTAY_PENDING
- 2% CANCELLED

**Type Examples:**
- **EARNED**: 3-10 day blocks (approved)
- **CASUAL**: 1-3 days (some violating weekend/holiday rules for testing)
- **MEDICAL**: 
  - ≤3 days (no certificate)
  - 4-8 days (needsCertificate=true, certificate attached)
  - >7 days (fitnessCertificateUrl required on return, some missing for testing)

**Overlaps:**
- Intentional overlaps within departments so "Team on Leave Today" widget shows 1-4 people most days in the next month

**Approval Chains:**
- Each APPROVED, PENDING, REJECTED, RETURNED request has full approval chain
- Chains follow per-type workflow rules (EL/ML: HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO; CL: DEPT_HEAD only)

### Certificates

For Medical Leave > 3 days:
- Small placeholder PDF files generated in `/private/uploads/`
- Filenames: `medical-cert-{leaveId}-{uuid}.pdf`
- Referenced in `certificateUrl` field
- For ML > 7 days, some have `fitnessCertificateUrl`, some don't (to test requirement)

## Dashboard Filters Explained

### Team on Leave Widget

**API:** `/api/team/on-leave?date=YYYY-MM-DD&scope=team`

- **scope=team**: Shows colleagues (same `deptHeadId`) excluding self
- **scope=me**: Shows user's own leaves for that date
- Clicking avatars opens filtered list: `/leaves?deptHeadId=<id>&date=today`

### Heatmap

**API:** `/api/analytics/heatmap?scope=me|team&range=year|rolling12&types=EARNED,CASUAL,MEDICAL&status=APPROVED|PENDING|ALL`

- **scope**: `me` (default) or `team` - whose leaves to show
- **range**: `year` (default) or `rolling12` - time period
- **types**: Comma-separated list or `all` (default) - filter by leave type
- **status**: `APPROVED` (default), `PENDING`, or `ALL` - filter by status
- **Decoupled**: Fetches only its own API, no side effects on other widgets

### Analytics Summary

**API:** `/api/dashboard/analytics/summary?period=month|quarter|year`

- **period**: `month`, `quarter`, or `year` (default)
- Returns: days used in period, total year used, remaining balance, distribution by type
- **Independent**: Does not read heatmap state

### Insights

**API:** `/api/dashboard/insights`

- Returns array of smart hints: `[{kind, text, meta?}]`
- Examples:
  - `EL_CARRY`: Earned leave carry-forward warnings
  - `TEAM_OVERLAP`: Colleagues on leave notifications
  - `CL_LAPSE_RISK`: Casual leave expiring soon
  - `PLANNING_OPPORTUNITY`: Consecutive working days ahead
  - `PENDING_ACTION`: Requests needing attention

## Schema Relationships

### User Hierarchy

```
User (deptHeadId) → User (self-relation)
  - Employees point to their department head
  - Department heads have teamMembers array
  - Relation name: "HeadToMembers"
```

### Team Definition

Team = All users sharing the same `deptHeadId`

Example:
- IT Dept Head (id: 10)
- IT Employee 1 (deptHeadId: 10)
- IT Employee 2 (deptHeadId: 10)
- → All employees with deptHeadId=10 are in the same team

## Seed Command

```bash
# Format schema
npx prisma format

# Push schema changes (if needed)
npx prisma db push --accept-data-loss

# Run seed with reset
SEED_RESET=true npx tsx prisma/seed.ts

# Or without reset (idempotent)
npx tsx prisma/seed.ts
```

## Notes

- All dates normalized to Asia/Dhaka timezone using `normalizeToDhakaMidnight()`
- Working days calculated excluding weekends (Fri/Sat) and holidays
- Certificate files stored in `/private/uploads/` (not `/public/uploads/`)
- Approval chains follow Policy v2.0 workflow rules per leave type
- Seed uses deterministic random for reproducible test data


