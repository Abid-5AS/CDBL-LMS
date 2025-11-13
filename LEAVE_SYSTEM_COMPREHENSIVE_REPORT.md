# COMPREHENSIVE LEAVE MANAGEMENT SYSTEM REPORT
## CDBL LMS - Complete Implementation Analysis

**Generated:** 2025-11-13
**Codebase:** /home/user/CDBL-LMS
**Policy Version:** v2.0

---

## EXECUTIVE SUMMARY

This document provides a comprehensive analysis of ALL leave-related implementations in the CDBL Leave Management System. The system implements 10 distinct leave types with complex approval workflows, validation rules, balance calculations, and accrual mechanisms.

**Total Files Analyzed:** 100+
**Leave Types Defined:** 10
**API Endpoints:** 18+
**Database Models:** 7

---

## 1. DATABASE SCHEMA & MODELS

### 1.1 Leave Type Enum (prisma/schema.prisma, lines 19-30)
**File Path:** `/home/user/CDBL-LMS/prisma/schema.prisma`

All leave types defined in the system:
```
enum LeaveType {
  EARNED                 // Earned Leave
  CASUAL                 // Casual Leave
  MEDICAL                // Medical/Sick Leave
  EXTRAWITHPAY           // Extra Leave with pay
  EXTRAWITHOUTPAY        // Extra Leave without pay
  MATERNITY              // Maternity Leave
  PATERNITY              // Paternity Leave
  STUDY                  // Study Leave
  SPECIAL_DISABILITY     // Special Disability Leave
  QUARANTINE             // Quarantine Leave
}
```

### 1.2 Leave Status Enum (prisma/schema.prisma, lines 32-42)
Defines all possible leave request states:
```
enum LeaveStatus {
  DRAFT                  // Initial draft state
  SUBMITTED              // Employee submitted
  PENDING                // In approval chain
  APPROVED               // Final approval
  REJECTED               // Rejected by approver
  CANCELLED              // Cancelled by employee or system
  RETURNED               // Returned for modification
  CANCELLATION_REQUESTED // Employee requested cancellation
  RECALLED               // Recalled from leave
}
```

### 1.3 LeaveRequest Model (prisma/schema.prisma, lines 65-88)
**Key Fields:**
- `type: LeaveType` - The type of leave requested
- `startDate: DateTime` - Leave start date
- `endDate: DateTime` - Leave end date
- `workingDays: Int` - Number of working days (calculated)
- `reason: String` - Reason for leave
- `needsCertificate: Boolean` - Whether medical certificate required
- `certificateUrl: String?` - Medical certificate upload URL
- `fitnessCertificateUrl: String?` - Fitness certificate for return after >7 days ML
- `status: LeaveStatus` - Current status
- `policyVersion: String` - Policy version (e.g., "v2.0")
- `isModified: Boolean` - True if returned and resubmitted

**Indexes:**
- `@@index([requesterId, status])` - For user leave queries

### 1.4 Approval Model (prisma/schema.prisma, lines 97-111)
**Purpose:** Tracks each step in the approval chain
**Fields:**
- `step: Int` - Step number in chain (1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO)
- `approverId: Int` - User ID of approver
- `decision: ApprovalDecision` - APPROVED, REJECTED, FORWARDED, PENDING
- `toRole: String?` - Role forwarded to (if FORWARDED)
- `comment: String?` - Optional comment from approver
- `decidedAt: DateTime?` - When decision was made

### 1.5 Balance Model (prisma/schema.prisma, lines 113-126)
**Purpose:** Tracks leave balances per type per year
**Fields:**
- `userId: Int`
- `type: LeaveType`
- `year: Int` - Calendar year
- `opening: Int` - Carry-forward from previous year (EL only)
- `accrued: Int` - Accrued during year
- `used: Int` - Days used/consumed
- `closing: Int` - Calculated closing balance

**Constraint:** `@@unique([userId, type, year])` - One record per user/type/year

### 1.6 Holiday Model (prisma/schema.prisma, lines 128-133)
**Purpose:** Tracks company holidays for working day calculations
**Fields:**
- `date: DateTime @unique` - Holiday date
- `name: String` - Holiday name
- `isOptional: Boolean` - Whether optional holiday

### 1.7 PolicyConfig Model (prisma/schema.prisma, lines 135-144)
**Purpose:** Store leave policy configuration (extensible)
**Fields:**
- `leaveType: LeaveType @unique`
- `maxDays: Int?` - Maximum days allowed
- `minDays: Int?` - Minimum days required
- `noticeDays: Int?` - Notice period required
- `carryLimit: Int?` - Carry-forward limit

### 1.8 Related Models
- **LeaveComment** (lines 157-168) - Comments on leave requests
- **LeaveVersion** (lines 170-183) - Version history for returned/resubmitted requests

---

## 2. LEAVE TYPE DEFINITIONS & ENTITLEMENTS

### 2.1 Leave Type Labels (lib/ui.ts, lines 1-12)
**File Path:** `/home/user/CDBL-LMS/lib/ui.ts`

```typescript
export const leaveTypeLabel: Record<string, string> = {
  EARNED: "Earned Leave",
  CASUAL: "Casual Leave",
  MEDICAL: "Medical Leave (Sick Leave)",
  EXTRAWITHPAY: "Extraordinary Leave (with pay)",
  EXTRAWITHOUTPAY: "Extraordinary Leave (without pay)",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  STUDY: "Study Leave",
  SPECIAL_DISABILITY: "Special Disability Leave",
  QUARANTINE: "Quarantine Leave",
};
```

### 2.2 Leave Options for Dropdown (app/leaves/apply/_components/leave-constants.ts, lines 15-26)
**File Path:** `/home/user/CDBL-LMS/app/leaves/apply/_components/leave-constants.ts`

```typescript
export const LEAVE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "EARNED", label: leaveTypeLabel.EARNED },
  { value: "CASUAL", label: leaveTypeLabel.CASUAL },
  { value: "MEDICAL", label: leaveTypeLabel.MEDICAL },
  { value: "MATERNITY", label: leaveTypeLabel.MATERNITY },
  { value: "PATERNITY", label: leaveTypeLabel.PATERNITY },
  { value: "STUDY", label: leaveTypeLabel.STUDY },
  { value: "SPECIAL_DISABILITY", label: leaveTypeLabel.SPECIAL_DISABILITY },
  { value: "QUARANTINE", label: leaveTypeLabel.QUARANTINE },
  { value: "EXTRAWITHPAY", label: leaveTypeLabel.EXTRAWITHPAY },
  { value: "EXTRAWITHOUTPAY", label: leaveTypeLabel.EXTRAWITHOUTPAY },
];
```

