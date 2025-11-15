# CDBL-LMS: Master Specification Integration Plan

**Date**: 2025-11-14
**Purpose**: Comprehensive plan to integrate Master Specification requirements into current CDBL-LMS
**Status**: Ready for Approval & Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Implementation Plan](#implementation-plan)
5. [Phase Breakdown](#phase-breakdown)
6. [Testing Strategy](#testing-strategy)
7. [Success Criteria](#success-criteria)

---

## 1. Executive Summary

This document outlines the complete integration plan for implementing the CDBL-LMS Master Specification into the existing codebase. The master spec defines the authoritative requirements for:

- **Leave Policy Enforcement**: Exact implementation of CDBL Leave Policy (sections 6.1-6.29)
- **Hybrid Enforcement Model**: Role-based rule enforcement
- **11 Leave Types**: All leave types with specific validation rules
- **Approval Workflow**: 5-step chain (Employee → HR/Admin → Dept Head → HR Head → CEO)
- **5 Role-Based Dashboards**: Specific layouts and components
- **Modification & Cancellation**: Precise business logic
- **Notifications & Audit**: Complete tracking

### Current Implementation Status

**Overall Completeness**: ~75%

The CDBL-LMS codebase is well-architected with:
- ✅ All 11 leave types defined
- ✅ 6 user roles implemented
- ✅ Approval workflow engine
- ✅ Policy validation framework
- ✅ Dashboard infrastructure
- ✅ Notification system
- ✅ Audit logging

**Remaining Work**: ~25%
- Fine-tune leave-specific validation rules
- Implement hybrid enforcement model precisely
- Refactor dashboards to match exact spec
- Create reusable UI components
- Implement linked extension requests
- Verify all edge cases

---

## 2. Current State Analysis

### ✅ FULLY IMPLEMENTED (No Changes Needed)

#### 2.1 Database Schema & Types
- **Leave Types** ✅: All 11 types defined in Prisma schema
  ```typescript
  EARNED, CASUAL, MEDICAL, EXTRAWITHPAY, EXTRAWITHOUTPAY,
  MATERNITY, PATERNITY, STUDY, SPECIAL_DISABILITY, QUARANTINE, SPECIAL
  ```
- **User Roles** ✅: All 6 roles defined
  ```typescript
  EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
  ```
- **Leave Statuses** ✅: All 9 statuses defined
  ```typescript
  DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED,
  RETURNED, CANCELLATION_REQUESTED, RECALLED
  ```
- **Approval Decisions** ✅: `APPROVED, REJECTED, FORWARDED, PENDING`
- **Relationships** ✅: Users, leaves, approvals, balances, encashments, audit logs

#### 2.2 Core Infrastructure
- **Authentication** ✅: JWT with HTTP-only cookies, 2FA (OTP-based)
- **Authorization** ✅: Role-based access control (RBAC)
- **Audit Logging** ✅: `AuditLog` model with actor, action, timestamp, details
- **Notifications** ✅: Email + in-app notification center
- **File Upload** ✅: Medical & fitness certificate upload
- **Date Handling** ✅: Dhaka timezone (Asia/Dhaka UTC+6)
- **Holiday Management** ✅: Government holidays with calendar

#### 2.3 Policy Enforcement Engine
- **Service Eligibility** ✅: `SERVICE_ELIGIBILITY_YEARS` mapping
  - EARNED: 1 year
  - MATERNITY: 0.5 years (6 months)
  - PATERNITY: 1 year
  - STUDY: 3 years
  - SPECIAL_DISABILITY: 3 years
  - EXTRAWITHPAY: 3 years
  - EXTRAWITHOUTPAY: 2 years
- **Accrual Logic** ✅: EL 2 days/month (24/year)
- **Carryover** ✅: EL carryover with 60-day cap
- **Lapse** ✅: CL, ML annual lapse
- **Backdating** ✅: EL/ML allowed (30 days max), CL not allowed
- **Notice Period** ✅: EL 5 working days, CL exempt
- **Maternity Calculation** ✅: Pro-rated for <6 months service
- **Quarantine Validation** ✅: 21 days standard, 30 days exceptional (CEO approval)

#### 2.4 Balance & Accrual System
- **Balance Tracking** ✅: Per-user, per-type, per-year
- **Automated Accrual** ✅: Cron job (1st of month at 00:00 Dhaka time)
- **Automated Lapse** ✅: Cron job (Dec 31 at 23:59 Dhaka time)
- **Encashment** ✅: EL encashment >10 days

#### 2.5 Approval Workflow
- **Workflow Chains** ✅: Defined in `lib/workflow.ts`
  - Default: `HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO`
  - CL: Shorter chain (DEPT_HEAD only per spec clarification needed)
- **Workflow Actions** ✅: FORWARD, APPROVE, REJECT, RETURN
- **Multi-Level Approval** ✅: Full approval chain tracking

#### 2.6 Dashboards
- **5 Role-Based Dashboards** ✅: All exist
  - `/dashboard/employee/`
  - `/dashboard/dept-head/`
  - `/dashboard/hr-admin/`
  - `/dashboard/hr-head/`
  - `/dashboard/ceo/`
- **Shared Components** ✅: Some exist
  - `DashboardLayout`
  - `Charts`
  - `Table`
  - `LoadingFallback`

---

### ⚠️ PARTIALLY IMPLEMENTED (Needs Refinement)

#### 2.7 Leave Type-Specific Rules

| Rule | Current Status | Master Spec Requirement | Action Needed |
|------|---------------|------------------------|---------------|
| **CL: Max 3 consecutive days** | ⚠️ Partially | Hard limit, conversion if exceeded | Verify & enhance |
| **CL: Cannot combine with other leaves** | ❌ Missing | Hard block | Implement |
| **CL: Cannot touch holidays** | ❌ Missing | Hard block | Implement |
| **CL: Emergency same-day application** | ⚠️ Partial | CL exempt from notice | Verify |
| **CL: If extended >3 days → becomes EL** | ❌ Missing | Automatic conversion | Implement |
| **EL: 5 working days notice** | ✅ Implemented | Already enforced | No change |
| **EL: Overflow 60→180 (Special EL)** | ⚠️ Unclear | SPECIAL type exists | Verify logic |
| **EL: Encashment >10 days** | ✅ Implemented | Already enforced | No change |
| **ML: >3 days → certificate required** | ✅ Implemented | `needsMedicalCertificate()` | No change |
| **ML: >14 days → convert to EL** | ❌ Missing | Automatic conversion | Implement |
| **ML: Max 30 days with extensions** | ⚠️ Unclear | Extension rules | Verify |
| **ML: Fitness certificate on return** | ⚠️ Partial | After ML >7 days | Verify upload flow |
| **Maternity: Cannot cancel after start** | ❌ Missing | Hard block | Implement |
| **Maternity: 8 weeks full pay** | ✅ Implemented | 56 days | No change |
| **Paternity: 36-month gap** | ❌ Missing | Check previous paternity | Implement |
| **Paternity: Max 2 times** | ❌ Missing | Lifetime limit | Implement |
| **Study: 5 years until retirement** | ⚠️ Partial | `retirementDate` exists | Implement validation |
| **Study: Requires admission letter** | ⚠️ Unclear | Document requirement | Verify |
| **Study: Loan repayment proof** | ⚠️ Unclear | Document requirement | Verify |
| **Special Disability: 3 months full, 3 months half pay** | ❌ Missing | Pay calculation logic | Implement |
| **Special Disability: Within 3 months of incident** | ❌ Missing | Timeline validation | Implement |
| **Extraordinary: Duration based on service** | ❌ Missing | <5yr=6mo, ≥5yr=12mo | Implement |
| **Extraordinary: Only when no other leave due** | ❌ Missing | Balance check | Implement |
| **Quarantine: 21-30 days CEO approval** | ✅ Implemented | `validateQuarantineLeaveDuration()` | No change |

**Action**: Systematically implement all missing rules in Phase 2.

#### 2.8 Hybrid Enforcement Model

**Master Spec Requirements**:
- **Employee**: Strict rules, no overrides
- **HR/Admin**: Limited soft overrides (late documents, minor date correction, emergency CL)
- **Dept Head & HR Head**: Can only forward/reject/request info (no overrides)
- **CEO**: Final approver, cannot break policy
- **System**: Hard enforcement always

**Current State**: ⚠️ Unclear implementation
- RBAC exists, but soft override logic needs verification
- Need to audit all API endpoints for enforcement consistency

**Action**: Phase 1 - Implement precise hybrid model with documented override matrix.

#### 2.9 Modification & Cancellation Rules

**Master Spec Requirements**:

| Stage | Modification | Cancellation | Current Status |
|-------|-------------|--------------|----------------|
| **Pending** | Full edit ✅ | Immediate ✅ | Implemented |
| **Approved (not started)** | Full approval chain | Full workflow | ⚠️ Verify |
| **Started** | Shorten only | Partial (remaining days) | ❌ Missing |
| **After end** | Not allowed | Not allowed (except HR manual) | ⚠️ Verify |

**Extension Logic**: Extension = new linked request (❌ Missing)

**Action**: Phase 3 - Implement shorten/extend logic with linked requests.

#### 2.10 Dashboard Components

**Master Spec Requires Reusable Components**:
1. ❌ `MetricCard` - Not standardized
2. ❌ `ActionCenter` - Not standardized
3. ⚠️ `RecentActivityTable` - Exists but not reusable
4. ⚠️ `LeaveBreakdownChart` - Exists but scattered
5. ❌ `TeamCapacityHeatmap` - Missing
6. ⚠️ `ApprovalList` - Exists but not reusable
7. ✅ `DashboardLayout` - Exists
8. ❌ `FloatingQuickActionButton` - Missing

**Dashboard Content Verification Needed**:
- Employee Dashboard: 5 sections (Metric Cards, Action Center, Recent Activity, Leave Breakdown, Quick Actions)
- HR/Admin Dashboard: 7 sections
- Dept Head Dashboard: 5 sections
- HR Head Dashboard: 6 sections
- CEO Dashboard: 5 sections

**Action**: Phase 2 - Extract and standardize dashboard components.

---

### ❌ NOT IMPLEMENTED (Must Build)

#### 2.11 Policy Page
- **Requirement**: Up-to-date policy explanation page
- **Current**: ⚠️ Unknown if exists
- **Action**: Phase 1 - Create policy documentation page

#### 2.12 Payroll Export Format
- **Requirement**: Monthly export with LWP, encashment, leave summary, pay impact
- **Current**: ⚠️ Unknown if format matches spec
- **Action**: Phase 4 - Verify/standardize payroll export

#### 2.13 Special EL Overflow Logic
- **Requirement**: EL >60 → SPECIAL (max 180)
- **Current**: SPECIAL type exists, but overflow logic unclear
- **Action**: Phase 2 - Implement EL overflow to SPECIAL

#### 2.14 Linked Extension Requests
- **Requirement**: Extending started leave creates new linked request
- **Current**: ❌ Missing
- **Action**: Phase 3 - Implement linked request system

---

## 3. Gap Analysis

### 3.1 Critical Gaps (P0 - Must Fix)

| # | Gap | Impact | Effort | Phase |
|---|-----|--------|--------|-------|
| 1 | **Hybrid Enforcement Model** not precisely implemented | Role confusion, incorrect permissions | Medium | 1 |
| 2 | **CL combination rules** missing (cannot combine with other leaves) | Policy violations | Low | 2 |
| 3 | **Paternity 36-month gap** not enforced | Policy violations | Low | 2 |
| 4 | **Paternity max 2 times** not enforced | Policy violations | Low | 2 |
| 5 | **Maternity cancellation** after start allowed | Policy violations | Low | 2 |
| 6 | **ML >14 days conversion to EL** missing | Incorrect balance deductions | Medium | 2 |
| 7 | **Linked extension requests** missing | Cannot extend started leaves properly | Medium | 3 |
| 8 | **Started leave modification** (shorten only) unclear | Incorrect modification behavior | Medium | 3 |

### 3.2 High Priority Gaps (P1 - Should Fix)

| # | Gap | Impact | Effort | Phase |
|---|-----|--------|--------|-------|
| 9 | **Dashboard components** not reusable/standardized | Code duplication, inconsistent UX | High | 2 |
| 10 | **Dashboard content** doesn't match exact spec sections | Missing features, inconsistent dashboards | High | 2 |
| 11 | **CL >3 days → EL conversion** missing | Policy violations | Low | 2 |
| 12 | **EL overflow to Special** (60→180) unclear | Balance tracking issues | Medium | 2 |
| 13 | **Extraordinary leave duration** based on service missing | Policy violations | Low | 2 |
| 14 | **Extraordinary leave prerequisite** (no other leave due) missing | Policy violations | Low | 2 |
| 15 | **Study leave retirement buffer** (5 years) not validated | Policy violations | Low | 2 |
| 16 | **Special Disability pay logic** (3mo full, 3mo half) missing | Payroll impact | Medium | 2 |

### 3.3 Medium Priority Gaps (P2 - Nice to Have)

| # | Gap | Impact | Effort | Phase |
|---|-----|--------|--------|-------|
| 17 | **Policy documentation page** missing/unclear | User confusion | Low | 1 |
| 18 | **Payroll export format** not standardized | Manual work for HR | Low | 4 |
| 19 | **TeamCapacityHeatmap** component missing | Manager planning difficulty | Medium | 2 |
| 20 | **FloatingQuickActionButton** missing | UX convenience | Low | 2 |

---

## 4. Implementation Plan

### Implementation Strategy

**Approach**: Phased, incremental implementation with continuous testing

**Principles**:
1. **Follow Master Spec Exactly**: No deviations
2. **Backward Compatible**: Don't break existing functionality
3. **Test-Driven**: Write tests before implementing
4. **Document as You Go**: Update docs immediately
5. **Incremental Rollout**: Phase by phase

### Phase Overview

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| **Phase 0** | Preparation & Cleanup | 2 days | P0 |
| **Phase 1** | Hybrid Enforcement & Critical Rules | 3 days | P0 |
| **Phase 2** | Leave Rules & Dashboard Refactor | 5 days | P0-P1 |
| **Phase 3** | Modification/Cancellation Logic | 3 days | P0 |
| **Phase 4** | Notifications & Final Polish | 2 days | P1 |
| **Phase 5** | QA & Documentation | 2 days | P1 |

**Total Estimated Duration**: 17 days (3.5 weeks)

---

## 5. Phase Breakdown

### PHASE 0: Preparation & Cleanup (2 Days)

**Goal**: Prepare codebase for master spec integration

#### Tasks

**0.1 Code Audit & Documentation**
- [ ] Review all leave validation logic in `lib/`
- [ ] Document current enforcement model
- [ ] Map all API endpoints to roles and permissions
- [ ] Create enforcement matrix spreadsheet
- [ ] Identify all dashboard components

**0.2 Test Infrastructure**
- [ ] Set up test fixtures for all 11 leave types
- [ ] Create test users for all 6 roles
- [ ] Set up test scenarios for hybrid enforcement
- [ ] Create test data for edge cases

**0.3 Codebase Cleanup**
- [ ] Consolidate duplicate validation logic
- [ ] Extract magic numbers to constants
- [ ] Standardize error messages
- [ ] Clean up unused imports
- [ ] Run linter and fix warnings

**Deliverables**:
- Current state audit report
- Enforcement matrix spreadsheet
- Test infrastructure ready
- Clean codebase

---

### PHASE 1: Hybrid Enforcement & Critical Rules (3 Days)

**Goal**: Implement precise hybrid enforcement model and critical policy rules

#### Tasks

**1.1 Hybrid Enforcement Model**
- [ ] Define `HybridEnforcement` interface
  ```typescript
  interface EnforcementRule {
    role: Role;
    canOverride: boolean;
    overrideScope: "document" | "timing" | "none";
    actions: ApprovalAction[];
  }
  ```
- [ ] Create `enforcement.ts` module
  ```typescript
  // Employee: Strict
  // HR_ADMIN: Limited overrides (document, timing)
  // DEPT_HEAD: Forward/reject only
  // HR_HEAD: Forward/reject/approve only
  // CEO: Approve/reject only (no policy override)
  ```
- [ ] Implement role-based action validator
  ```typescript
  canPerformAction(role: Role, action: string, context: LeaveContext): boolean
  ```
- [ ] Add soft override flags to API endpoints
- [ ] Document override audit trail

**1.2 Critical Leave Rules**
- [ ] **Paternity 36-month gap validation**
  ```typescript
  // Check if employee has previous paternity leave within 36 months
  validatePaternityGap(userId: number): { valid: boolean, lastDate?: Date }
  ```
- [ ] **Paternity max 2 times validation**
  ```typescript
  // Count total paternity leaves taken
  validatePaternityLimit(userId: number): { valid: boolean, count: number }
  ```
- [ ] **Maternity cancellation blocking**
  ```typescript
  // Prevent cancellation after start date for maternity
  canCancelMaternity(leave: LeaveRequest): boolean
  ```
- [ ] **CL combination blocking**
  ```typescript
  // Block CL if overlaps with any other leave type
  validateCLNoCombination(dates: DateRange, userId: number): boolean
  ```

**1.3 Policy Documentation Page**
- [ ] Create `/policy` route
- [ ] Implement policy sections (6.1-6.29)
- [ ] Add searchable policy index
- [ ] Create policy FAQ
- [ ] Add "View Policy" links throughout app

**Deliverables**:
- `lib/enforcement.ts` with hybrid model
- Paternity validation functions
- Maternity cancellation blocking
- CL combination blocking
- Policy page live

**Tests**:
- Unit tests for all enforcement rules
- Integration tests for paternity validation
- E2E tests for policy page

---

### PHASE 2: Leave Rules & Dashboard Refactor (5 Days)

**Goal**: Implement all leave-specific rules and refactor dashboards

#### Tasks

**2.1 Leave Type Rules Implementation**

**CL (Casual Leave) Rules**
- [ ] Enforce max 3 consecutive days per spell
  ```typescript
  validateCLMaxDays(days: number): boolean
  ```
- [ ] Block CL touching holidays
  ```typescript
  validateCLNoHolidays(startDate: Date, endDate: Date): boolean
  ```
- [ ] Implement CL >3 days → EL conversion
  ```typescript
  convertCLToEL(leave: LeaveRequest): void
  ```
- [ ] Emergency CL same-day application
  ```typescript
  allowEmergencyCL(applyDate: Date, startDate: Date): boolean
  ```

**EL (Earned Leave) Rules**
- [ ] Implement EL overflow to SPECIAL (60→180)
  ```typescript
  handleELOverflow(userId: number, year: number): void
  // When EL balance > 60, transfer excess to SPECIAL (max 180 total)
  ```
- [ ] Verify 5 working days notice enforcement (already implemented)

**ML (Medical Leave) Rules**
- [ ] Implement ML >14 days → EL conversion
  ```typescript
  convertMLToEL(leave: LeaveRequest): void
  // If ML exceeds 14 days, excess converted to EL or Extraordinary
  ```
- [ ] Enforce fitness certificate upload on return (ML >7 days)
  ```typescript
  requireFitnessCertificate(leave: LeaveRequest): boolean
  ```
- [ ] Implement ML max 30 days with extensions

**Extraordinary Leave Rules**
- [ ] Duration based on service
  ```typescript
  getExtraordinaryMaxDays(joinDate: Date): number
  // <5 years service → 6 months
  // ≥5 years service → 12 months
  ```
- [ ] Prerequisite: no other leave due
  ```typescript
  canApplyExtraordinary(userId: number, year: number): boolean
  // Check if employee has any other leave balance
  ```

**Study Leave Rules**
- [ ] Validate 5 years until retirement
  ```typescript
  validateStudyRetirementBuffer(retirementDate: Date): boolean
  // Must have ≥5 years until retirement
  ```
- [ ] Document requirements (admission letter, loan repayment proof)

**Special Disability Leave Rules**
- [ ] Implement pay logic
  ```typescript
  calculateSpecialDisabilityPay(days: number): {
    fullPayDays: number,
    halfPayDays: number
  }
  // First 90 days (3 months) full pay
  // Next 90 days (3 months) half pay
  ```
- [ ] Validate within 3 months of incident
  ```typescript
  validateIncidentTimeline(incidentDate: Date, applyDate: Date): boolean
  ```

**2.2 Dashboard Component Refactor**

**Create Reusable Components**
- [ ] `MetricCard.tsx`
  ```typescript
  interface MetricCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: { value: number, direction: "up" | "down" };
    color?: string;
  }
  ```
- [ ] `ActionCenter.tsx`
  ```typescript
  interface ActionCenterProps {
    actions: ActionItem[];
    onActionClick: (action: ActionItem) => void;
  }
  ```
- [ ] `RecentActivityTable.tsx`
  ```typescript
  interface RecentActivityTableProps {
    leaves: LeaveRequest[];
    limit?: number;
    showActions?: boolean;
  }
  ```
- [ ] `LeaveBreakdownChart.tsx`
  ```typescript
  interface LeaveBreakdownChartProps {
    data: { type: LeaveType, used: number, remaining: number }[];
    chartType: "pie" | "bar" | "donut";
  }
  ```
- [ ] `TeamCapacityHeatmap.tsx`
  ```typescript
  interface TeamCapacityHeatmapProps {
    teamId: number;
    dateRange: { start: Date, end: Date };
    highlightRiskDays?: boolean;
  }
  ```
- [ ] `ApprovalList.tsx`
  ```typescript
  interface ApprovalListProps {
    approvals: Approval[];
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onForward: (id: number) => void;
  }
  ```
- [ ] `FloatingQuickActionButton.tsx`
  ```typescript
  interface FloatingQuickActionButtonProps {
    actions: QuickAction[];
    position?: "bottom-right" | "bottom-left";
  }
  ```

**2.3 Refactor Role Dashboards**

**Employee Dashboard** (`/dashboard/employee/`)
1. **Metric Cards Section**
   - Pending Requests
   - Total Balance
   - Days Used This Year
   - Next Upcoming Leave
2. **Action Center**
   - Tasks requiring attention (documents, info requests)
3. **Recent Activity Table**
   - Last 5-7 leave requests
4. **Leave Breakdown Chart**
   - By type (donut chart)
   - Show Special EL if any
5. **Quick Actions Panel**
   - Apply for Leave
   - View Balances
   - View Holidays

**HR/Admin Dashboard** (`/dashboard/hr-admin/`)
1. **Metric Cards**
2. **Action Center** (urgent items)
3. **Leaves Waiting HR Decision**
4. **Missing Documents Table**
5. **Today's Absences**
6. **Department-wise Overview Chart**
7. **Export Buttons**

**Department Head Dashboard** (`/dashboard/dept-head/`)
1. **Pending Approvals Table**
2. **Team Capacity Heatmap**
3. **High-Risk Days Alert** (3+ absences)
4. **Upcoming Long Leaves**
5. **Quick Approval Panel**

**HR Head Dashboard** (`/dashboard/hr-head/`)
1. **Company-wide Metrics**
2. **Leave Distribution Chart**
3. **Department-wise Bar Chart**
4. **Monthly Trend Line**
5. **Policy Exception Alerts**
6. **Special Case Monitoring**

**CEO Dashboard** (`/dashboard/ceo/`)
1. **Executive KPIs**
2. **Pending CEO Approvals**
3. **Yearly Trend**
4. **Top 3 Departments (by leave usage)**
5. **Minimal Analytics**

**Deliverables**:
- All leave-specific validation functions
- 8 reusable dashboard components
- 5 refactored role-based dashboards
- Component library documentation

**Tests**:
- Unit tests for each leave rule
- Component tests for dashboard components
- Integration tests for dashboards

---

### PHASE 3: Modification & Cancellation Logic (3 Days)

**Goal**: Implement precise modification and cancellation rules

#### Tasks

**3.1 Modification State Machine**
- [ ] Define modification rules matrix
  ```typescript
  enum ModificationRule {
    FULL_EDIT,           // Pending
    APPROVAL_CHAIN,      // Approved (not started)
    SHORTEN_ONLY,        // Started
    NOT_ALLOWED          // After end
  }
  ```
- [ ] Implement `canModifyLeave()` validator
  ```typescript
  canModifyLeave(
    leave: LeaveRequest,
    today: Date
  ): {
    allowed: boolean,
    rule: ModificationRule,
    reason?: string
  }
  ```
- [ ] Implement shorten functionality
  ```typescript
  shortenLeave(
    leaveId: number,
    newEndDate: Date
  ): Promise<LeaveRequest>
  // Validates newEndDate >= today and <= original endDate
  // Updates leave and balances
  ```

**3.2 Linked Extension Requests**
- [ ] Add `parentLeaveId` field to `LeaveRequest` schema
  ```prisma
  model LeaveRequest {
    // ... existing fields
    parentLeaveId  Int?
    parentLeave    LeaveRequest?  @relation("LeaveExtension", fields: [parentLeaveId], references: [id])
    extensions     LeaveRequest[] @relation("LeaveExtension")
  }
  ```
- [ ] Implement extension request creation
  ```typescript
  createExtensionRequest(
    originalLeaveId: number,
    additionalDays: number,
    reason: string
  ): Promise<LeaveRequest>
  // Creates new linked request
  // Must go through full approval chain
  ```
- [ ] UI: Show linked requests in timeline
- [ ] API: Link extension in approval flow

**3.3 Cancellation State Machine**
- [ ] Define cancellation rules matrix
  ```typescript
  enum CancellationRule {
    IMMEDIATE,           // Pending → instant cancel
    APPROVAL_CHAIN,      // Approved (not started) → workflow
    PARTIAL,             // Started → cancel remaining days
    NOT_ALLOWED          // Finished or special cases
  }
  ```
- [ ] Implement `canCancelLeave()` validator
  ```typescript
  canCancelLeave(
    leave: LeaveRequest,
    today: Date
  ): {
    allowed: boolean,
    rule: CancellationRule,
    reason?: string
  }
  ```
- [ ] Implement partial cancellation
  ```typescript
  partialCancelLeave(
    leaveId: number,
    effectiveDate: Date
  ): Promise<LeaveRequest>
  // Cancels remaining days
  // Adjusts balances
  ```
- [ ] Special rules for ML/Maternity
  ```typescript
  validateMLMaternityCancellation(leave: LeaveRequest): {
    requiresFitnessCertificate: boolean,
    allowed: boolean
  }
  ```

**3.4 UI Updates**
- [ ] Add "Shorten Leave" action to started leaves
- [ ] Add "Extend Leave" button → creates extension request
- [ ] Show linked extensions in leave details
- [ ] Add partial cancellation UI
- [ ] Show modification/cancellation rules in UI

**Deliverables**:
- Modification state machine
- Shorten functionality
- Linked extension system
- Partial cancellation logic
- Updated UI for modifications

**Tests**:
- Unit tests for state machines
- Integration tests for shorten/extend
- E2E tests for full modification flow

---

### PHASE 4: Notifications & Final Polish (2 Days)

**Goal**: Complete notification system and payroll export

#### Tasks

**4.1 Notification System Audit**
- [ ] Verify email notifications for all events:
  - Apply, Forward, Approve, Reject, Request Info
  - Cancel, Modify, Encashment, Fitness Certificate Due
- [ ] Verify in-app notifications
- [ ] Test notification center UI
- [ ] Add notification preferences

**4.2 Payroll Export**
- [ ] Define payroll export schema
  ```typescript
  interface PayrollExport {
    employeeId: string;
    employeeName: string;
    period: { month: number, year: number };
    lwpDays: number;              // Leave Without Pay days
    encashmentDays: number;       // EL encashment days
    encashmentAmount: number;     // Payment amount
    leaveSummary: {
      type: LeaveType;
      daysTaken: number;
      balanceRemaining: number;
    }[];
    notes: string[];              // Special notes
    payImpact: {
      deduction: number;          // LWP deduction
      addition: number;           // Encashment payment
    };
  }
  ```
- [ ] Implement payroll export API
  ```typescript
  POST /api/payroll/export
  // Returns CSV or JSON with payroll data
  ```
- [ ] Create HR UI for payroll export
- [ ] Add date range filter
- [ ] Add department filter

**4.3 Final Polish**
- [ ] Add "View Policy" links throughout app
- [ ] Ensure all error messages are user-friendly
- [ ] Verify all loading states work
- [ ] Check mobile responsiveness
- [ ] Accessibility audit (ARIA labels, keyboard nav)
- [ ] Performance optimization
- [ ] Security audit

**Deliverables**:
- Complete notification coverage
- Payroll export functionality
- Polished UI/UX
- Performance improvements

**Tests**:
- Notification integration tests
- Payroll export validation tests
- E2E tests for user flows

---

### PHASE 5: QA & Documentation (2 Days)

**Goal**: Comprehensive testing and documentation

#### Tasks

**5.1 Quality Assurance**
- [ ] **Policy Compliance Testing**
  - Test all 11 leave types against policy
  - Verify all validation rules
  - Test edge cases
- [ ] **Role-Based Testing**
  - Test each role's permissions
  - Verify hybrid enforcement model
  - Test approval workflows
- [ ] **Integration Testing**
  - Test full leave lifecycle (apply → approve → start → end)
  - Test modification flows
  - Test cancellation flows
  - Test encashment flows
- [ ] **Regression Testing**
  - Ensure existing features still work
  - Test backward compatibility
  - Test data migrations
- [ ] **Performance Testing**
  - Load test dashboards
  - Test with large datasets
  - Optimize slow queries

**5.2 Documentation**
- [ ] **Code Documentation**
  - JSDoc comments for all public functions
  - README updates
  - Architecture documentation
- [ ] **API Documentation**
  - OpenAPI/Swagger specs
  - Endpoint documentation
  - Example requests/responses
- [ ] **User Documentation**
  - User guide for each role
  - Policy documentation
  - FAQ updates
  - Video tutorials (optional)
- [ ] **Developer Documentation**
  - Setup guide
  - Development workflow
  - Testing guide
  - Deployment guide

**5.3 Master Spec Compliance Audit**
- [ ] Section-by-section verification
  - ✅ Section 1: System Philosophy
  - ✅ Section 2: Feature Inclusions/Exclusions
  - ✅ Section 3: Leave Type Specifications
  - ✅ Section 4: Hybrid Enforcement Model
  - ✅ Section 5: Modification & Cancellation Rules
  - ✅ Section 6: Balance, Accrual, Lapse
  - ✅ Section 7: Role-Based Dashboards
  - ✅ Section 8: UI/UX Component System
  - ✅ Section 9: Notifications
  - ✅ Section 10: Payroll Export
  - ✅ Section 11: Audit Logging
- [ ] Create compliance checklist
- [ ] Document any deviations (none allowed!)

**5.4 Handoff Preparation**
- [ ] Create release notes
- [ ] Prepare deployment plan
- [ ] Create rollback plan
- [ ] Training materials for admins

**Deliverables**:
- Comprehensive test suite
- Complete documentation
- Compliance audit report
- Release-ready codebase

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Coverage Target**: 80%+

**Focus Areas**:
- All validation functions
- Policy enforcement logic
- Accrual calculations
- Date utilities
- Workflow functions

**Tools**: Vitest, Testing Library

### 6.2 Integration Tests

**Focus Areas**:
- API endpoints
- Database operations
- Approval workflows
- Notification triggers
- File uploads

**Tools**: Vitest, Supertest

### 6.3 End-to-End Tests

**Critical User Flows**:
1. Employee applies for leave → approval → completion
2. HR processes pending requests
3. Manager approves team leaves
4. Modification workflow
5. Cancellation workflow
6. Encashment request

**Tools**: Playwright

### 6.4 Acceptance Criteria

Each phase must meet:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code review approved
- [ ] Documentation complete
- [ ] Master spec compliance verified

---

## 7. Success Criteria

### 7.1 Functional Requirements

✅ **Leave Types**: All 11 types implemented with exact rules
✅ **Roles**: All 6 roles with correct permissions
✅ **Approval Workflow**: 5-step chain working correctly
✅ **Hybrid Enforcement**: Role-based enforcement model implemented
✅ **Dashboards**: All 5 dashboards match spec exactly
✅ **Modifications**: Shorten/extend logic working
✅ **Cancellations**: Partial cancellation working
✅ **Notifications**: Email + in-app notifications complete
✅ **Audit Trails**: All actions logged
✅ **Payroll Export**: Standard format implemented

### 7.2 Quality Requirements

✅ **Test Coverage**: ≥80% unit test coverage
✅ **Performance**: Dashboard loads <2 seconds
✅ **Accessibility**: WCAG 2.1 AA compliant
✅ **Security**: No vulnerabilities in audit
✅ **Documentation**: Complete user & developer docs

### 7.3 Compliance Requirements

✅ **Master Spec Compliance**: 100% - no deviations
✅ **CDBL Leave Policy**: All sections 6.1-6.29 implemented exactly
✅ **Hybrid Enforcement**: Correct role-based overrides

---

## 8. Risk Management

### High Risks

| Risk | Mitigation |
|------|-----------|
| **Breaking existing functionality** | Comprehensive regression testing, incremental rollout |
| **Scope creep** | Strict adherence to master spec, no additional features |
| **Timeline overruns** | Buffer time in each phase, daily progress tracking |
| **Policy misinterpretation** | Document every decision, get stakeholder approval |

### Medium Risks

| Risk | Mitigation |
|------|-----------|
| **Database migration issues** | Test migrations on staging, have rollback plan |
| **Performance degradation** | Load testing, optimization phase |
| **User adoption issues** | Training materials, user documentation |

---

## 9. Next Steps

### Immediate Actions (Before Implementation)

1. **Stakeholder Review** (1 day)
   - Present this plan to stakeholders
   - Get approval for approach
   - Clarify any ambiguities in master spec

2. **Environment Setup** (0.5 day)
   - Create feature branch: `feature/master-spec-integration`
   - Set up staging environment
   - Configure test data

3. **Kick-off Meeting** (0.5 day)
   - Review plan with team
   - Assign tasks
   - Set up daily standups

### Implementation Checklist

- [ ] Stakeholder approval received
- [ ] Feature branch created
- [ ] Test environment ready
- [ ] Phase 0 started
- [ ] Daily progress reports established
- [ ] Weekly demos scheduled

---

## 10. Appendices

### Appendix A: Master Spec Reference

See: `MASTER_SPECIFICATION.md` (user-provided document)

### Appendix B: Current Codebase Structure

```
CDBL-LMS/
├── app/                        # Next.js App Router
│   ├── api/                   # API endpoints
│   ├── dashboard/             # Dashboard routes
│   │   ├── employee/
│   │   ├── dept-head/
│   │   ├── hr-admin/
│   │   ├── hr-head/
│   │   └── ceo/
│   └── leaves/                # Leave management
├── components/                 # React components
│   └── dashboards/            # Dashboard components
├── lib/                        # Business logic
│   ├── policy.ts              # Policy enforcement
│   ├── workflow.ts            # Approval workflow
│   ├── leave-validation.ts    # Leave validation
│   └── date-utils.ts          # Date utilities
├── prisma/                     # Database
│   └── schema.prisma          # Database schema
└── docs/                       # Documentation
```

### Appendix C: Enforcement Matrix

| Role | Apply | Modify | Cancel | Approve | Reject | Forward | Override |
|------|-------|--------|--------|---------|--------|---------|----------|
| EMPLOYEE | ✅ | ⚠️ Limited | ⚠️ Limited | ❌ | ❌ | ❌ | ❌ |
| DEPT_HEAD | ✅ | ⚠️ Limited | ⚠️ Limited | ❌ | ✅ | ✅ | ❌ |
| HR_ADMIN | ✅ | ⚠️ Limited | ⚠️ Limited | ❌ | ✅ | ✅ | ⚠️ Soft |
| HR_HEAD | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ | ✅ | ✅ | ❌ |
| CEO | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ | ✅ | ❌ | ❌ |
| SYSTEM_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ Allowed | ⚠️ Conditional | ❌ Not Allowed

---

## Conclusion

This integration plan provides a comprehensive, phased approach to implementing the CDBL-LMS Master Specification. By following this plan systematically, we will achieve:

1. **100% Master Spec Compliance** - No deviations
2. **Robust Leave Management** - All 11 types with exact rules
3. **Precise Enforcement** - Hybrid model implemented correctly
4. **Excellent UX** - Standardized, reusable dashboard components
5. **Complete Testing** - High coverage, confidence in quality
6. **Thorough Documentation** - Users and developers well-supported

**Estimated Timeline**: 17 days (3.5 weeks)
**Team Required**: 1-2 developers
**Risk Level**: Low (incremental, well-planned)

**Ready to proceed pending stakeholder approval.**

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Author**: Claude (AI Assistant)
**Status**: Awaiting Approval
