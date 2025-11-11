# CDBL Leave Management System - Database Schema Documentation

## Overview

The database schema is defined using Prisma ORM and uses MySQL as the database provider. This document provides complete documentation of all models, relationships, enums, indexes, and constraints.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ LeaveRequest : creates
    User ||--o{ Balance : has
    User ||--o{ Approval : approves
    LeaveRequest ||--o{ Approval : has
    User {
        int id PK
        string name
        string email UK
        string password
        string empCode UK
        enum role
        string department
        datetime createdAt
        datetime updatedAt
    }
    LeaveRequest {
        int id PK
        int requesterId FK
        enum type
        datetime startDate
        datetime endDate
        int workingDays
        string reason
        boolean needsCertificate
        string certificateUrl
        enum status
        string policyVersion
        datetime createdAt
        datetime updatedAt
    }
    Approval {
        int id PK
        int leaveId FK
        int step
        int approverId FK
        enum decision
        string toRole
        string comment
        datetime decidedAt
    }
    Balance {
        int id PK
        int userId FK
        enum type
        int year
        int opening
        int accrued
        int used
        int closing
    }
    Holiday {
        int id PK
        datetime date UK
        string name
        boolean isOptional
    }
    PolicyConfig {
        int id PK
        enum leaveType UK
        int maxDays
        int minDays
        int noticeDays
        int carryLimit
        datetime createdAt
        datetime updatedAt
    }
    AuditLog {
        int id PK
        string actorEmail
        string action
        string targetEmail
        json details
        datetime createdAt
    }
    OrgSettings {
        int id PK
        string key UK
        json value
        string description
        int updatedBy FK
        datetime updatedAt
    }
```

---

## Enumerations

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

**Description**: Defines user roles in the system. Hierarchical from lowest (EMPLOYEE) to highest (CEO).

**Default**: `EMPLOYEE`

---

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

**Description**: All supported leave types. Primary types: EARNED, CASUAL, MEDICAL. Others are admin-granted special leaves.

---

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

**Description**: Lifecycle states of a leave request.

**Flow**: `DRAFT → SUBMITTED → PENDING → {APPROVED | REJECTED | CANCELLED}`

---

### ApprovalDecision Enum

```prisma
enum ApprovalDecision {
  APPROVED
  REJECTED
  FORWARDED
  PENDING
}
```

**Description**: Decision types in the approval workflow.

- `APPROVED`: Final approval granted
- `REJECTED`: Final rejection
- `FORWARDED`: Forwarded to next approver
- `PENDING`: Awaiting decision

---

## Models

### User Model

**Purpose**: Stores employee/user account information.

```prisma
model User {
  id         Int      @id @default(autoincrement())
  name       String
  email      String   @unique
  password   String?
  empCode    String?  @unique
  role       Role     @default(EMPLOYEE)
  department String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  leaves     LeaveRequest[]
  balances   Balance[]
  approvals  Approval[]   @relation("ApprovalApprover")
}
```

**Fields**:

- `id`: Primary key, auto-increment
- `name`: Full name of user
- `email`: Unique email address (login credential)
- `password`: Hashed password (bcrypt)
- `empCode`: Optional employee code (unique if provided)
- `role`: User role (enum, defaults to EMPLOYEE)
- `department`: Optional department name
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:

- `leaves`: All leave requests created by this user
- `balances`: All leave balances for this user
- `approvals`: All approvals made by this user

**Unique Constraints**:

- `email`: Must be unique
- `empCode`: Must be unique if provided

**Indexes**:

- Primary key on `id`
- Unique index on `email`
- Unique index on `empCode`

---

### LeaveRequest Model

**Purpose**: Stores leave application requests.

```prisma
model LeaveRequest {
  id              Int           @id @default(autoincrement())
  requesterId     Int
  type            LeaveType
  startDate       DateTime
  endDate         DateTime
  workingDays     Int
  reason          String
  needsCertificate Boolean      @default(false)
  certificateUrl  String?
  status          LeaveStatus   @default(DRAFT)
  policyVersion   String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  requester       User          @relation(fields: [requesterId], references: [id])
  approvals       Approval[]
}
```

**Fields**:

- `id`: Primary key
- `requesterId`: Foreign key to User (who requested)
- `type`: Leave type (enum)
- `startDate`: Leave start date (DateTime)
- `endDate`: Leave end date (DateTime)
- `workingDays`: Total calendar days (inclusive)
- `reason`: Leave reason (text)
- `needsCertificate`: Boolean flag for certificate requirement
- `certificateUrl`: Optional file path to uploaded certificate
- `status`: Current status (enum, defaults to DRAFT)
- `policyVersion`: Policy version in effect (e.g., "v1.1")
- `createdAt`: Request creation timestamp
- `updatedAt`: Last update timestamp

**Relations**:

- `requester`: User who created the request
- `approvals`: All approval records for this request

**Constraints**:

- `requesterId` must reference valid User
- `startDate` must be <= `endDate` (application logic)

**Validation** (application-level):

- `workingDays` = inclusive calendar days between startDate and endDate
- `reason` minimum length enforced (10 characters)
- `type`-specific validations (policy rules)

---

### Approval Model

**Purpose**: Tracks approval workflow steps and decisions.

```prisma
model Approval {
  id          Int              @id @default(autoincrement())
  leaveId     Int
  step        Int
  approverId  Int
  decision    ApprovalDecision @default(PENDING)
  toRole      String?
  comment     String?
  decidedAt   DateTime?

  leave       LeaveRequest     @relation(fields: [leaveId], references: [id])
  approver    User             @relation("ApprovalApprover", fields: [approverId], references: [id])

  @@index([leaveId])
}
```

**Fields**:

- `id`: Primary key
- `leaveId`: Foreign key to LeaveRequest
- `step`: Step number in approval chain (1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO)
- `approverId`: Foreign key to User (who made decision)
- `decision`: Approval decision (enum, defaults to PENDING)
- `toRole`: Role forwarded to (if decision is FORWARDED)
- `comment`: Optional comment from approver
- `decidedAt`: Timestamp when decision was made

**Relations**:

- `leave`: The leave request being approved
- `approver`: The user who made the approval decision

**Indexes**:

- Primary key on `id`
- Index on `leaveId` for efficient queries

**Business Rules**:

- Steps must be sequential (1, 2, 3, 4)
- `toRole` must be set if `decision` is FORWARDED
- `decidedAt` must be set when `decision` is not PENDING

---

### Balance Model

**Purpose**: Tracks leave balances per user, per leave type, per year.

```prisma
model Balance {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      LeaveType
  year      Int
  opening   Int
  accrued   Int
  used      Int      @default(0)
  closing   Int

  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, type, year])
}
```

**Fields**:

- `id`: Primary key
- `userId`: Foreign key to User
- `type`: Leave type (enum)
- `year`: Calendar year (e.g., 2024)
- `opening`: Carry-forward balance from previous year
- `accrued`: Current year accrual (e.g., EL: 2 days/month)
- `used`: Days used in current year
- `closing`: Calculated closing balance

**Relations**:

- `user`: User who owns this balance

**Unique Constraint**:

- Composite unique: `(userId, type, year)` - one balance per user/type/year

**Calculation**:

- `closing = (opening + accrued) - used`
- Available balance: `(opening ?? 0) + (accrued ?? 0) - (used ?? 0)`

**Business Rules**:

- EL (Earned Leave) has opening balance (carry-forward)
- CL (Casual Leave) opening is typically 0 (no carry-forward)
- ML (Medical Leave) opening is typically 0 (no carry-forward)
- Accrual tracked monthly (manual process, not automated)

---

### Holiday Model

**Purpose**: Stores company holidays calendar.

```prisma
model Holiday {
  id         Int      @id @default(autoincrement())
  date       DateTime @unique
  name       String
  isOptional Boolean  @default(false)
}
```

**Fields**:

- `id`: Primary key
- `date`: Holiday date (DateTime, unique)
- `name`: Holiday name/description
- `isOptional`: Whether holiday is optional (defaults to false)

**Unique Constraint**:

- `date`: Must be unique (one holiday per date)

**Usage**:

- Used to determine non-working days
- Affects leave date validation (cannot start/end on holidays)
- CL cannot touch holidays

---

### PolicyConfig Model

**Purpose**: Stores configurable policy settings per leave type.

```prisma
model PolicyConfig {
  id         Int       @id @default(autoincrement())
  leaveType  LeaveType @unique
  maxDays    Int?
  minDays    Int?
  noticeDays Int?
  carryLimit Int?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

**Fields**:

- `id`: Primary key
- `leaveType`: Leave type (enum, unique)
- `maxDays`: Maximum days allowed (optional)
- `minDays`: Minimum days required (optional)
- `noticeDays`: Advance notice requirement in days (optional)
- `carryLimit`: Carry-forward limit in days (optional)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Unique Constraint**:

- `leaveType`: One config per leave type

**Status**: Model exists but not actively used (policy rules are hardcoded in `lib/policy.ts`). Can be activated for dynamic policy management.

---

### AuditLog Model

**Purpose**: Maintains audit trail of all system actions.

```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  actorEmail  String
  action      String
  targetEmail String?
  details     Json?
  createdAt   DateTime @default(now())

  @@index([createdAt])
}
```

**Fields**:

- `id`: Primary key
- `actorEmail`: Email of user who performed action
- `action`: Action type (e.g., "LEAVE_APPROVE", "LEAVE_REJECT", "LEAVE_FORWARD")
- `targetEmail`: Email of user affected by action (optional)
- `details`: Additional action details (JSON)
- `createdAt`: Action timestamp

**Indexes**:

- Primary key on `id`
- Index on `createdAt` for time-based queries

**Audited Actions**:

- `LEAVE_APPROVE`: Leave approved
- `LEAVE_REJECT`: Leave rejected
- `LEAVE_FORWARD`: Leave forwarded
- `LEAVE_BACKDATE_ASK`: Backdate confirmation requested
- `POLICY_NOTE`: Policy-related notes

---

### OrgSettings Model

**Purpose**: Stores organization-wide configuration settings.

```prisma
model OrgSettings {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       Json
  description String?
  updatedAt   DateTime @updatedAt
  updatedBy   Int?
}
```

**Fields**:

- `id`: Primary key
- `key`: Setting key (unique identifier)
- `value`: Setting value (JSON format)
- `description`: Human-readable description (optional)
- `updatedAt`: Last update timestamp
- `updatedBy`: User ID who last updated (optional, FK to User)

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

---

## Relationships Summary

### One-to-Many Relationships

1. **User → LeaveRequest**: One user can create many leave requests
2. **User → Balance**: One user can have many balances (different types/years)
3. **User → Approval**: One user can make many approvals
4. **LeaveRequest → Approval**: One leave request can have many approval steps

### Foreign Key Constraints

All foreign keys have referential integrity:

- `LeaveRequest.requesterId` → `User.id`
- `Approval.leaveId` → `LeaveRequest.id`
- `Approval.approverId` → `User.id`
- `Balance.userId` → `User.id`

---

## Indexes & Constraints

### Primary Keys

- All models have `id` as auto-increment primary key

### Unique Constraints

- `User.email`: Unique
- `User.empCode`: Unique (if provided)
- `LeaveRequest.id`: Primary key
- `Holiday.date`: Unique
- `PolicyConfig.leaveType`: Unique
- `OrgSettings.key`: Unique
- `Balance(userId, type, year)`: Composite unique

### Indexes

- `Approval.leaveId`: Indexed for efficient queries
- `AuditLog.createdAt`: Indexed for time-based queries

### Foreign Key Constraints

- All foreign keys have ON DELETE/ON UPDATE behavior (Prisma defaults)
- Cascade behavior handled at application level

---

## Data Types

### Integer Types

- `Int`: Standard integer (32-bit signed)

### String Types

- `String`: Variable-length string (MySQL VARCHAR)
- No explicit length limits (MySQL default)

### Boolean Types

- `Boolean`: True/false values

### DateTime Types

- `DateTime`: Date and time (MySQL DATETIME)
- Stored in UTC, displayed in Asia/Dhaka timezone

### JSON Types

- `Json`: JSON data type (MySQL JSON)
- Used for flexible data storage (AuditLog.details, OrgSettings.value)

---

## Seed Data

### Default Data

Seed script (`prisma/seed.ts`) creates:

1. **Demo Users**:

   - 2 Employees with balances
   - 1 HR_ADMIN
   - 1 DEPT_HEAD
   - 1 HR_HEAD
   - 1 CEO

2. **Leave Balances**:

   - EL: 20 days/year (opening + accrued)
   - CL: 10 days/year
   - ML: 14 days/year

3. **Sample Holidays**:

   - Victory Day and other Bangladesh holidays

4. **Sample Leave Requests**:
   - Various statuses for testing

### Running Seed

```bash
pnpm prisma:seed
```

---

## Migration Strategy

### Prisma Migrations

Migrations are stored in `prisma/migrations/` directory.

**Create Migration**:

```bash
pnpm prisma migrate dev --name migration_name
```

**Apply Migrations**:

```bash
pnpm prisma migrate deploy
```

**Reset Database** (development only):

```bash
pnpm prisma migrate reset
```

### Migration Best Practices

1. Review migration SQL before applying
2. Backup database before production migrations
3. Test migrations on staging environment
4. Use descriptive migration names
5. Don't modify existing migrations (create new ones)

---

## Database Connection

### Connection String Format

```
mysql://[user]:[password]@[host]:[port]/[database]
```

### Environment Variable

```env
DATABASE_URL="mysql://root:password@localhost:3306/cdbl_leave"
```

### Connection Pooling

Prisma handles connection pooling automatically. Configure pool size via connection string parameters if needed.

---

## Backup & Recovery

### Backup Strategy

- **Nightly Backups**: MySQL dumps (retain 30 days)
- **File Uploads**: Mirrored backup on local server share
- **Audit Logs**: Retained for compliance period

### Recovery Procedures

1. Restore MySQL database from backup
2. Restore file uploads from backup
3. Verify data integrity
4. Test application functionality

---

## Performance Considerations

### Query Optimization

- **Indexes**: On foreign keys and frequently queried fields
- **Pagination**: Cursor-based for large result sets
- **Selective Fields**: Only fetch required fields
- **Relations**: Use `include`/`select` judiciously

### Database Maintenance

- Regular index optimization
- Query performance monitoring
- Connection pool tuning
- Table optimization (periodic)

---

## Related Documentation

- **Prisma Schema**: `prisma/schema.prisma`
- **Policy Rules**: [Policy Logic Reference](./Policy%20Logic/README.md)
- **API Contracts**: [API Contracts](./API/API_Contracts.md)
- **Data Models (Legacy)**: [Data_Models.md](./References/Data_Models.md)

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Database Version**: MySQL 8.0+  
**Prisma Version**: 6.17.1
