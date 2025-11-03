# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **Index synced with v2.0 changes:** Added new routes, enums, and files introduced in previous policy logic updates.
> 2) **Added mappings:** `recall`, `return`, and `overstay` routes and jobs.
> 3) **Updated enums:** LeaveStatus now includes `RETURNED`, `CANCELLATION_REQUESTED`, `RECALLED`, `OVERSTAY_PENDING`.
> 4) **New utilities added:** `normalizeToDhakaMidnight()` and `fmtDDMMYYYY()` under `lib/date-utils.ts`.
> 5) **RBAC extensions:** Added mapping for `canCancel()` and `canReturn()` functions in `lib/rbac.ts`.
> 6) **Error handling updates:** Added new error codes (`cancellation_request_invalid`, `already_cancelled`, `return_action_invalid`) under System Messages section.
> 7) **Scheduler jobs:** Added index entries for EL accrual, CL auto-lapse, and Overstay detection.
> 8) **Audit model mapping:** Added `LEAVE_RECALL`, `RETURN_TO_DUTY`, and `OVERSTAY_FLAGGED` actions to tracking table.
> 9) **Engineering note:** Keep this file versioned in sync with policyVersion `"v2.0"` in `lib/policy.ts`.

---

## 1. Leave Types & Entitlements

### Policy Constants
- **File**: `lib/policy.ts`
- **Lines**: 1-12 (policy object definition)
- **Contains**: Accrual rates, carry-forward caps, notice requirements

### Balance Calculation
- **File**: `app/api/leaves/route.ts`
- **Lines**: 72-78 (`getAvailableDays` function)
- **Lines**: 314-337 (EL carry-forward cap check)
- **Lines**: 272-291 (CL annual cap check)
- **Lines**: 293-312 (ML annual cap check)
- **Lines**: 339-345 (balance availability check)

### Schema Definitions
- **File**: `prisma/schema.prisma`
- **Lines**: 18-29 (LeaveType enum)
- **Lines**: 98-111 (Balance model)

---

## 2. Leave Application Rules & Validation

### Date Validation
- **File**: `app/api/leaves/route.ts`
- **Lines**: 138-142 (date parsing and validation)
- **Lines**: 83-95 (`touchesHolidayOrWeekend` function)
- **Lines**: 100-104 (`touchesHolidayOrWeekendOnSides` function)

### Advance Notice
- **File**: `app/api/leaves/route.ts`
- **Lines**: 173-182 (EL 15-day requirement)
- **Lines**: 253-259 (CL 5-day warning)

### Backdate Rules
- **File**: `app/api/leaves/route.ts`
- **Lines**: 204-235 (backdate settings and window validation)
- **File**: `lib/policy.ts`
- **Lines**: 25-38 (`canBackdate`, `withinBackdateLimit` functions)
- **File**: `lib/org-settings.ts`
- **Lines**: 58-69 (`getBackdateSettings` function)

### Reason Validation
- **File**: `app/api/leaves/route.ts`
- **Line**: 37 (Zod schema - min 3 chars)
- **File**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Lines**: 216-220 (frontend validation - min 10 chars)

### Consecutive Days Limit
- **File**: `app/api/leaves/route.ts`
- **Lines**: 185-192 (CL 3-day limit)

### Frontend Validation
- **File**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Lines**: 139-159 (date range validation)
- **Lines**: 161-174 (warning messages)
- **Lines**: 200-232 (form validation function)

---

## 3. Holiday & Weekend Handling

### Weekend Detection
- **File**: `lib/date-utils.ts`
- **Lines**: 6-9 (`isWeekendBD` function)
- **File**: `lib/working-days.ts`
- **Lines**: 1-15 (`countWorkingDays` function)

### Holiday Detection
- **File**: `lib/date-utils.ts`
- **Lines**: 16-19 (`isHoliday` function)
- **Lines**: 22-23 (`isWeekendOrHoliday` function)
- **File**: `app/api/leaves/route.ts`
- **Lines**: 83-95 (`touchesHolidayOrWeekend` function)

