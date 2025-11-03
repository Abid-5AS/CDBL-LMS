# Seed Data (Dev only)

**Seed Script**: `prisma/seed.ts`  
**Command**: `pnpm prisma:seed`

## Users Created

**Employees** (4):
- Employee One (`employee1@demo.local`, EMPLOYEE, Engineering)
- Employee Two (`employee2@demo.local`, EMPLOYEE, Operations)
- Employee Three (`employee3@demo.local`, EMPLOYEE, HR & Admin)
- Employee Four (`employee4@demo.local`, EMPLOYEE, Finance)

**Management** (4):
- Dept Head (`manager@demo.local`, DEPT_HEAD, Engineering)
- HR Admin (`hradmin@demo.local`, HR_ADMIN, HR & Admin)
- HR Head (`hrhead@demo.local`, HR_HEAD, HR & Admin)
- CEO (`ceo@demo.local`, CEO, Executive)

**Default Password**: `demo123` (for all users)

## Default Balances

All users get:
- EL: 20 days/year (opening: 0, accrued: 20)
- CL: 10 days/year (opening: 0, accrued: 10)
- ML: 14 days/year (opening: 0, accrued: 14)

Note: EL carry-forward is set to 0 in seed; adjust manually for testing carry-forward scenarios.

## Sample Leave Requests

Seed creates 12+ sample leave requests with various statuses:
- PENDING requests (in approval chain)
- APPROVED requests (full 4-step chain completed)
- REJECTED requests
- SUBMITTED requests (awaiting HR_ADMIN)
- Various leave types (EL, CL, ML)

## Holidays

Seed includes all Bangladesh holidays for current year:
- National holidays (Victory Day, Independence Day, etc.)
- Religious holidays (Eid-ul-Fitr, Eid-ul-Azha, etc.)
- Optional holidays marked with `isOptional: true`

## Audit Logs

Seed creates sample audit logs for:
- Login/logout events
- Leave approvals/rejections/forwards
- Employee management actions
- Policy updates