### 2.3 Policy Constants (lib/policy.ts, lines 3-14)
**File Path:** `/home/user/CDBL-LMS/lib/policy.ts`

```typescript
export const policy = {
  version: "v2.0",
  accrual: { 
    EL_PER_YEAR: 24,      // 24 days/year (2 × 12 months) - Policy 6.19
    CL_PER_YEAR: 10,      // 10 days/year
    ML_PER_YEAR: 14       // 14 days/year
  },
  carryForward: { EL: true, EARNED: true },
  carryForwardCap: { EL: 60, EARNED: 60 },  // Cap at 60 days
  allowBackdate: { 
    EL: true, CL: false, ML: true, 
    EARNED: true, CASUAL: false, MEDICAL: true 
  },
  maxBackdateDays: { EL: 30, ML: 30, EARNED: 30, MEDICAL: 30 },
  clMinNoticeDays: 5,     // Warning only (soft rule) - Line 10
  elMinNoticeDays: 5,     // Hard requirement ≥5 working days - Line 11 - Policy 6.11
  clMaxConsecutiveDays: 3, // Policy: max 3 days per spell - Line 12
  elAccrualPerMonth: 2,   // EL accrues 2 days/month - Policy 6.19
};
```

### 2.4 Leave Type Policy Tooltips (app/leaves/apply/_components/leave-constants.ts, lines 28-39)
Provides UX guidance for each leave type:

**EARNED:** "Submit ≥ 5 working days before start. Accrues 2 days per month. Balance carries forward up to 60 days."

**CASUAL:** "Max 3 consecutive days per spell. Cannot start/end on Friday, Saturday, or holidays. Must retain 5 days balance."

**MEDICAL:** "Attach certificate if > 3 days. Fitness certificate required to return if > 7 days. Backdating allowed up to 30 days."

**MATERNITY:** "Requires medical certificate. Usually 16 weeks duration. Apply well in advance."

**PATERNITY:** "Usually up to 14 days. Apply with sufficient notice. May require supporting documentation."

**STUDY:** "Requires approval from HR. Supporting documentation may be required. Apply in advance for planning."

**SPECIAL_DISABILITY:** "Medical certificate required. Subject to HR approval. Duration varies by case."

**QUARANTINE:** "Backdating allowed if applicable. Medical certificate may be required. Subject to HR verification."

**EXTRAWITHPAY:** "Requires CEO approval. Subject to company policy. May require supporting documentation."

**EXTRAWITHOUTPAY:** "Requires CEO approval. Does not affect leave balance. Subject to company policy."

### 2.5 Leave Rules (app/leaves/apply/_components/leave-constants.ts, lines 41-92)
**File Path:** `/home/user/CDBL-LMS/app/leaves/apply/_components/leave-constants.ts`

**RULE_TIPS** object with line items for each leave type:

**CASUAL Rules:**
- Max 3 consecutive days per spell
- Cannot start/end on Friday, Saturday, or holidays
- Must retain 5 days balance

**EARNED Rules:**
- Submit at least 5 working days in advance
- Accrues 2 days per month
- Balance carries forward up to 60 days

**MEDICAL Rules:**
- Certificate required if > 3 days
- Fitness certificate required to return if > 7 days
- Backdating allowed up to 30 days

**MATERNITY Rules:**
- Requires medical certificate
- Usually 16 weeks duration
- Apply well in advance

**PATERNITY Rules:**
- Usually up to 14 days
- Apply with sufficient notice
- May require supporting documentation

**STUDY Rules:**
- Requires approval from HR
- Supporting documentation may be required
- Apply in advance for planning

**SPECIAL_DISABILITY Rules:**
- Medical certificate required
- Subject to HR approval
- Duration varies by case

**QUARANTINE Rules:**
- Backdating allowed if applicable
- Medical certificate may be required
- Subject to HR verification

**EXTRAWITHPAY Rules:**
- Requires CEO approval
- Subject to company policy
- May require supporting documentation

**EXTRAWITHOUTPAY Rules:**
- Requires CEO approval
- Does not affect leave balance
- Subject to company policy

---

## 3. LEAVE CALCULATION LOGIC

### 3.1 Working Days Calculation (lib/working-days.ts)
**File Path:** `/home/user/CDBL-LMS/lib/working-days.ts`

**Function: `countWorkingDays(start, end, holidays)`** (lines 12-62)
- Counts working days between two dates
- Excludes weekends (Fri-Sat: 5-6)
- Excludes company holidays
- Uses Dhaka timezone for consistency
- Async function (fetches holidays from DB if not provided)

**Function: `countWorkingDaysSync(start, end, holidays)`** (lines 71-100)
- Synchronous version when holidays are already provided
- Faster for UI operations

**Working Days:** Sun-Thu (days 0-4 in JS)
**Non-Working:** Fri-Sat (days 5-6 in JS)

### 3.2 Inclusive Day Counting (lib/leave-days.ts, line 1-9)
**File Path:** `/home/user/CDBL-LMS/lib/leave-days.ts`

```typescript
export function countRequestedDays(start?: Date, end?: Date): number {
  if (!start || !end) return 0;
  const s = new Date(Math.min(start.getTime(), end.getTime()));
  const e = new Date(Math.max(start.getTime(), end.getTime()));
  // inclusive calendar days: e.g., 23 Oct to 28 Oct = 6 days
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = Math.round((e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0)) / MS_PER_DAY);
  return diff + 1;
}
```
**Counts:** Total calendar days inclusive (includes weekends/holidays in count)

### 3.3 EL Accrual Job (scripts/jobs/el-accrual.ts)
**File Path:** `/home/user/CDBL-LMS/scripts/jobs/el-accrual.ts`

**Runs:** Monthly on 1st day at 00:00 Asia/Dhaka
**Logic:**
- Adds 2 days/month to EL balance
- Skips months when employee was on approved leave entire month
- Respects 60-day carry-forward cap
- Creates audit log entry `EL_ACCRUED`