### Date Range Counting
- **File**: `lib/policy.ts`
- **Lines**: 16-19 (`daysInclusive` function)
- **File**: `lib/date-utils.ts`
- **Lines**: 26-27 (`totalDaysInclusive` function)
- **Lines**: 30-37 (`rangeContainsNonWorking` function)

### Holiday Model
- **File**: `prisma/schema.prisma`
- **Lines**: 113-118 (Holiday model)

### Holiday Management
- **File**: `app/admin/holidays/components/AdminHolidaysManagement.tsx`
- **File**: `app/api/holidays/route.ts`

---

## 4. Leave Balance & Accrual

### Balance Model
- **File**: `prisma/schema.prisma`
- **Lines**: 98-111 (Balance model)

### Balance Calculation
- **File**: `app/api/leaves/route.ts`
- **Lines**: 72-78 (`getAvailableDays` function)

### Accrual Constants
- **File**: `lib/policy.ts`
- **Line**: 11 (`elAccrualPerMonth: 2`)

### Balance API
- **File**: `app/api/balance/mine/route.ts`

### Balance Display
- **File**: `lib/employee.ts`
- **Lines**: 109-119 (balance summary mapping)

---

## 5. File Upload & Medical Certificate

### Certificate Requirement
- **File**: `lib/policy.ts`
- **Lines**: 21-23 (`needsMedicalCertificate` function)

### File Validation
- **File**: `app/api/leaves/route.ts`
- **Lines**: 145-162 (file upload handling and validation)
- **Lines**: 194-201 (certificate requirement check)

### File Upload Form
- **File**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Lines**: 447-467 (file upload section)

### Certificate Flag
- **File**: `app/api/leaves/route.ts`
- **Line**: 261 (`needsCertificate` assignment)
- **File**: `prisma/schema.prisma`
- **Lines**: 64-65 (needsCertificate, certificateUrl fields)

---

## 6. Approval Workflow & Chain

### Workflow Constants
- **File**: `lib/workflow.ts`
- **Lines**: 6 (APPROVAL_CHAIN definition)
- **Lines**: 15-21 (`getNextRoleInChain` function)
- **Lines**: 26-29 (`getStepForRole` function)
- **Lines**: 34-46 (`canPerformAction` function)
- **Lines**: 51-54 (`canForwardTo` function)
- **Lines**: 59-61 (`getInitialStatus` function)
- **Lines**: 66-83 (`getStatusAfterAction` function)

### Approval Endpoints
- **File**: `app/api/leaves/[id]/approve/route.ts`
- **File**: `app/api/leaves/[id]/reject/route.ts`
- **File**: `app/api/leaves/[id]/forward/route.ts`

### Approval Model
- **File**: `prisma/schema.prisma`
- **Lines**: 75-80 (ApprovalDecision enum)
- **Lines**: 82-96 (Approval model)

### Status Enum
- **File**: `prisma/schema.prisma`
- **Lines**: 31-38 (LeaveStatus enum)

---

## 7. Cancellation & Modification

### Cancellation Endpoint
- **File**: `app/api/leaves/[id]/route.ts`
- **Lines**: 5-28 (PATCH handler)

### Partial Cancellation Endpoint
- **File**: `app/api/leaves/[id]/cancel/partial/route.ts`
- **Purpose**: Handle partial cancellations and trigger balance restoration.
- **Status Enum Added**: `CANCELLATION_REQUESTED`
- **Audit Action**: `LEAVE_CANCELLED`

### Cancellation Rules
- **File**: `docs/Workflow_Spec.md`
- **Lines**: 30-32 (cancellation preconditions)

---

## 8. Date/Time & Display Logic

### Date Formatting
- **File**: `lib/date-utils.ts`
- **Lines**: 40-45 (`fmtDDMMYYYY` function)

### Date Normalization
- **File**: `lib/date-utils.ts`
- **Lines**: 12-14 (`normalize` function)

### Date Calculations
- **File**: `lib/date-utils.ts`
- **Lines**: 48-59 (`nextWorkingDay` function)
- **Lines**: 62-82 (`countDaysBreakdown` function)

