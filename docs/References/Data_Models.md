# Data Models (Prisma / MySQL) - Updated Reference

## Overview

Complete documentation of all database models in the CDBL Leave Management System. This is an updated version with all 8 models from the current schema.

---

## User Model

**Table**: `User`

**Fields**:
- `id`: Int (PK, autoincrement)
- `name`: String (required)
- `email`: String (unique, required)
- `password`: String? (hashed, optional)
- `empCode`: String? (unique, optional)
- `role`: Role enum (default: EMPLOYEE)
  - Values: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO
- `department`: String? (optional)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto-updated)

**Relations**:
- `leaves`: LeaveRequest[] (one-to-many)
- `balances`: Balance[] (one-to-many)
- `approvals`: Approval[] (one-to-many, as approver)

**Unique Constraints**:
- `email`: Must be unique
- `empCode`: Must be unique if provided

**Location**: `prisma/schema.prisma` lines 40-54

---

## LeaveRequest Model

**Table**: `LeaveRequest`

**Fields**:
- `id`: Int (PK, autoincrement)
- `requesterId`: Int (FK → User.id)
- `type`: LeaveType enum
  - Values: EARNED, CASUAL, MEDICAL, EXTRAWITHPAY, EXTRAWITHOUTPAY, MATERNITY, PATERNITY, STUDY, SPECIAL_DISABILITY, QUARANTINE
- `startDate`: DateTime (required)
- `endDate`: DateTime (required)
- `workingDays`: Int (calendar days inclusive)
- `reason`: String (required, min 3 chars)
- `needsCertificate`: Boolean (default: false)
- `certificateUrl`: String? (optional file path)
- `status`: LeaveStatus enum (default: DRAFT)
  - Values: DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED
- `policyVersion`: String (e.g., "v1.1")
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto-updated)

**Relations**:
- `requester`: User (many-to-one)
- `approvals`: Approval[] (one-to-many)

**Constraints**:
- `startDate` must be <= `endDate` (application logic)
- `workingDays` calculated from date range

**Location**: `prisma/schema.prisma` lines 56-73

---

## Approval Model

**Table**: `Approval`

**Fields**:
- `id`: Int (PK, autoincrement)
- `leaveId`: Int (FK → LeaveRequest.id)
- `step`: Int (1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO)
- `approverId`: Int (FK → User.id)
- `decision`: ApprovalDecision enum (default: PENDING)
  - Values: APPROVED, REJECTED, FORWARDED, PENDING
- `toRole`: String? (role forwarded to, if FORWARDED)
- `comment`: String? (optional)
- `decidedAt`: DateTime? (timestamp when decision made)

**Relations**:
- `leave`: LeaveRequest (many-to-one)
- `approver`: User (many-to-one)

**Indexes**:
- Index on `leaveId` for efficient queries

**Location**: `prisma/schema.prisma` lines 82-96

---

## Balance Model

**Table**: `Balance`

**Fields**:
- `id`: Int (PK, autoincrement)
- `userId`: Int (FK → User.id)
- `type`: LeaveType enum
- `year`: Int (calendar year)
- `opening`: Int (carry-forward from previous year)
- `accrued`: Int (current year accrual, e.g., 2 days/month for EL)
- `used`: Int (default: 0, year-to-date usage)
- `closing`: Int (calculated: (opening + accrued) - used)

**Relations**:
- `user`: User (many-to-one)

**Unique Constraint**:
- Composite unique: `(userId, type, year)` - one balance per user/type/year

**Calculation**:
- Available = `(opening ?? 0) + (accrued ?? 0) - (used ?? 0)`
- Closing = `(opening + accrued) - used`

**Location**: `prisma/schema.prisma` lines 98-111

---

## Holiday Model

**Table**: `Holiday`

**Fields**:
- `id`: Int (PK, autoincrement)
- `date`: DateTime (unique, required)
- `name`: String (required)
- `isOptional`: Boolean (default: false)

**Unique Constraint**:
- `date`: Must be unique (one holiday per date)

**Usage**:
- Used for date validation (cannot start/end on holidays)
- Used in leave date calculations
- Affects CL leave restrictions

**Location**: `prisma/schema.prisma` lines 113-118

---

## PolicyConfig Model

**Table**: `PolicyConfig`