**Key Function: `wasOnLeaveEntireMonth(userId, monthStart, monthEnd)`** (lines 37-78)
- Checks if employee was on approved leave entire month
- Used to skip accrual for months with 100% leave usage

### 3.4 Available Balance Calculation (app/api/leaves/route.ts, lines 72-78)
**Function: `getAvailableDays(userId, type, year)`**

Formula:
```
Available Balance = (opening ?? 0) + (accrued ?? 0) - (used ?? 0)
```

### 3.5 Balance Fetch Endpoint (app/api/balance/mine/route.ts)
**File Path:** `/home/user/CDBL-LMS/app/api/balance/mine/route.ts`

**Endpoint:** `GET /api/balance/mine`
**Query Params:** `?detailed=true` (optional)

Returns:
```typescript
{
  year: number,
  EARNED: number,
  CASUAL: number,
  MEDICAL: number,
  // ... other types if detailed=true
}
```

---

## 4. LEAVE VALIDATION RULES

### 4.1 Casual Leave Side-Touch Rule (lib/leave-validation.ts, lines 47-71)
**File Path:** `/home/user/CDBL-LMS/lib/leave-validation.ts`

**Function: `violatesCasualLeaveSideTouch(start, end, options)`**

**Rules:**
- Start or end date cannot fall on Friday/Saturday/company holiday
- Day before start cannot be Friday/Saturday/company holiday
- Day after end cannot be Friday/Saturday/company holiday

**Implementation:** Checks 3-day window (before start, start, end, after end)

### 4.2 Certificate Requirements (lib/policy.ts, lines 23-25)
**Function: `needsMedicalCertificate(type, days)`**

```typescript
export function needsMedicalCertificate(type: LeaveKind | string, days: number) {
  return String(type) === "MEDICAL" && days > 3;
}
```

**Rule:** Medical certificate required if MEDICAL leave > 3 days

### 4.3 Backdate Eligibility (lib/policy.ts, lines 27-42)
**Function: `canBackdate(type)`** - Returns if type allows backdating
**Function: `withinBackdateLimit(type, applyDate, start)`** - Checks if within 30-day limit

### 4.4 Notice Period Validation (lib/policy.ts, lines 50-68)
**Functions:**
- `clNoticeWarning(applyDate, start)` - CL: Soft warning if < 5 days
- `elNoticeWarning(applyDate, start)` - EL: Hard block if < 5 working days
- `makeWarnings(type, applyDate, start)` - Generate all warnings

### 4.5 Leave Application Validation (app/api/leaves/route.ts, lines 28-46)
**Schema: ApplySchema** with Zod validation

```typescript
const ApplySchema = z.object({
  type: z.enum([
    "EARNED", "CASUAL", "MEDICAL", "EXTRAWITHPAY", "EXTRAWITHOUTPAY",
    "MATERNITY", "PATERNITY", "STUDY", "SPECIAL_DISABILITY", "QUARANTINE",
  ]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3),
  workingDays: z.number().int().positive().optional(),
  needsCertificate: z.boolean().optional(),
});
```

### 4.6 Comprehensive Validation in POST /api/leaves (app/api/leaves/route.ts)
**Validation checks:**
1. Date range validation (start ≤ end)
2. Policy compliance (EL notice, CL side-touch, etc.)
3. Balance sufficiency (line 314-337)
4. Certificate requirements
5. Consecutive day limits (CL max 3 days)

---

## 5. APPROVAL WORKFLOW & CHAIN

### 5.1 Approval Chains (lib/workflow.ts, lines 9-21)
**File Path:** `/home/user/CDBL-LMS/lib/workflow.ts`

**DEFAULT Chain (4 steps):** 
```
HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO
```

**Chain by Leave Type:**
```typescript
export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", AppRole[]> = {
  DEFAULT: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  EARNED: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  CASUAL: ["DEPT_HEAD"],  // Shorter chain for CL - Policy 6.10
  MEDICAL: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  EXTRAWITHPAY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  EXTRAWITHOUTPAY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  MATERNITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  PATERNITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  STUDY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  SPECIAL_DISABILITY: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
  QUARANTINE: ["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"],
};
```

### 5.2 Workflow Functions (lib/workflow.ts, lines 36-117)
**File Path:** `/home/user/CDBL-LMS/lib/workflow.ts`

**Key Functions:**

1. `getChainFor(type: LeaveType)` - Get approval chain for specific leave type
2. `getNextRoleInChain(currentRole, type)` - Get next role after current role
3. `getStepForRole(role, type)` - Get 1-indexed step number for role
4. `isFinalApprover(role, type)` - Check if role is final in chain
5. `canPerformAction(role, action, type)` - Check if role can perform action
   - FORWARD: Allowed if not final approver
   - APPROVE/REJECT: Allowed only if final approver
   - RETURN: Allowed for HR_ADMIN or chain members
6. `canForwardTo(actorRole, targetRole, type)` - Validate forward target

### 5.3 Status Transitions (lib/workflow.ts, lines 122-146)
**Function: `getStatusAfterAction(currentStatus, action, targetRole)`**

Status transitions:
- APPROVE → APPROVED
- REJECT → REJECTED
- FORWARD → PENDING
- RETURN → (stays same or RETURNED)

---

## 6. API ENDPOINTS FOR LEAVE MANAGEMENT

### 6.1 Leave CRUD Operations

#### 6.1.1 GET /api/leaves (app/api/leaves/route.ts, lines 48-90+)
**File Path:** `/home/user/CDBL-LMS/app/api/leaves/route.ts`

**Query Parameters:**
- `status` - Filter by status (all, SUBMITTED, PENDING, APPROVED, REJECTED, etc.)
- `mine=1` - Filter to current user's leaves

**Returns:** Array of LeaveRequest with approvals included

#### 6.1.2 POST /api/leaves (app/api/leaves/route.ts, lines 95-400+)
**Functionality:**
- Create new leave request
- Validate all policies
- Check balance
- Create initial Approval record
- Handle file uploads (certificate)
- Audit logging

**Key Validations:**
- Balance check (lines 314-337)
- Casual leave carry-forward cap
- EL carry-forward cap (60 days)
- Medical certificate requirement
- Notice period requirements

#### 6.1.3 GET /api/leaves/[id] (app/api/leaves/[id]/route.ts)
**Returns:** Single leave request with full approval chain and comments