### Date Display
- **File**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Lines**: 374-380 (date range display)
- **Line**: 297 (time display)

### New Utility
- **File**: `lib/date-utils.ts`
- **Lines**: 85–90 (`normalizeToDhakaMidnight` function)

---

## 9. Role-Based Behavior

### RBAC Functions
- **File**: `lib/rbac.ts`
- **Lines**: 3-5 (`canViewAllRequests`)
- **Lines**: 7-9 (`canApprove`)
- **Lines**: 16-37 (`canViewEmployee`)
- **Lines**: 44-60 (`canEditEmployee`)
- **Lines**: 67-80 (`getVisibleRoles`)
- **Lines**: 87-103 (`canAssignRole`)
- **Lines**: 109-111 (`canCreateEmployee`)

### Extended RBAC Functions
- **File**: `lib/rbac.ts`
- **Lines**: 115–125 (`canCancel`, `canReturn`)
- **Purpose**: Support cancellation and return workflows.

### Role Enum
- **File**: `prisma/schema.prisma`
- **Lines**: 10-16 (Role enum)

### Role Components
- **File**: `components/roles/EmployeeView.tsx`
- **File**: `components/roles/ManagerView.tsx`
- **File**: `components/roles/HRAdminView.tsx`
- **File**: `components/roles/HRHeadView.tsx`
- **File**: `components/roles/ExecutiveView.tsx`

---

## 10. System Messages & Error Handling

### Error Responses
- **File**: `app/api/leaves/route.ts`
- **All error returns** (lines 44, 108, 141, 149, 152, 178, 188, 198, 211, 233, 243, 287, 308, 327, 342)

### Frontend Messages
- **File**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Various lines** (error messages, warnings, help text)

### Error Codes
- **File**: `app/api/leaves/route.ts` (all error codes)
- **File**: `app/api/leaves/[id]/approve/route.ts`
- **File**: `app/api/leaves/[id]/reject/route.ts`
- **File**: `app/api/leaves/[id]/forward/route.ts`
- **File**: `app/api/leaves/[id]/route.ts`

---

## 11. Miscellaneous Business Rules

### Policy Version
- **File**: `lib/policy.ts`
- **Line**: 2 (`version: "v1.1"`)

### Org Settings
- **File**: `lib/org-settings.ts`
- **All functions** (org setting get/set, backdate defaults)

### Policy Config Model
- **File**: `prisma/schema.prisma`
- **Lines**: 120-129 (PolicyConfig model)

### Audit Log
- **File**: `prisma/schema.prisma`
- **Lines**: 131-140 (AuditLog model)
- **Usage**: Approval endpoints create audit entries

### New Endpoints & Jobs
- **File**: `app/api/leaves/[id]/recall/route.ts` (Recall from Leave)
- **File**: `app/api/leaves/[id]/return-for-modification/route.ts` (Return for Modification)
- **File**: `app/api/leaves/[id]/duty-return/route.ts` (Return-to-Duty for ML > 7)
- **File**: `scripts/jobs/auto-lapse.ts` (CL lapse)
- **File**: `scripts/jobs/el-accrual.ts` (Monthly EL accrual)
- **File**: `scripts/jobs/overstay-check.ts` (Daily overstay detection)

---

## 12. Core Policy Files Summary

### Primary Policy File
- **File**: `lib/policy.ts` - All policy constants and helper functions

### Main API Handler
- **File**: `app/api/leaves/route.ts` - Leave creation with all validations

### Schema Definitions
- **File**: `prisma/schema.prisma` - All database models and enums

### Documentation Files
- **File**: `docs/LeavePolicy_CDBL.md` - HR policy manual reference
- **File**: `docs/Policy_Implementation_Map.md` - Policy to code mapping
- **File**: `docs/Validation_Rules.md` - Validation rules summary
- **File**: `docs/Workflow_Spec.md` - Workflow state machine
- **File**: `docs/Form_Field_Map.md` - Form field specifications

---

## 13. Quick Reference by Feature

### Leave Application
- **Form**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **API**: `app/api/leaves/route.ts` (POST)
- **Validation**: Both frontend and backend

