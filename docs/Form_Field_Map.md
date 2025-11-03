# Form Field Map

> **Note**: This document reflects the current implementation. Some fields in the "suggested schema" section below may be planned for future implementation.

## Current Implementation Fields

| Form Label | UI Control | DB Field (type) | Example | Validation / Notes |
|------------|-----------|-----------------|---------|-------------------|
| Leave Type | Select dropdown | `type` (enum: EARNED, CASUAL, MEDICAL, ...) | "Casual Leave" | Required, only 3 types in current UI (EL, CL, ML) |
| Leave Period | Date range picker | `startDate/endDate` (DateTime) | 2025-07-14 → 2025-07-17 | Start ≤ End, cannot be weekend/holiday |
| Working Days | Auto-calculated | `workingDays` (Int) | 4 | Calculated as inclusive calendar days |
| Reason for Leave | Textarea | `reason` (string) | "Family vacation" | Required, min 3 characters |
| Medical Certificate | File upload | `certificateUrl` (string?) | "uploads/cert-123.pdf" | Required when ML > 3 days, optional otherwise |
| Certificate Flag | Auto-set | `needsCertificate` (boolean) | true | Auto-set based on ML days > 3 |
| Status | System | `status` (enum) | PENDING | DRAFT → SUBMITTED → PENDING → APPROVED/REJECTED/CANCELLED |
| Policy Version | System | `policyVersion` (string) | "v1.1" | Auto-set on creation |
| Workflow Trail | System | `approvals[]` | See Approval model | Tracks 4-step approval chain |
| Balance Display | Read-only chips | Computed from Balance table | EL: 15, CL: 7, ML: 14 | Not stored, computed on demand |

## User Information (Auto-populated)

- **Name**: Pulled from `User.name` (read-only in form)
- **Email**: From authenticated user (read-only)
- **Department**: From `User.department` (read-only)
- **Role**: From `User.role` (read-only)

## Fields NOT in Current Implementation

The following fields are referenced in suggested schemas but **not currently implemented**:
- `contactAddress` - Contact address field
- `contactPhone` - Phone number field  
- `substitute` - Substitute employee assignment
- `substituteFrom/substituteTo` - Substitute dates
- `designation` - Employee designation/title
- `balanceSnapshot` - Snapshot of balances at submission
- `actualReturnDate` - Actual return date (for overstay tracking)
- `overstay` - Overstay flag
- Multiple attachment types (currently only medical certificate)

These may be added in future versions.

## Current Prisma Schema (LeaveRequest)

```prisma
model LeaveRequest {
  id              Int           @id @default(autoincrement())
  requesterId     Int           // FK to User.id
  type            LeaveType     // enum: EARNED, CASUAL, MEDICAL, ...
  startDate       DateTime
  endDate         DateTime
  workingDays     Int           // inclusive calendar days
  reason          String        // required, min 3 chars
  needsCertificate Boolean      @default(false)
  certificateUrl  String?       // file path if certificate uploaded
  status          LeaveStatus   @default(DRAFT)
  policyVersion   String        // e.g. "v1.1"
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  requester       User          @relation(...)
  approvals       Approval[]    // 4-step approval chain
}
```

## Suggested Schema (Future Enhancement)

The following schema represents potential future enhancements:

## Current Validation Rules

See [Validation Rules Documentation](./Validation_Rules.md) for complete details.

**Key Validations**:
- Type required; startDate/endDate required
- `workingDays` = (endDate - startDate) + 1 (inclusive calendar days)
- CL: workingDays <= 3 AND sumYear(CL) + workingDays <= 10
- ML: sumYear(ML) + workingDays <= 14 AND if workingDays > 3 ⇒ certificate required
- EL: elBalance >= workingDays (with carry-forward cap of 60)
- EL: Requires 15 days advance notice (hard block)
- CL: 5-day notice warning (soft, allows submission)
- CL: Cannot touch holidays/weekends (hard block)
- Backdating: EL/ML allowed up to 30 days, CL disallowed

**Status Values**:
- `DRAFT` → Employee creates
- `SUBMITTED` → Employee submits
- `PENDING` → In approval chain
- `APPROVED` → Final approval
- `REJECTED` → Final rejection
- `CANCELLED` → Employee cancelled

## Leave Type Labels (Current Implementation)

| Code | Full Name | In UI |
|------|-----------|-------|
| EARNED | Earned Leave | ✅ "Earned Leave" |
| CASUAL | Casual Leave | ✅ "Casual Leave" |
| MEDICAL | Medical Leave | ✅ "Sick Leave" |

**Other Types** (in schema but not in current UI):
- EXTRAWITHPAY → "Extraordinary Leave (with pay)"
- EXTRAWITHOUTPAY → "Extraordinary Leave (without pay)"
- MATERNITY → "Maternity Leave"
- PATERNITY → "Paternity Leave"
- STUDY → "Study Leave"
- SPECIAL_DISABILITY → "Special Disability Leave"
- QUARANTINE → "Quarantine Leave"

## Related Documentation

- **Database Schema**: [03-Database-Schema.md](./03-Database-Schema.md)
- **Validation Rules**: [Validation_Rules.md](./Validation_Rules.md)
- **Form Implementation**: `app/leaves/apply/_components/apply-leave-form.tsx`