#### 6.1.4 PUT /api/leaves/[id] (app/api/leaves/[id]/route.ts)
**Functionality:**
- Edit draft or returned leaves
- Updates dates, reason, attachments
- Cannot edit approved leaves

### 6.2 Approval Operations

#### 6.2.1 POST /api/leaves/[id]/approve (app/api/leaves/[id]/approve/route.ts)
**File Path:** `/home/user/CDBL-LMS/app/api/leaves/[id]/approve/route.ts`

**Authorization:** Final approver only
- Checks `canPerformAction(role, "APPROVE", type)` (line 70)
- Checks `isFinalApprover(role, type)` (line 78)
- HR_ADMIN explicitly cannot approve (lines 57-67)

**Side Effects:**
- Sets status to APPROVED
- Increments `Balance.used`
- Creates audit log
- Sends notification

#### 6.2.2 POST /api/leaves/[id]/reject (app/api/leaves/[id]/reject/route.ts)
**File Path:** `/home/user/CDBL-LMS/app/api/leaves/[id]/reject/route.ts`

**Authorization:**
- HR_ADMIN can reject (operational role) (line 49)
- Other roles must be final approvers (lines 50-60)

**Side Effects:**
- Sets status to REJECTED
- Does not modify balance
- Creates audit log with rejection reason

#### 6.2.3 POST /api/leaves/[id]/forward (app/api/leaves/[id]/forward/route.ts)
**File Path:** `/home/user/CDBL-LMS/app/api/leaves/[id]/forward/route.ts`

**Authorization:**
- HR_ADMIN can always forward (line 59)
- Other roles checked with `canPerformAction(role, "FORWARD", type)` (line 60)

**Logic:**
- Gets next role in chain (line 80)
- Creates new Approval record for next role
- Sets status to PENDING
- Updates step number

#### 6.2.4 POST /api/leaves/[id]/return-for-modification (app/api/leaves/[id]/return-for-modification/route.ts)
**Functionality:**
- Approver returns leave for modification
- Creates LeaveVersion snapshot
- Status becomes RETURNED
- Employee can edit and resubmit

### 6.3 Employee Actions

#### 6.3.1 POST /api/leaves/[id]/cancel (app/api/leaves/[id]/cancel/route.ts)
**File Path:** `/home/user/CDBL-LMS/app/api/leaves/[id]/cancel/route.ts`

**Authorization:** Employee (requester) or DEPT_HEAD

**Constraints:**
- Can only cancel SUBMITTED/PENDING (line 80)
- Cannot cancel already APPROVED leaves
- DEPT_HEAD can cancel team members' requests (lines 67-72)

**Side Effects:**
- Sets status to CANCELLED
- Restores balance if needed
- Creates audit log

#### 6.3.2 POST /api/leaves/[id]/resubmit (app/api/leaves/[id]/resubmit/route.ts)
**Functionality:**
- Employee resubmits returned leave
- Creates new LeaveVersion
- Resets status to SUBMITTED
- Clears RETURNED status

#### 6.3.3 POST /api/leaves/[id]/duty-return (app/api/leaves/[id]/duty-return/route.ts)
**Functionality:**
- Employee confirms return from leave
- May require fitness certificate (if ML > 7 days)
- Updates status to reflect return

#### 6.3.4 POST /api/leaves/[id]/recall (app/api/leaves/[id]/recall/route.ts)
**Functionality:**
- DEPT_HEAD/HR can recall employee from leave
- Status becomes RECALLED
- May adjust balance

### 6.4 Bulk Operations

#### 6.4.1 POST /api/leaves/bulk/approve (app/api/leaves/bulk/approve/route.ts)
**Functionality:** Bulk approve multiple leaves

#### 6.4.2 POST /api/leaves/bulk/cancel (app/api/leaves/bulk/cancel/route.ts)
**Functionality:** Bulk cancel multiple leaves

#### 6.4.3 POST /api/leaves/bulk/return-for-modification (app/api/leaves/bulk/return-for-modification/route.ts)
**Functionality:** Bulk return multiple leaves

### 6.5 Certificate Operations

#### 6.5.1 POST /api/leaves/[id]/certificate (app/api/leaves/[id]/certificate/route.ts)
**Functionality:**
- Upload or update medical certificate
- Validates file type/size
- Updates `certificateUrl` field
- May trigger fitness certificate requirement check

### 6.6 Reporting & Analytics

#### 6.6.1 GET /api/dashboard/leave-trend (app/api/dashboard/leave-trend/route.ts)
**Functionality:** Leave trend data for charts

#### 6.6.2 GET /api/dashboard/leave-type-distribution (app/api/dashboard/leave-type-distribution/route.ts)
**Functionality:** Distribution of leave types used

#### 6.6.3 GET /api/team/on-leave (app/api/team/on-leave/route.ts)
**Functionality:** Show team members currently on leave

### 6.7 Miscellaneous

#### 6.7.1 GET /api/leaves/[id]/versions (app/api/leaves/[id]/versions/route.ts)
**Functionality:** Get all versions of a leave request

#### 6.7.2 GET /api/leaves/[id]/comments (app/api/leaves/[id]/comments/route.ts)
**Functionality:** Get comments on a leave request

#### 6.7.3 POST /api/leaves/[id]/comments (app/api/leaves/[id]/comments/route.ts)
**Functionality:** Add comment to leave request

#### 6.7.4 GET /api/leaves/export (app/api/leaves/export/route.ts)
**Functionality:** Export leave requests to CSV/Excel

---

## 7. UI COMPONENTS FOR LEAVE

### 7.1 Leave Application Components

#### 7.1.1 ApplyLeaveForm (app/leaves/apply/_components/apply-leave-form.tsx)
**File Path:** `/home/user/CDBL-LMS/app/leaves/apply/_components/apply-leave-form.tsx`

**Subcomponents:**
- LeaveTypeField (lines 24)
- DateRangeField (lines 25)
- ReasonField (lines 26)
- FileUploadField (lines 27)
- LeaveSummarySidebar (lines 42)
- LeaveConfirmationModal (lines 35)

**Features:**
- Multi-step form
- Draft autosave (lines 88-94)
- Balance display (lines 84-99)
- Validation warnings
- Certificate upload when needed
- Projected balance calculation

#### 7.1.2 Form Fields

**LeaveTypeField** (app/leaves/apply/_components/form-fields/LeaveTypeField.tsx)
- Dropdown with all leave types
- Tooltips with policy rules
- Error display