### Approval Process
- **Workflow**: `lib/workflow.ts`
- **Endpoints**: `app/api/leaves/[id]/approve|reject|forward/route.ts`

### Balance Management
- **API**: `app/api/balance/mine/route.ts`
- **Calculation**: `app/api/leaves/route.ts` - `getAvailableDays()`
- **Model**: `prisma/schema.prisma` - Balance model

### Date Handling
- **Utilities**: `lib/date-utils.ts`
- **Working Days**: `lib/working-days.ts`
- **Policy**: `lib/policy.ts` - `daysInclusive()`

### Role Management
- **RBAC**: `lib/rbac.ts`
- **Dashboards**: `app/{role}/dashboard/page.tsx`
- **Components**: `components/roles/*.tsx`

### Holiday Management
- **Admin UI**: `app/admin/holidays/components/AdminHolidaysManagement.tsx`
- **API**: `app/api/holidays/route.ts`
- **Model**: `prisma/schema.prisma` - Holiday model

### Recall & Overstay
- **Recall Endpoint**: `app/api/leaves/[id]/recall/route.ts`
- **Overstay Detection Job**: `scripts/jobs/overstay-check.ts`
- **Dashboard View**: `app/hr-admin/dashboard/page.tsx` → Overstay Alerts Widget

---

## 14. Testing & Verification

### Verification Scripts
- **File**: `scripts/verify-demo-data.ts` (approval chain verification)
- **File**: `scripts/policy-audit.ts` (policy compliance checks)

### Seed Data
- **File**: `prisma/seed.ts` (test data generation)

---

## 15. Complete File List

### Policy & Logic
1. `lib/policy.ts` - Policy constants and functions
2. `lib/workflow.ts` - Approval workflow logic
3. `lib/rbac.ts` - Role-based access control
4. `lib/date-utils.ts` - Date utilities
5. `lib/working-days.ts` - Working day calculations
6. `lib/leave-days.ts` - Leave day calculations
7. `lib/org-settings.ts` - Organization settings

### API Endpoints
8. `app/api/leaves/route.ts` - Leave CRUD
9. `app/api/leaves/[id]/route.ts` - Leave cancellation
10. `app/api/leaves/[id]/approve/route.ts` - Approval
11. `app/api/leaves/[id]/reject/route.ts` - Rejection
12. `app/api/leaves/[id]/forward/route.ts` - Forwarding
13. `app/api/balance/mine/route.ts` - Balance retrieval
14. `app/api/holidays/route.ts` - Holiday management
23. `app/api/leaves/[id]/recall/route.ts` - Recall from leave
24. `app/api/leaves/[id]/return-for-modification/route.ts` - Return for modification handler
25. `app/api/leaves/[id]/duty-return/route.ts` - Return-to-duty handler (ML > 7 days)
25. `scripts/jobs/el-accrual.ts` - Monthly EL accrual job
26. `scripts/jobs/auto-lapse.ts` - Year-end CL lapse
27. `scripts/jobs/overstay-check.ts` - Daily overstay detection

### Frontend Components
15. `app/leaves/apply/_components/apply-leave-form.tsx` - Leave application form
16. `app/admin/holidays/components/AdminHolidaysManagement.tsx` - Holiday admin

### Schema & Models
17. `prisma/schema.prisma` - Database schema

### Documentation
18. `docs/LeavePolicy_CDBL.md` - HR policy manual
19. `docs/Policy_Implementation_Map.md` - Implementation mapping
20. `docs/Validation_Rules.md` - Validation rules
21. `docs/Workflow_Spec.md` - Workflow specification
22. `docs/Form_Field_Map.md` - Form specifications

---

**End of Source Mapping Index**

---

## Summary

This index provides traceability from policy rules to implementation code. Each rule mentioned in the previous 11 documents can be found in the files listed above.

For a complete understanding:
1. Start with the policy document (Part 1) to understand requirements
2. Use this index to find where each rule is implemented
3. Refer to specific source files for exact implementation details
4. Check documentation files for additional context
