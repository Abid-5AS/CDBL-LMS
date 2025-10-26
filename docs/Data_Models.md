# Data Models (Prisma / MySQL)

## User
- `id`: Int (PK, autoincrement)
- `name`: string
- `email`: string (unique, required)
- `empCode`: string? (unique, optional)
- `department`: string?
- `role`: enum (`EMPLOYEE` | `HR_ADMIN`)
- `createdAt` / `updatedAt`

## LeaveRequest
- `id`: Int (PK, autoincrement)
- `requesterId`: FK → `User.id`
- `type`: enum (`EARNED`, `CASUAL`, `MEDICAL`, `EXTRAWITHPAY`, `EXTRAWITHOUTPAY`, `MATERNITY`, `PATERNITY`, `STUDY`, `SPECIAL_DISABILITY`, `QUARANTINE`)
- `startDate` / `endDate`: DateTime (inclusive range)
- `workingDays`: Int (calendar days inclusive)
- `reason`: string
- `needsCertificate`: boolean (tracks ML > 3 days etc.)
- `certificateUrl`: string?
- `status`: enum (`DRAFT`, `SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `policyVersion`: string (e.g. `v1.1`)
- `createdAt` / `updatedAt`
- Relations:
  - `requester`: User
  - `approvals`: Approval[]

## Approval
- `id`: Int (PK, autoincrement)
- `leaveId`: FK → `LeaveRequest.id`
- `step`: Int (single HR stage = `1`)
- `approverId`: FK → `User.id` (HR Admin who acted)
- `decision`: string (`APPROVED` | `REJECTED`)
- `comment`: string?
- `decidedAt`: DateTime?

## Balance
- `id`: Int (PK)
- `userId`: FK → `User.id`
- `type`: enum (`EARNED`, `CASUAL`, `MEDICAL`, ...)
- `year`: Int
- `opening`: Int (carry forward)
- `accrued`: Int (current year entitlement)
- `used`: Int (year-to-date consumption)
- `closing`: Int (remaining balance after accrual/usage)
- Unique composite: (`userId`, `type`, `year`)

## Holiday
- `id`: Int (PK)
- `date`: DateTime (unique)
- `name`: string
- `isOptional`: boolean (defaults false)

### Derived Views / API Contracts
- Employee dashboards query `LeaveRequest` filtered by cookie user.
- HR dashboards list `LeaveRequest` where `status` in (`PENDING`,`SUBMITTED`), joined with `User`.
- Approvals API writes to `Approval` table and updates `LeaveRequest.status`.

### Seed Data
- Three demo users (two `EMPLOYEE`, one `HR_ADMIN`) with 20/10/14 leave balances.
- Holiday seed ensures “Victory Day” present for current year.