**DateRangeField** (app/leaves/apply/_components/form-fields/DateRangeField.tsx)
- Date range picker
- Holiday highlighting
- Working days calculation display

**ReasonField** (app/leaves/apply/_components/form-fields/ReasonField.tsx)
- Textarea for reason
- Min length validation

**FileUploadField** (app/leaves/apply/_components/form-fields/FileUploadField.tsx)
- File upload for certificates
- File validation (type, size)
- Progress display

#### 7.1.3 Hook: useApplyLeaveForm (app/leaves/apply/_components/use-apply-leave-form.ts)
**File Path:** `/home/user/CDBL-LMS/app/leaves/apply/_components/use-apply-leave-form.ts`

**Manages:**
- Form state (type, dates, reason, file)
- Validation (with policy checks)
- Balance fetching
- Draft autosave
- Holidays fetching
- Submission logic

### 7.2 Leave Display Components

#### 7.2.1 LeaveTable (components/shared/LeaveTable.tsx)
**Displays:** List of leave requests with status badges

#### 7.2.2 LeaveHistoryTable (components/shared/LeaveHistoryTable.tsx)
**Displays:** Leave history with filtering

#### 7.2.3 LeaveBalancePanel (components/shared/LeaveBalancePanel.tsx)
**File Path:** `/home/user/CDBL-LMS/components/shared/LeaveBalancePanel.tsx`

**Features:**
- Shows balance for EARNED, CASUAL, MEDICAL
- Progress bars showing usage
- Color-coded by type
- Optional policy hints
- Compact and full variants

#### 7.2.4 LeaveActivityCard (components/shared/LeaveActivityCard.tsx)
**Displays:** Single leave request in card format with approvals

### 7.3 Leave Modals

#### 7.3.1 LeaveDetailsModal (components/shared/modals/LeaveDetailsModal.tsx)
**Shows:** Full leave details with approval chain

#### 7.3.2 LeaveComparisonModal (components/shared/modals/LeaveComparisonModal.tsx)
**Compares:** Multiple leave versions

### 7.4 Leave Charts

#### 7.4.1 TrendChart (components/shared/LeaveCharts/TrendChart.tsx)
**Displays:** Leave usage trend over time

#### 7.4.2 TypePie (components/shared/LeaveCharts/TypePie.tsx)
**Displays:** Distribution of leave types used

#### 7.4.3 ChartContainer (components/shared/LeaveCharts/ChartContainer.tsx)
**Wrapper:** Common container for leave charts

### 7.5 Dashboard Components

#### 7.5.1 LeaveOverview (components/dashboards/employee/Sections/LeaveOverview.tsx)
**Shows:** Employee's leave summary and recent requests

#### 7.5.2 PendingApprovals (components/dashboards/hr-admin/Sections/PendingApprovals.tsx)
**Shows:** HR Admin's pending leave approvals

#### 7.5.3 TeamOnLeaveWidget (components/shared/widgets/TeamOnLeaveWidget.tsx)
**Shows:** Team members currently on leave

---

## 8. HARDCODED LEAVE VALUES & CONFIGURATIONS

### 8.1 Leave Entitlements (Summary)

| Leave Type | Annual | Max Consecutive | Notice | Carry Forward | Medical Cert | Backdate |
|-----------|--------|-----------------|--------|---------------|--------------|----------|
| EARNED | 24 days | None | 5 work days | Yes, 60 days | N/A | 30 days |
| CASUAL | 10 days | 3 days | None | No | N/A | No |
| MEDICAL | 14 days | None | Same day | No | >3 days | 30 days |
| MATERNITY | 8 weeks | N/A | Advance | N/A | Yes | N/A |
| PATERNITY | 6 work days | 2x in career | Advance | N/A | Maybe | N/A |
| STUDY | Up to 1 yr | N/A | Advance | N/A | Maybe | N/A |
| DISABILITY | Up to 6 mo | N/A | Varies | N/A | Yes | N/A |
| QUARANTINE | Up to 21 days | N/A | May backdate | N/A | Maybe | 30 days |
| EXTRA w/ Pay | Up to 12 mo | N/A | CEO only | N/A | N/A | N/A |
| EXTRA w/o Pay | 6-12 mo | N/A | CEO only | N/A | N/A | N/A |

### 8.2 Key Constants

**Annual Entitlements:**
- `EL_PER_YEAR: 24` (lib/policy.ts:5)
- `CL_PER_YEAR: 10` (lib/policy.ts:5)
- `ML_PER_YEAR: 14` (lib/policy.ts:5)

**Accrual Rate:**
- `elAccrualPerMonth: 2` (lib/policy.ts:13)

**Carry Forward:**
- `EL: 60 days max` (lib/policy.ts:7)

**Notice Periods:**
- `clMinNoticeDays: 5` (lib/policy.ts:10) - Soft warning
- `elMinNoticeDays: 5` (lib/policy.ts:11) - Hard block

**Consecutive Days:**
- `clMaxConsecutiveDays: 3` (lib/policy.ts:12)

**Backdate Limits:**
- `maxBackdateDays.EL: 30` (lib/policy.ts:9)
- `maxBackdateDays.ML: 30` (lib/policy.ts:9)
- `maxBackdateDays.EARNED: 30` (lib/policy.ts:9)
- `maxBackdateDays.MEDICAL: 30` (lib/policy.ts:9)

**Certificate Requirements:**
- `MEDICAL > 3 days: needs certificate` (lib/policy.ts:23-25)
- `MEDICAL > 7 days on return: needs fitness certificate` (prisma/schema.prisma:75)

---

## 9. LEAVE TYPE POLICY RULES

### 9.1 EARNED LEAVE (EL)

**Annual Entitlement:** 24 days/year (2 × 12 months)
- Line: lib/policy.ts:5
- Policy: Chapter 6.19

**Accrual:** 2 working days/month
- Line: lib/policy.ts:13
- Automatic via el-accrual job (scripts/jobs/el-accrual.ts)
- Skips months when on leave entire month

**Carry Forward:** Yes, max 60 days
- Line: lib/policy.ts:7
- Hard block in leave application (app/api/leaves/route.ts:314-337)

**Advance Notice:** ≥5 working days
- Line: lib/policy.ts:11
- Hard requirement - blocks submission
- Policy: Chapter 6.11