**Fields**:
- `id`: Int (PK, autoincrement)
- `leaveType`: LeaveType enum (unique)
- `maxDays`: Int? (optional maximum days)
- `minDays`: Int? (optional minimum days)
- `noticeDays`: Int? (optional advance notice requirement)
- `carryLimit`: Int? (optional carry-forward limit)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto-updated)

**Unique Constraint**:
- `leaveType`: One config per leave type

**Status**: Model exists but not actively used (policy rules are in `lib/policy.ts`)

**Location**: `prisma/schema.prisma` lines 120-129

---

## AuditLog Model

**Table**: `AuditLog`

**Fields**:
- `id`: Int (PK, autoincrement)
- `actorEmail`: String (email of user who performed action)
- `action`: String (action type, e.g., "LEAVE_APPROVE", "LEAVE_REJECT", "LEAVE_FORWARD", "LOGIN")
- `targetEmail`: String? (email of affected user, optional)
- `details`: Json? (additional action details)
- `createdAt`: DateTime (auto, indexed)

**Indexes**:
- Index on `createdAt` for time-based queries

**Audited Actions**:
- `LEAVE_APPROVE`: Leave approved
- `LEAVE_REJECT`: Leave rejected
- `LEAVE_FORWARD`: Leave forwarded
- `LEAVE_BACKDATE_ASK`: Backdate confirmation requested
- `LOGIN`: User login
- `POLICY_NOTE`: Policy-related notes

**Location**: `prisma/schema.prisma` lines 131-140

---

## OrgSettings Model

**Table**: `OrgSettings`

**Fields**:
- `id`: Int (PK, autoincrement)
- `key`: String (unique identifier)
- `value`: Json (setting value)
- `description`: String? (human-readable description)
- `updatedAt`: DateTime (auto-updated)
- `updatedBy`: Int? (user ID who last updated, optional FK to User)

**Unique Constraint**:
- `key`: Must be unique

**Example Settings**:
- `allowBackdate`: Backdate permission settings
  ```json
  {
    "allowBackdate": {
      "EL": "ask",
      "CL": false,
      "ML": true
    }
  }
  ```

**Location**: `prisma/schema.prisma` lines 142-149

---

## Enums

### Role Enum
```prisma
enum Role {
  EMPLOYEE
  DEPT_HEAD
  HR_ADMIN
  HR_HEAD
  CEO
}
```

### LeaveType Enum
```prisma
enum LeaveType {
  EARNED
  CASUAL
  MEDICAL
  EXTRAWITHPAY
  EXTRAWITHOUTPAY
  MATERNITY
  PATERNITY
  STUDY
  SPECIAL_DISABILITY
  QUARANTINE
}
```

### LeaveStatus Enum
```prisma
enum LeaveStatus {
  DRAFT
  SUBMITTED
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### ApprovalDecision Enum
```prisma
enum ApprovalDecision {
  APPROVED
  REJECTED
  FORWARDED
  PENDING
}
```

---

## Derived Views / API Contracts

### Employee Dashboard Query
```sql
SELECT * FROM LeaveRequest 
WHERE requesterId = ? 
ORDER BY createdAt DESC
```

### HR Dashboard Query
```sql
SELECT l.*, u.* FROM LeaveRequest l
JOIN User u ON l.requesterId = u.id
WHERE l.status IN ('PENDING', 'SUBMITTED')
ORDER BY l.createdAt DESC
```

### Approvals API
- Creates `Approval` record
- Updates `LeaveRequest.status`
- Creates `AuditLog` entry

---

## Seed Data

**Default Seed** (`prisma/seed.ts`):
- Demo users (EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO)
- Leave balances:
  - EL: 20 days/year (opening + accrued)
  - CL: 10 days/year
  - ML: 14 days/year
- Sample holidays (Victory Day, etc.)
- Sample leave requests (various statuses)

**Running Seed**:
```bash
pnpm prisma:seed
```

---

## Model Relationships Summary

```
User (1) ──< (many) LeaveRequest
User (1) ──< (many) Balance
User (1) ──< (many) Approval (as approver)

LeaveRequest (1) ──< (many) Approval
```

---

## Related Documentation

- **Complete Schema**: [Database Schema Documentation](./../03-Database-Schema.md)
- **Prisma Schema**: `prisma/schema.prisma`
- **API Usage**: [API Contracts](./../API/API_Contracts.md)

---

**Document Version**: 1.0 (Updated)  
**Last Updated**: Current  
**Total Models**: 8 models  
**Total Enums**: 4 enums