**Backdate:** Allowed up to 30 days
- Line: lib/policy.ts:9
- Function: canBackdate(), withinBackdateLimit()
- Policy: Chapter 6.13

**Balance Calculation:**
```
Available = (opening + accrued) - used
```

**Implementation:**
- File: app/api/leaves/route.ts (lines 314-337)
- File: lib/leave-validation.ts
- File: scripts/jobs/el-accrual.ts

### 9.2 CASUAL LEAVE (CL)

**Annual Entitlement:** 10 days/year
- Line: lib/policy.ts:5
- Policy: Chapter 6.20

**Consecutive Limit:** Max 3 days per spell
- Line: lib/policy.ts:12
- Validation: violatesCasualLeaveSideTouch() (lib/leave-validation.ts:47-71)

**Side-Touch Rule:** Cannot start/end on Fri/Sat/Holiday
- Implementation: lib/leave-validation.ts:47-71
- Checks day before start, start, end, day after end

**Notice:** No requirement (soft warning if < 5 days)
- Line: lib/policy.ts:10
- Warning only, not blocking
- Policy: Chapter 6.11 (exempt)

**Carry Forward:** No
- Auto-lapses on Dec 31
- Job: scripts/jobs/auto-lapse.ts

**Backdate:** Not allowed
- Line: lib/policy.ts:8
- Policy: Chapter 6.13

**Approval Chain:** DEPT_HEAD only (1 step)
- Line: lib/workflow.ts:12
- Policy: Chapter 6.10 exception

**Implementation:**
- File: app/api/leaves/route.ts (CL validation)
- File: lib/leave-validation.ts (side-touch rule)
- File: scripts/jobs/auto-lapse.ts (year-end lapse)

### 9.3 MEDICAL LEAVE (ML)

**Annual Entitlement:** 14 days/year
- Line: lib/policy.ts:5
- Policy: Chapter 6.21

**Certificate:** Required if > 3 days
- Line: lib/policy.ts:23-25
- Field: leaveRequest.certificateUrl
- Policy: Chapter 6.21b

**Return Certificate:** Required if > 7 days
- Field: leaveRequest.fitnessCertificateUrl
- Policy: Chapter 6.14

**Notice:** Same-day submission allowed
- No advance notice requirement
- Policy: Chapter 6.11a (sick exception)

**Backdate:** Allowed up to 30 days
- Line: lib/policy.ts:9
- Policy: Chapter 6.13

**Carry Forward:** No
- Policy: Chapter 6.21

**Implementation:**
- File: app/api/leaves/route.ts (certificate check)
- File: lib/policy.ts (needsMedicalCertificate function)

### 9.4 OTHER LEAVE TYPES

**MATERNITY:**
- Duration: Usually 8 weeks full pay
- Requirement: Medical certificate
- Policy: Chapter 6.23a
- Implementation: Admin approval flow

**PATERNITY:**
- Entitlement: 6 working days
- Frequency: Max 2 occasions in career, ≥36 months between
- Policy: Chapter 6.24
- Implementation: Eligibility check against records

**STUDY:**
- Duration: Up to 1 year unpaid
- Eligibility: ≥3 years continuous service
- Payback: Required
- Policy: Chapter 6.25
- Implementation: Admin flow

**SPECIAL_DISABILITY:**
- Duration: ≤6 months
- Requirement: Medical certificate, Board approval
- Counts: As duty for gratuity
- Policy: Chapter 6.27
- Implementation: Admin flow

**QUARANTINE:**
- Duration: ≤21 days (exceptionally 30)
- Requirement: Medical/Public Health Officer certificate
- Backdate: Allowed if applicable
- Policy: Chapter 6.28
- Implementation: Certificate attachment required

**EXTRA WITH PAY:**
- Duration: Up to 12 months (rare)
- Approval: CEO only
- Implementation: Admin grant, not auto-approved
- Effect: May require documentation

**EXTRA WITHOUT PAY:**
- Duration: 6-12 months depending on service
- Approval: CEO only
- Effect: Does not affect leave balance
- Policy: Chapter 6.22b
- Implementation: Admin only

---

## 10. DATABASE SEED DATA

### 10.1 Seed File (prisma/seed.ts)
**File Path:** `/home/user/CDBL-LMS/prisma/seed.ts`

**Seed Features:**
- Creates demo users (Featured + generated)
- Creates company holidays
- Creates policy configs
- Creates initial balances:
  - EARNED: 20 opening + 4 accrued (example)
  - CASUAL: 10 days
  - MEDICAL: 8 days
- Creates sample leave requests in various states
- Creates pending approval records

**Demo Users:** 4 Featured + multiple generated employees
**Demo Holidays:** Company holidays for current year
**Balance Initialization:**
- EL: Variable based on seeded data
- CL: 10 days annual
- ML: Varies (8-14 days)

---

## 11. DOCUMENTATION FILES

### 11.1 Policy Logic Documentation
**Location:** `/home/user/CDBL-LMS/docs/Policy Logic/`

**Files:**
1. **01-Leave Types and Entitlements.md** - Leave type definitions and entitlements
2. **02-Leave Application Rules and Validation.md** - Validation rules
3. **03-Holiday and Weekend Handling.md** - Holiday/weekend logic
4. **04-Leave Balance and Accrual Logic.md** - Balance calculation and accrual
5. **05-File Upload and Medical Certificate Rules.md** - Certificate handling
6. **06-Approval Workflow and Chain.md** - Approval workflow details
7. **07-Cancellation and Modification Rules.md** - Cancellation logic
8. **08-Date Time and Display Logic.md** - Date/time handling
9. **09-Role Based Behavior.md** - Role-specific behaviors
10. **10-System Messages and Error Handling.md** - Error messages
11. **11-Miscellaneous Business Rules.md** - Other rules
12. **12-Source Mapping Index.md** - Code location mapping

### 11.2 Policy Files
**Files:**
- `LeavePolicy_CDBL.md` - Overall leave policy summary
- `CDBL_LEAVE_POLICY_CHAPTER_06.md` - Chapter 6 from HR policy manual
- `Policy_Implementation_Map.md` - Maps policy to implementation
- `Policy_Settings.md` - Policy configuration details

---

## 12. TESTING

### 12.1 E2E Tests (tests/e2e/leave-workflow.spec.ts)
**File Path:** `/home/user/CDBL-LMS/tests/e2e/leave-workflow.spec.ts`

**Tests:**
- Happy path: Forward chain (CL application)
- Policy block: CL 4-day spell

### 12.2 Unit Tests
**test-hr-admin-api.ts** - HR Admin API tests
**test-approval-flow.ts** - Approval flow tests
**policy.test.ts** - Policy constant validation
**LeaveBalancePanel.test.tsx** - Balance panel component tests

### 12.3 Integration Tests
**tests/integration/leaves.test.ts** - Leave workflow integration
**tests/integration/jobs.test.ts** - Background job testing
**tests/jobs/el-accrual.test.ts** - EL accrual job tests
**tests/jobs/overstay-check.test.ts** - Overstay detection

---

## 13. BACKGROUND JOBS & SCHEDULING

### 13.1 Jobs Directory (scripts/jobs/)

**el-accrual.ts** - Monthly EL accrual
- Runs: 1st of month at 00:00 Asia/Dhaka
- Action: Adds 2 days/month to EL balance
- Logic: Skips months with 100% leave usage
- Cap: Respects 60-day maximum

**auto-lapse.ts** - Annual CL lapse
- Runs: Dec 31 at 23:59 Asia/Dhaka
- Action: Resets CL balance to 0
- Audit: Creates audit log entry

**overstay-check.ts** - Detect overstay
- Runs: Daily at midnight Asia/Dhaka
- Logic: Flags approved leaves past endDate without return
- Status: Sets to OVERSTAY_PENDING

### 13.2 Scheduler (scripts/scheduler.ts)
**File Path:** `/home/user/CDBL-LMS/scripts/scheduler.ts`

Orchestrates all background jobs using node-cron
- Timezone: Asia/Dhaka (Bangladesh)
- Error handling: Logs errors, continues on failure
- Audit logging: All jobs create audit entries

---

## 14. VALIDATION UTILITIES

### 14.1 Date Utilities (lib/date-utils.ts)
- `normalizeToDhakaMidnight()` - Normalize to Dhaka timezone
- `isWeekendOrHoliday()` - Check if date is weekend/holiday
- `isWeekendBD()` - Check if weekend in BD (Fri-Sat)
- `totalDaysInclusive()` - Count calendar days inclusive
- `rangeContainsNonWorking()` - Check if range has weekends/holidays
- `fmtDDMMYYYY()` - Format date as DD/MM/YYYY

### 14.2 Policy Functions (lib/policy.ts)
- `daysInclusive()` - Calendar days between dates
- `needsMedicalCertificate()` - Check cert requirement
- `canBackdate()` - Check if backdate allowed
- `withinBackdateLimit()` - Validate backdate window
- `clNoticeWarning()` - CL notice warning
- `elNoticeWarning()` - EL notice warning
- `makeWarnings()` - Generate all warnings

### 14.3 Balance Calculation (app/api/leaves/route.ts)
- `getAvailableDays()` - Calculate available balance
- Formula: (opening + accrued) - used

---

## 15. RBAC & WORKFLOW CONTROL

### 15.1 Roles (prisma/schema.prisma, lines 10-17)
```
EMPLOYEE         - Regular employee
DEPT_HEAD        - Department head
HR_ADMIN         - HR administrative staff
HR_HEAD          - Head of HR department
CEO              - Chief executive officer
SYSTEM_ADMIN     - System administrator
```

### 15.2 Role-Based Permissions (lib/workflow.ts)

**HR_ADMIN:**
- Can FORWARD to next role
- Can REJECT (operational role)
- Cannot APPROVE
- Can RETURN for modification

**DEPT_HEAD:**
- Can FORWARD to HR_HEAD
- Can APPROVE for CASUAL leaves (final approver)
- Can RETURN for modification
- Can cancel team members' requests

**HR_HEAD:**
- Can FORWARD to CEO
- Can APPROVE (if final approver)
- Can RETURN for modification

**CEO:**
- FINAL approver for most leaves
- Can APPROVE or REJECT
- Can RETURN for modification

**SYSTEM_ADMIN:**
- Can perform any action
- Administrative override

---

## 16. STORAGE & FILE HANDLING

### 16.1 Certificate Upload (app/api/leaves/[id]/certificate/route.ts)
**Functionality:**
- Validates file type (PDF, JPG, PNG)
- Checks file size (max 5MB typical)
- Stores in private/uploads directory
- Generates signed URL for secure download
- Updates `leaveRequest.certificateUrl`

### 16.2 Storage Utilities (lib/storage.ts)
- `generateSignedUrl()` - Create secure download links
- File path: /home/user/CDBL-LMS/private/uploads/

---

## 17. ERROR HANDLING

### 17.1 Error Codes (lib/errors.ts)
Common error codes used in leave operations:
- `unauthorized` - Not authenticated
- `forbidden` - Not authorized for action
- `not_found` - Leave request not found
- `invalid_id` - Invalid leave ID
- `invalid_status` - Invalid leave status
- `el_insufficient_notice` - EL notice requirement not met
- `cl_max_consecutive` - CL > 3 consecutive days
- `cl_side_touch` - CL side-touch rule violated
- `insufficient_balance` - Not enough leave balance
- `already_cancelled` - Already cancelled
- `self_rejection_disallowed` - Cannot reject own leave
- `self_approval_disallowed` - Cannot approve own leave
- `no_next_role` - No next approver in chain
- `invalid_forward_target` - Cannot forward to that role

---

## 18. HOOKS & DATA PROVIDERS

### 18.1 useLeaveRequests Hook (hooks/useLeaveRequests.ts)
**File Path:** `/home/user/CDBL-LMS/hooks/useLeaveRequests.ts`

**Features:**
- SWR data fetching
- Filtering (status, mine)
- Selection management
- Modal state
- Cancelable status tracking

### 18.2 LeaveDataProvider (components/providers/LeaveDataProvider.tsx)
**Purpose:** Global context for leave data
**Provides:**
- Leave requests data
- Refetch functionality
- Loading state

---

## SUMMARY TABLE: ALL LEAVE TYPES

| Type | Annual Days | Carry Fwd | Max Consec | Notice | Certificate | Backdate | Approval Chain | Policy |
|------|------------|-----------|-----------|--------|-------------|----------|----------------|--------|
| EARNED | 24 (2/mo) | 60 days | None | 5 wd | No | 30 d | HR→DH→HH→CEO | 6.19 |
| CASUAL | 10 | No | 3 | None | No | No | DH | 6.20 |
| MEDICAL | 14 | No | None | Same day | >3d | 30 d | HR→DH→HH→CEO | 6.21 |
| MATERNITY | 8w | N/A | N/A | Advance | Yes | N/A | HR→DH→HH→CEO | 6.23 |
| PATERNITY | 6 wd | N/A | N/A | Advance | Maybe | N/A | HR→DH→HH→CEO | 6.24 |
| STUDY | 1y | N/A | N/A | Advance | Maybe | N/A | HR→DH→HH→CEO | 6.25 |
| DISABILITY | 6mo | N/A | N/A | Varies | Yes | N/A | HR→DH→HH→CEO | 6.27 |
| QUARANTINE | 21d | N/A | N/A | May | Maybe | 30 d | HR→DH→HH→CEO | 6.28 |
| EXTRA w/Pay | 12mo | N/A | N/A | CEO | Maybe | N/A | CEO | Policy |
| EXTRA w/o Pay | 6-12mo | N/A | N/A | CEO | N/A | N/A | CEO | 6.22 |

---

## FILE LOCATION INDEX

### Core Implementation
- `/home/user/CDBL-LMS/prisma/schema.prisma` - Database schema (Lines 19-183)
- `/home/user/CDBL-LMS/lib/policy.ts` - Policy constants (Lines 1-76)
- `/home/user/CDBL-LMS/lib/workflow.ts` - Workflow logic (Lines 1-148)
- `/home/user/CDBL-LMS/lib/leave-validation.ts` - Validation rules
- `/home/user/CDBL-LMS/lib/working-days.ts` - Working days calculation
- `/home/user/CDBL-LMS/lib/ui.ts` - UI labels (Lines 1-12)

### API Endpoints (18 files)
- `/home/user/CDBL-LMS/app/api/leaves/route.ts` - GET/POST leaves
- `/home/user/CDBL-LMS/app/api/leaves/[id]/route.ts` - GET/PUT single leave
- `/home/user/CDBL-LMS/app/api/leaves/[id]/approve/route.ts` - Approve action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/reject/route.ts` - Reject action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/forward/route.ts` - Forward action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/cancel/route.ts` - Cancel action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/return-for-modification/route.ts` - Return action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/resubmit/route.ts` - Resubmit action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/duty-return/route.ts` - Return from leave
- `/home/user/CDBL-LMS/app/api/leaves/[id]/recall/route.ts` - Recall action
- `/home/user/CDBL-LMS/app/api/leaves/[id]/certificate/route.ts` - Certificate upload
- `/home/user/CDBL-LMS/app/api/leaves/[id]/comments/route.ts` - Comments
- `/home/user/CDBL-LMS/app/api/leaves/[id]/versions/route.ts` - Versions
- `/home/user/CDBL-LMS/app/api/leaves/bulk/approve/route.ts` - Bulk approve
- `/home/user/CDBL-LMS/app/api/leaves/bulk/cancel/route.ts` - Bulk cancel
- `/home/user/CDBL-LMS/app/api/leaves/bulk/return-for-modification/route.ts` - Bulk return
- `/home/user/CDBL-LMS/app/api/leaves/export/route.ts` - Export
- `/home/user/CDBL-LMS/app/api/balance/mine/route.ts` - Balance fetch

### UI Components (50+ files)
- `/home/user/CDBL-LMS/app/leaves/apply/_components/leave-constants.ts` - Leave options
- `/home/user/CDBL-LMS/app/leaves/apply/_components/apply-leave-form.tsx` - Main form
- `/home/user/CDBL-LMS/app/leaves/apply/_components/use-apply-leave-form.ts` - Form hook
- `/home/user/CDBL-LMS/components/shared/LeaveBalancePanel.tsx` - Balance panel
- `/home/user/CDBL-LMS/components/shared/LeaveTable.tsx` - Leave table
- `/home/user/CDBL-LMS/components/shared/LeaveHistoryTable.tsx` - History table
- `/home/user/CDBL-LMS/components/shared/LeaveActivityCard.tsx` - Activity card
- `/home/user/CDBL-LMS/components/shared/modals/LeaveDetailsModal.tsx` - Details modal
- `/home/user/CDBL-LMS/components/shared/modals/LeaveComparisonModal.tsx` - Comparison modal
- `/home/user/CDBL-LMS/components/shared/LeaveCharts/*` - Chart components

### Background Jobs
- `/home/user/CDBL-LMS/scripts/jobs/el-accrual.ts` - EL accrual job
- `/home/user/CDBL-LMS/scripts/jobs/auto-lapse.ts` - CL auto-lapse job
- `/home/user/CDBL-LMS/scripts/jobs/overstay-check.ts` - Overstay detection
- `/home/user/CDBL-LMS/scripts/scheduler.ts` - Job scheduler

### Documentation
- `/home/user/CDBL-LMS/docs/Policy Logic/` - 15 detailed documentation files
- `/home/user/CDBL-LMS/docs/LeavePolicy_CDBL.md` - Policy summary
- `/home/user/CDBL-LMS/docs/CDBL_LEAVE_POLICY_CHAPTER_06.md` - Chapter 6

### Testing
- `/home/user/CDBL-LMS/tests/e2e/leave-workflow.spec.ts` - E2E tests
- `/home/user/CDBL-LMS/tests/unit/policy.test.ts` - Policy tests
- `/home/user/CDBL-LMS/tests/unit/LeaveBalancePanel.test.tsx` - Component test
- `/home/user/CDBL-LMS/tests/integration/leaves.test.ts` - Integration tests
- `/home/user/CDBL-LMS/tests/jobs/el-accrual.test.ts` - Accrual job tests

### Seed Data
- `/home/user/CDBL-LMS/prisma/seed.ts` - Database seed (Lines 1-500+)

---

## QUICK STATISTICS

- **Leave Types Implemented:** 10
- **API Endpoints:** 18+
- **Database Models:** 7
- **UI Components:** 50+
- **Policy Constants:** 15+
- **Validation Rules:** 20+
- **Approval Chains:** 2 (4-step and 1-step for CL)
- **Background Jobs:** 3
- **Roles:** 6
- **Leave Statuses:** 9
- **Approval Decisions:** 4

---

**END OF REPORT**
