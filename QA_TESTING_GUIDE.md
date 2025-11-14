# CDBL Leave Management System - Comprehensive QA Testing Guide

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Application**: CDBL Leave Management System
**Environment**: Development/Testing
**Status**: Ready for QA Testing

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Authentication Bypass for Testing](#authentication-bypass-for-testing)
4. [Test Data & User Credentials](#test-data--user-credentials)
5. [Database Reset Instructions](#database-reset-instructions)
6. [Component Testing Checklist](#component-testing-checklist)
7. [Role-Based Feature Testing](#role-based-feature-testing)
8. [Core Feature Testing](#core-feature-testing)
9. [Pain Points & Edge Cases](#pain-points--edge-cases)
10. [Browser & Accessibility Testing](#browser--accessibility-testing)
11. [Test Report Template](#test-report-template)

---

## Quick Start

**Objective**: Get the application running with authentication disabled for comprehensive testing.

### Prerequisites
- Node.js v18+ installed
- MySQL 8.0+ running locally or accessible
- Git repository cloned locally
- All dependencies installed via `npm install`

### Steps to Start Testing
1. Follow "Pre-Testing Setup" section
2. Temporarily disable authentication (see "Authentication Bypass" section)
3. Load test data from "Test Data" section
4. Reset database if needed
5. Navigate to `http://localhost:3000`
6. Start testing from "Component Testing Checklist"

---

## Pre-Testing Setup

### 1. Environment Configuration

Create or update `.env.local` file in project root:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave_test"

# JWT Configuration (Testing)
JWT_SECRET="test-secret-key-minimum-32-characters-long"

# Next.js
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"

# File Upload (Local Testing)
NEXT_PUBLIC_FILE_UPLOAD_DIR="./public/uploads"

# Features (Enable all for testing)
NEXT_PUBLIC_FEATURE_FLAGS="all"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at: `http://localhost:3000`

**Expected**: Server starts on port 3000, no authentication errors, database connected.

---

## Authentication Bypass for Testing

### Why Bypass Authentication?

- **Speed**: Test all features without re-logging in
- **Coverage**: Test all roles simultaneously without multiple browsers
- **Simplicity**: Focus on feature testing, not login flows
- **Automation**: Easy for automated testing agents

### Method 1: Middleware Bypass (RECOMMENDED)

**File**: `middleware.ts`

Find this section in the middleware:

```typescript
// Current authentication check
if (!token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Replace with**:

```typescript
// TESTING ONLY: Bypass authentication for development
if (process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "true") {
  // Skip authentication check
  return NextResponse.next();
}

// Current authentication check
if (!token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Enable bypass**:

```bash
# Add to .env.local
SKIP_AUTH=true
```

### Method 2: Mock User in Middleware

**File**: `middleware.ts`

Add this before checking routes:

```typescript
// TESTING ONLY: Inject test user for development
if (process.env.NODE_ENV === "development" && process.env.MOCK_USER === "true") {
  const mockUser = {
    id: "test-user-ceo",
    email: "ceo@cdbl.com",
    role: "CEO",
    department: "Executive",
  };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-mock-user", JSON.stringify(mockUser));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

**Enable mock**:

```bash
# Add to .env.local
MOCK_USER=true
MOCK_USER_ROLE=CEO
```

### Method 3: API Mock Redirect

**File**: `lib/auth.ts`

Add at the top of the getSession() function:

```typescript
export async function getSession(request: Request) {
  // TESTING ONLY: Return mock session
  if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
    return {
      id: "test-user-ceo",
      email: "ceo@cdbl.com",
      name: "Test CEO",
      role: "CEO",
      department: "Executive",
      isAuthenticated: true,
    };
  }

  // Normal authentication flow
  // ... existing code ...
}
```

**Enable test mode**:

```bash
# Add to .env.local
NEXT_PUBLIC_TEST_MODE=true
```

### How to Switch Test Users

Once authentication is bypassed, update `.env.local` to test different roles:

```bash
# Test as CEO
MOCK_USER_ROLE=CEO

# Test as HR_HEAD
MOCK_USER_ROLE=HR_HEAD

# Test as DEPT_HEAD
MOCK_USER_ROLE=DEPT_HEAD

# Test as HR_ADMIN
MOCK_USER_ROLE=HR_ADMIN

# Test as EMPLOYEE
MOCK_USER_ROLE=EMPLOYEE
```

**Then reload the page** to pick up the new role.

### Verification

After enabling bypass:
1. Navigate to `http://localhost:3000`
2. You should be redirected to `/dashboard` (not `/login`)
3. You should see the dashboard immediately
4. No login form should appear

---

## Test Data & User Credentials

### Pre-Created Test Users

When you run `npm run seed`, these users are automatically created:

| Email | Password | Role | Department | Full Name | Status |
|-------|----------|------|-----------|-----------|--------|
| ceo@cdbl.com | Test@123456 | CEO | Executive | Chief Executive Officer | Active |
| hrhead@cdbl.com | Test@123456 | HR_HEAD | Human Resources | HR Head | Active |
| hradmin@cdbl.com | Test@123456 | HR_ADMIN | Human Resources | HR Admin | Active |
| depthead@cdbl.com | Test@123456 | DEPT_HEAD | Operations | Department Head | Active |
| employee1@cdbl.com | Test@123456 | EMPLOYEE | Operations | Employee One | Active |
| employee2@cdbl.com | Test@123456 | EMPLOYEE | Finance | Employee Two | Active |
| employee3@cdbl.com | Test@123456 | EMPLOYEE | IT | Employee Three | Active |

### Test User Details

#### CEO User
```json
{
  "id": "user-ceo-001",
  "email": "ceo@cdbl.com",
  "name": "Chief Executive Officer",
  "role": "CEO",
  "department": "Executive",
  "designation": "Chief Executive Officer",
  "joiningDate": "2020-01-01",
  "isActive": true,
  "supervisorId": null
}
```

#### HR Head
```json
{
  "id": "user-hrhead-001",
  "email": "hrhead@cdbl.com",
  "name": "HR Head",
  "role": "HR_HEAD",
  "department": "Human Resources",
  "designation": "HR Head",
  "joiningDate": "2020-06-15",
  "isActive": true,
  "supervisorId": "user-ceo-001"
}
```

#### HR Admin
```json
{
  "id": "user-hradmin-001",
  "email": "hradmin@cdbl.com",
  "name": "HR Admin",
  "role": "HR_ADMIN",
  "department": "Human Resources",
  "designation": "HR Administrator",
  "joiningDate": "2021-03-01",
  "isActive": true,
  "supervisorId": "user-hrhead-001"
}
```

#### Department Head
```json
{
  "id": "user-depthead-001",
  "email": "depthead@cdbl.com",
  "name": "Department Head",
  "role": "DEPT_HEAD",
  "department": "Operations",
  "designation": "Department Head",
  "joiningDate": "2019-09-10",
  "isActive": true,
  "supervisorId": "user-hrhead-001"
}
```

#### Employees
```json
{
  "employees": [
    {
      "id": "user-emp-001",
      "email": "employee1@cdbl.com",
      "name": "Employee One",
      "role": "EMPLOYEE",
      "department": "Operations",
      "designation": "Senior Officer",
      "joiningDate": "2018-05-20",
      "isActive": true,
      "supervisorId": "user-depthead-001"
    },
    {
      "id": "user-emp-002",
      "email": "employee2@cdbl.com",
      "name": "Employee Two",
      "role": "EMPLOYEE",
      "department": "Finance",
      "designation": "Finance Officer",
      "joiningDate": "2019-11-15",
      "isActive": true,
      "supervisorId": "user-hrhead-001"
    },
    {
      "id": "user-emp-003",
      "email": "employee3@cdbl.com",
      "name": "Employee Three",
      "role": "EMPLOYEE",
      "department": "IT",
      "designation": "IT Officer",
      "joiningDate": "2020-07-01",
      "isActive": true,
      "supervisorId": "user-ceo-001"
    }
  ]
}
```

### Test Leave Balances

All test users have the following initial balances for FY 2025:

| Leave Type | Opening | Accrued | Used | Available |
|-----------|---------|---------|------|-----------|
| Casual Leave (CL) | 5 | 8.33 | 2 | 11.33 |
| Medical Leave (ML) | 0 | 11.67 | 1 | 10.67 |
| Earned Leave (EL) | 15 | 15 | 5 | 25 |
| Extra Leave (EXL) | 0 | 0 | 0 | 0 |
| Special Leave (SL) | 0 | 0 | 0 | 0 |

### Test Holiday Calendar

Pre-loaded holidays for 2025:

| Date | Holiday Name | Type |
|------|-------------|------|
| 2025-01-26 | Republic Day | National |
| 2025-03-17 | Bengali New Year | National |
| 2025-08-15 | Independence Day | National |
| 2025-12-16 | Victory Day | National |
| 2025-12-25 | Christmas | Optional |

---

## Database Reset Instructions

### Why Reset?

- Clear test data between test cycles
- Ensure clean state for comprehensive testing
- Remove failed test requests
- Reset user balances to initial values
- Verify database integrity

### Method 1: Full Database Reset (DESTRUCTIVE)

**⚠️ WARNING**: This deletes all data. Use only in test environment.

```bash
# Reset the database completely
npx prisma migrate reset

# Confirm: Type "y" when prompted
# Expected: Database wiped, migrations reapplied, seed data loaded
```

### Method 2: Selective Data Reset

**File**: Create `scripts/reset-test-data.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetTestData() {
  try {
    console.log("Starting data reset...");

    // Delete leave requests first (foreign key dependency)
    await prisma.leaveRequest.deleteMany();
    console.log("✓ Cleared leave requests");

    // Delete approvals
    await prisma.approval.deleteMany();
    console.log("✓ Cleared approvals");

    // Delete notifications
    await prisma.notification.deleteMany();
    console.log("✓ Cleared notifications");

    // Reset leave balances
    await prisma.balance.deleteMany();
    console.log("✓ Cleared balances");

    // Delete all users except admins
    await prisma.user.deleteMany({
      where: {
        role: {
          notIn: ["SYSTEM_ADMIN"],
        },
      },
    });
    console.log("✓ Cleared non-admin users");

    // Re-seed test users and data
    await seedTestData();
    console.log("✓ Re-seeded test data");

    console.log("Data reset complete!");
  } catch (error) {
    console.error("Error resetting data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedTestData() {
  // Create test users
  const testUsers = [
    {
      email: "ceo@cdbl.com",
      name: "Chief Executive Officer",
      role: "CEO",
      password: "hashedPassword",
    },
    // ... other users
  ];

  for (const user of testUsers) {
    await prisma.user.create({ data: user });
  }
}

resetTestData();
```

**Run**:

```bash
npx ts-node scripts/reset-test-data.ts
```

### Method 3: Reset Specific User Data

```bash
# Reset only employee1's leave requests
DELETE FROM LeaveRequest WHERE userId = 'user-emp-001';

# Reset only employee1's balance
DELETE FROM Balance WHERE userId = 'user-emp-001';

# Then run seed for that user
```

### Method 4: Via API Endpoint (RECOMMENDED)

Create admin endpoint for testing:

**File**: `app/api/admin/reset-test-data/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TESTING ONLY: Remove in production
export async function POST(request: NextRequest) {
  // Check if testing mode is enabled
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Reset data
    await prisma.leaveRequest.deleteMany();
    await prisma.approval.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.balance.deleteMany();

    // Re-seed
    // ... seed code here ...

    return NextResponse.json({
      success: true,
      message: "Test data reset successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Reset failed", details: error },
      { status: 500 }
    );
  }
}
```

**Call via curl**:

```bash
curl -X POST http://localhost:3000/api/admin/reset-test-data
```

### Verification After Reset

```bash
# Check user count
SELECT COUNT(*) FROM User;
# Expected: 7 test users

# Check leave requests
SELECT COUNT(*) FROM LeaveRequest;
# Expected: 0

# Check balances
SELECT COUNT(*) FROM Balance;
# Expected: 35 (7 users × 5 leave types)
```

---

## Component Testing Checklist

### Step 1: Global Navigation & Layout

**Location**: Top navigation bar, sidebar (if any), footer

**Components to Test**:
1. **Top Navigation Bar**
   - [ ] Logo visible and clickable (navigates to dashboard)
   - [ ] Navigation menu items visible for current role
   - [ ] User profile dropdown works
   - [ ] Logout button present and functional
   - [ ] Notifications icon shows count correctly
   - [ ] Search bar is functional
   - [ ] Live clock showing current time
   - [ ] Dark mode toggle (if available)
   - [ ] Responsive on mobile (hamburger menu)

2. **Floating Dock** (If present)
   - [ ] Dock visible at bottom/side
   - [ ] All action buttons present
   - [ ] Buttons navigate to correct pages
   - [ ] Dock doesn't overlap content
   - [ ] Smoothly expands/collapses

3. **Control Center**
   - [ ] Toggle controls visible for current role
   - [ ] Feature toggles work
   - [ ] Settings persist after reload
   - [ ] No console errors

4. **Search Modal**
   - [ ] Opens with keyboard shortcut (Cmd/Ctrl+K)
   - [ ] Can search for users
   - [ ] Can search for leaves
   - [ ] Results display correctly
   - [ ] Enter key navigates to result
   - [ ] Escape closes modal

### Step 2: Authentication Pages (If Not Bypassed)

**Location**: `/login`, `/forgot-password`, `/reset-password`

1. **Login Page**
   - [ ] Email field accepts valid email format
   - [ ] Password field masks input
   - [ ] "Remember me" checkbox functional
   - [ ] Login button enabled only with valid input
   - [ ] Error message shown for invalid credentials
   - [ ] Loading state shown during submission
   - [ ] Redirects to dashboard on success
   - [ ] "Forgot password" link present

2. **Forgot Password Page**
   - [ ] Email field present
   - [ ] Submit button sends reset email
   - [ ] Confirmation message shown
   - [ ] Back to login link functional

3. **Reset Password Page**
   - [ ] Password and confirm password fields
   - [ ] Password strength indicator
   - [ ] Form validates matching passwords
   - [ ] Submit button functional
   - [ ] Success message shown
   - [ ] Redirects to login

### Step 3: Dashboard Pages

**Location**: `/dashboard`

#### Employee Dashboard
- [ ] Personal leave balance displayed correctly
- [ ] Balance cards show all 5 leave types
- [ ] "Apply Leave" button present and functional
- [ ] Recent leave requests showing (max 5)
- [ ] Leave status badges colored correctly
- [ ] Leave trends chart displaying data
- [ ] "View All" links navigate to details
- [ ] No unauthorized data visible
- [ ] Empty state shows when no requests

#### Manager/Department Head Dashboard
- [ ] Team overview statistics showing
- [ ] Total team members displayed
- [ ] Pending approvals count accurate
- [ ] Team leave calendar visible
- [ ] Team members table showing
- [ ] Click on member shows their leaves
- [ ] Leave trends by department visible
- [ ] Pending requests table showing

#### HR Admin Dashboard
- [ ] System statistics visible (total users, leaves, etc.)
- [ ] Pending approvals list showing
- [ ] Employee management widget
- [ ] Quick action buttons present
- [ ] Policy alerts showing
- [ ] File upload widget for holidays (if admin feature)
- [ ] Recently added users displayed

#### HR Head Dashboard
- [ ] Comprehensive system statistics
- [ ] Pending final approvals
- [ ] Compliance alerts (if any policy violations)
- [ ] Department-wise statistics
- [ ] Approval workflow visualization
- [ ] Reports section visible

#### CEO Dashboard
- [ ] Executive KPIs displaying
- [ ] Company-wide leave statistics
- [ ] Escalation alerts
- [ ] All department overviews
- [ ] Policy compliance dashboard
- [ ] Year-to-date reports

### Step 4: Leave Application Component

**Location**: `/leaves/apply`

#### Form Validation
- [ ] Leave type dropdown shows all 11 types
- [ ] Start date picker functional
- [ ] End date picker functional
- [ ] Date range validation works
- [ ] Cannot select past dates (except draft)
- [ ] Cannot select weekends (as per policy)
- [ ] Cannot select holidays (as per policy)
- [ ] Cannot apply leave on restricted dates
- [ ] Reason text field accepts input

#### Balance Display
- [ ] Requested leave type's balance shown
- [ ] Available balance updated in real-time
- [ ] Days calculation correct (excluding weekends/holidays)
- [ ] Insufficient balance warning shown
- [ ] Policy warnings shown (if applicable)
- [ ] Projected balance shown

#### Medical Certificate Upload
- [ ] File upload input present for medical leave
- [ ] Only for medical leave type
- [ ] Accepts PDF, JPG, PNG
- [ ] Rejects files >5MB
- [ ] Preview of uploaded file shown
- [ ] File can be removed
- [ ] No file errors on validation

#### Form Actions
- [ ] "Save Draft" button saves without submitting
- [ ] Draft saved locally/database
- [ ] "Continue" button validates and moves to review
- [ ] "Submit" button submits final request
- [ ] Confirmation modal before submission
- [ ] Success message shown
- [ ] Redirects to leave request detail

#### Draft Management
- [ ] Draft auto-saves every 30 seconds
- [ ] Draft resume from `/leaves` page
- [ ] Can edit draft after creation
- [ ] Can delete draft
- [ ] Draft status shows "Draft"

### Step 5: Leave List/History Component

**Location**: `/leaves`

1. **Leave Request Table**
   - [ ] All user's leave requests displayed
   - [ ] Columns: Type, Start Date, End Date, Status, Days, Actions
   - [ ] Date range filtering works
   - [ ] Status filtering works
   - [ ] Leave type filtering works
   - [ ] Search by reason works
   - [ ] Sorting by columns works
   - [ ] Pagination functional
   - [ ] Row click shows details

2. **Status Badges**
   - [ ] "Draft" badge - gray color
   - [ ] "Submitted" badge - blue color
   - [ ] "Pending" badge - yellow color
   - [ ] "Approved" badge - green color
   - [ ] "Rejected" badge - red color
   - [ ] "Cancelled" badge - gray color
   - [ ] "Returned" badge - orange color
   - [ ] Hovering shows status explanation

3. **Action Buttons**
   - [ ] Edit button works for draft/returned
   - [ ] View button works for all statuses
   - [ ] Cancel button works for pending/approved
   - [ ] Download approval letter (if available)
   - [ ] Share option (if available)
   - [ ] More actions menu functional

4. **Filters**
   - [ ] "All" shows all requests
   - [ ] "Active" shows ongoing leaves
   - [ ] "Approved" shows approved leaves
   - [ ] "Pending" shows awaiting approval
   - [ ] "Draft" shows unsaved requests
   - [ ] Date range picker works
   - [ ] Clear filters button functional

### Step 6: Leave Detail/View Component

**Location**: `/leaves/:id`

1. **Request Information**
   - [ ] Leave type displayed
   - [ ] Start date and end date shown
   - [ ] Number of days calculated correctly
   - [ ] Reason/description visible
   - [ ] Attachments displayed (if any)
   - [ ] Status badge shown
   - [ ] Creation date/time shown
   - [ ] Last modified date shown

2. **Approval Timeline**
   - [ ] 4-step approval chain visualized
   - [ ] Current step highlighted
   - [ ] Completed steps showing checkmark
   - [ ] Pending steps shown as empty
   - [ ] Approver names displayed
   - [ ] Approval dates shown (if approved)
   - [ ] Rejection reason shown (if rejected)
   - [ ] Comments from each level visible

3. **Employee Actions** (If owner)
   - [ ] Edit button enabled for draft/returned
   - [ ] Modify button enabled for pending/approved
   - [ ] Cancel button enabled for pending/approved
   - [ ] Withdraw button (if applicable)
   - [ ] Delete button enabled for draft only

4. **Comments Section**
   - [ ] Comment input field present
   - [ ] All comments displayed with author/date
   - [ ] Comment edit/delete for own comments
   - [ ] @ mention functionality (if available)
   - [ ] Time stamps relative (e.g., "2 hours ago")

### Step 7: Approval Queue Component

**Location**: `/approvals`

1. **Pending Approvals Table**
   - [ ] All pending requests shown (for current user's level)
   - [ ] Employee name/ID visible
   - [ ] Leave type visible
   - [ ] Dates visible
   - [ ] Days visible
   - [ ] Status visible
   - [ ] Priority/urgency indicator (if applicable)

2. **Approval Actions**
   - [ ] "View" button opens request details
   - [ ] "Approve" button opens approval modal
   - [ ] "Reject" button opens rejection modal
   - [ ] "Forward" button routes to next level (if applicable)
   - [ ] Comment field present
   - [ ] Required comment validation

3. **Approval Modal**
   - [ ] Request summary shown
   - [ ] Policy check results displayed
   - [ ] Leave balance impact shown
   - [ ] Comment field present
   - [ ] "Approve" button functional
   - [ ] "Cancel" button works
   - [ ] Confirmation before submission

4. **Rejection Modal**
   - [ ] Rejection reason dropdown
   - [ ] Custom reason text area
   - [ ] Required field validation
   - [ ] "Reject" button functional
   - [ ] Request returns to employee

5. **Filters & Search**
   - [ ] Filter by leave type
   - [ ] Filter by status
   - [ ] Search by employee name
   - [ ] Date range filter
   - [ ] Sort by priority/date
   - [ ] Clear all filters button

### Step 8: Employee Directory Component

**Location**: `/employees`

1. **Employee List/Table**
   - [ ] All active employees displayed
   - [ ] Employee name shown
   - [ ] Department shown
   - [ ] Designation shown
   - [ ] Email shown
   - [ ] Status shown (active/inactive)
   - [ ] Pagination working
   - [ ] Row click opens employee profile

2. **Search & Filter**
   - [ ] Search by name works
   - [ ] Search by email works
   - [ ] Filter by department
   - [ ] Filter by designation
   - [ ] Filter by status
   - [ ] Search results update in real-time

3. **Employee Profile Card/Modal**
   - [ ] Profile photo displayed
   - [ ] Personal information visible
   - [ ] Department & designation
   - [ ] Email & phone
   - [ ] Manager/supervisor shown
   - [ ] Joining date
   - [ ] Current leave balance
   - [ ] View full profile link

4. **Employee Full Profile Page**
   - [ ] All personal details
   - [ ] Department hierarchy
   - [ ] Leave balance breakdown
   - [ ] Leave history (last 5)
   - [ ] Performance metrics (if available)
   - [ ] Contact information
   - [ ] Documents (if any)

---

## Role-Based Feature Testing

### Testing Across All 6 Roles

**Setup**: For each role, update `.env.local` with `MOCK_USER_ROLE=ROLE_NAME` and reload page.

### 1. EMPLOYEE Role Testing

**User**: employee1@cdbl.com

#### Accessible Pages
- [ ] Dashboard - Personal dashboard only
- [ ] Leaves - Own leaves only
- [ ] Apply Leave - Can apply
- [ ] Approvals - Empty (no approvals for employees)
- [ ] Employees - Can view directory
- [ ] Balance - Own balance only
- [ ] Settings - Own settings only

#### Features to Test
- [ ] Can apply for all leave types
- [ ] Can see own balance
- [ ] Can modify draft leaves
- [ ] Can cancel pending/approved leaves
- [ ] Cannot see other employees' leaves
- [ ] Cannot approve any leaves
- [ ] Cannot access admin functions
- [ ] Can see own notification
- [ ] Can search for other employees

#### Restrictions
- [ ] Cannot access HR Admin panel
- [ ] Cannot view other users' leaves
- [ ] Cannot modify approved leaves (except cancel)
- [ ] Cannot change own role
- [ ] Cannot export reports

#### Leave Application
- [ ] Apply leave functionality works
- [ ] Can save draft
- [ ] Can modify draft before submission
- [ ] Submit leave request
- [ ] See in leaves list
- [ ] Approval chain visible
- [ ] Cannot edit after submission

#### Edge Cases
- [ ] Applying leave with zero balance shows error
- [ ] Applying leave overlapping holidays
- [ ] Applying leave on weekends
- [ ] Applying leave with past dates

### 2. DEPT_HEAD (Department Head) Role Testing

**User**: depthead@cdbl.com

#### Accessible Pages
- [ ] Dashboard - Team dashboard
- [ ] Leaves - Own leaves + team leaves
- [ ] Apply Leave - Can apply personal leave
- [ ] Approvals - Team requests for approval
- [ ] Employees - Full directory
- [ ] Balance - Own + team balance
- [ ] Reports - Team reports

#### Features to Test
- [ ] Can see team members' leaves
- [ ] Team statistics on dashboard
- [ ] Team calendar showing all leaves
- [ ] Approve team requests
- [ ] Reject team requests with reason
- [ ] Forward request to next level
- [ ] Add comments on requests
- [ ] Cannot approve own leaves
- [ ] Cannot see other departments' leaves

#### Approvals
- [ ] See pending team approvals
- [ ] Approval modal shows correctly
- [ ] Can approve with/without comment
- [ ] Can reject with reason
- [ ] Can forward to HR
- [ ] Department-wise filtering
- [ ] Mark as urgent/priority

#### Team View
- [ ] Team members listed
- [ ] Team statistics (total, approved, pending)
- [ ] Team calendar showing conflicts
- [ ] Team leave trends
- [ ] Individual team member details
- [ ] Leave history per member

### 3. HR_ADMIN Role Testing

**User**: hradmin@cdbl.com

#### Accessible Pages
- [ ] Dashboard - HR Admin dashboard
- [ ] Leaves - All leaves with filters
- [ ] Approvals - First-level approvals
- [ ] Employees - Full directory with edit
- [ ] Admin - User management panel
- [ ] Reports - System reports
- [ ] Policies - Policy management
- [ ] Balance - All users' balances

#### Features to Test
- [ ] View all employees' leaves
- [ ] Search/filter all leaves
- [ ] Approve leaves (first level)
- [ ] Reject leaves with reason
- [ ] Forward to HR Head
- [ ] Manage user accounts
- [ ] Create new user
- [ ] Edit user details
- [ ] Change user role
- [ ] Deactivate user
- [ ] View audit logs
- [ ] Manage holidays
- [ ] Upload holiday calendar
- [ ] Generate reports

#### User Management
- [ ] Add new employee
- [ ] Edit employee details
- [ ] Change employee role
- [ ] Assign department/manager
- [ ] Deactivate employee
- [ ] Reset employee password
- [ ] Bulk user import (if available)

#### Holiday Management
- [ ] View holiday calendar
- [ ] Add single holiday
- [ ] Add multiple holidays (bulk)
- [ ] Edit holiday
- [ ] Delete holiday
- [ ] Import CSV holidays
- [ ] Export holiday calendar

#### Approval Workflow
- [ ] See first-level pending requests
- [ ] Approve with policy validation
- [ ] Reject with mandatory reason
- [ ] Forward to HR Head
- [ ] View policy violations
- [ ] Generate approval report

#### Audit & Logs
- [ ] View audit log
- [ ] Filter by user/action
- [ ] Filter by date range
- [ ] Export audit log
- [ ] See who modified what when

### 4. HR_HEAD Role Testing

**User**: hrhead@cdbl.com

#### Accessible Pages
- [ ] Dashboard - Executive dashboard
- [ ] Leaves - All system leaves
- [ ] Approvals - Final approvals (level 3)
- [ ] Employees - All employees
- [ ] Admin - Partial admin functions
- [ ] Reports - All reports
- [ ] Policies - Policy configuration
- [ ] Settings - System settings

#### Features to Test
- [ ] Final approval for leaves
- [ ] Reject with reason
- [ ] Escalate to CEO (if needed)
- [ ] View compliance violations
- [ ] Policy configuration
- [ ] Create/edit leave policies
- [ ] System-wide statistics
- [ ] Compliance reports
- [ ] Leave balance reports
- [ ] Department statistics
- [ ] Cannot edit user roles (limited)

#### Approval Authority
- [ ] Pending approvals list
- [ ] Approve any department leave
- [ ] Reject with mandatory reason
- [ ] Escalate to CEO
- [ ] Bulk approve (if available)
- [ ] View all approval chains
- [ ] Historical approvals

#### Policy Management
- [ ] View all policies
- [ ] Edit leave policy rules
- [ ] Configure leave types
- [ ] Set maximum limits
- [ ] Configure carry-forward rules
- [ ] Set blackout dates
- [ ] Policy version control

#### Reports
- [ ] Generate leave report
- [ ] Generate balance report
- [ ] Generate approval report
- [ ] Generate compliance report
- [ ] Export reports (PDF/Excel)
- [ ] Schedule report (if available)

### 5. CEO Role Testing

**User**: ceo@cdbl.com

#### Accessible Pages
- [ ] Dashboard - Executive dashboard
- [ ] All pages
- [ ] Full system access
- [ ] Can escalate/recall approvals
- [ ] Can see all system data

#### Features to Test
- [ ] Access all modules
- [ ] View executive KPIs
- [ ] Escalation approvals
- [ ] Recall approved leaves (if feature exists)
- [ ] View complete audit trail
- [ ] Access all reports
- [ ] System health status
- [ ] See all employee data
- [ ] Approve/reject any request

#### Full System View
- [ ] All departments visible
- [ ] All employees visible
- [ ] All leaves visible
- [ ] All approvals visible
- [ ] System statistics
- [ ] Policy compliance
- [ ] Leave trends

#### Escalation Approvals
- [ ] See escalated requests
- [ ] Approve escalated requests
- [ ] Reject with reason
- [ ] Send back to HR Head
- [ ] View escalation reason

### 6. SYSTEM_ADMIN Role Testing

**User**: admin@cdbl.com (if available)

#### Accessible Pages
- [ ] System admin panel
- [ ] Database management
- [ ] System logs
- [ ] System settings
- [ ] Backup/restore

#### Features to Test
- [ ] User account creation
- [ ] System configuration
- [ ] Database queries (if available)
- [ ] System health monitoring
- [ ] Logs and debugging
- [ ] Feature flags
- [ ] System maintenance

---

## Core Feature Testing

### Feature 1: Leave Application Flow

**Objective**: Complete end-to-end leave application and approval workflow

#### Step 1: Apply Leave (As Employee)
```
1. Navigate to /leaves/apply
2. Select Leave Type: "Casual Leave"
3. Start Date: 2025-12-01
4. End Date: 2025-12-03
5. Reason: "Family vacation"
6. Upload Medical Certificate: (skip for casual)
7. Click "Save Draft"
   ✓ Expected: Draft saved, can edit
8. Click "Submit"
   ✓ Expected: Confirmation modal
   ✓ Expected: Leave request created
   ✓ Expected: Status = "Submitted"
   ✓ Expected: Redirects to leave detail page
```

**Verification**:
- [ ] Leave appears in `/leaves` list
- [ ] Status shows "Submitted"
- [ ] Days calculated correctly (excluding weekends)
- [ ] Balance shows projected balance
- [ ] Timeline shows step 1 pending

#### Step 2: HR Admin Review (As HR_ADMIN)
```
1. Navigate to /approvals
2. Find the newly submitted leave
3. Click "View" or "Approve"
4. Review request details
5. Click "Approve"
6. Add optional comment: "Approved for family vacation"
7. Click "Confirm Approve"
   ✓ Expected: Approval recorded
   ✓ Expected: Status moves to "Pending" (next level)
   ✓ Expected: Notification sent
```

**Verification**:
- [ ] Approval recorded in timeline
- [ ] Status changed to "Pending"
- [ ] Comment visible in detail page
- [ ] Next approver (DEPT_HEAD) sees it in queue

#### Step 3: Department Head Review (As DEPT_HEAD)
```
1. Navigate to /approvals
2. Find the pending leave (from employee in same dept)
3. Click "View"
4. Review details and previous approvals
5. Click "Approve"
6. Add comment: "Approved by department"
7. Click "Confirm Approve"
   ✓ Expected: Second-level approval recorded
   ✓ Expected: Moves to HR_HEAD queue
```

**Verification**:
- [ ] Timeline shows 2 approvals
- [ ] Status still "Pending"
- [ ] Next approver (HR_HEAD) sees it

#### Step 4: HR Head Final Approval (As HR_HEAD)
```
1. Navigate to /approvals
2. Find the leave (2 approvals done)
3. Click "View"
4. Review all previous approvals
5. Check for policy violations (if any)
6. Click "Approve"
7. Click "Confirm Approve"
   ✓ Expected: Leave marked as "Approved"
   ✓ Expected: Timeline complete
```

**Verification**:
- [ ] Status changed to "Approved"
- [ ] Timeline shows all 3 approvals
- [ ] Leave appears in employee's approved leaves
- [ ] Balance automatically updated (if applicable)
- [ ] Employee notification sent

#### Step 5: CEO Escalation (Optional)
```
1. As CEO, navigate to /dashboard
2. Look for escalated requests (if any)
3. View the approved leave
4. If needed, can recall or escalate
```

**Test Variations**:

**Test Case 2.1: Rejection at Any Level**
```
At any approval level:
1. Click "Reject"
2. Select reason: "Insufficient staffing"
3. Add comment: "Too many leaves approved this month"
4. Click "Confirm Reject"
   ✓ Expected: Status = "Rejected"
   ✓ Expected: Request returns to employee
   ✓ Expected: Employee can modify and resubmit
```

**Test Case 2.2: Return for Modification**
```
1. At any level, instead of approve/reject
2. Click "Return" or "Send Back"
3. Add comment: "Please provide medical certificate"
4. Click "Return"
   ✓ Expected: Status = "Returned"
   ✓ Expected: Employee can edit request
   ✓ Expected: Employee can resubmit after edit
```

**Test Case 2.3: Policy Violation**
```
1. Try applying leave for 10 consecutive days (CL max 5/month)
2. System should show policy warning
3. Warning should show: "Exceeds monthly limit of 5 days"
4. Can still apply (soft warning)
5. On approval, HR Admin sees hard block warning
6. Cannot approve without override (admin only)
```

---

### Feature 2: Leave Balance Management

**Objective**: Verify accurate balance calculation and tracking

#### Test Case 1: View Balance
```
1. Navigate to /balance (or dashboard)
2. Verify all leave types displayed:
   - Casual Leave (CL): Opening + Accrued - Used
   - Medical Leave (ML): Opening + Accrued - Used
   - Earned Leave (EL): Opening + Accrued - Used
   - Extra Leave: 0 (if not accrued)
   - Special Leave: 0 (if not defined)

✓ Expected calculations:
  - CL: 5 + 8.33 - 2 = 11.33 days
  - ML: 0 + 11.67 - 1 = 10.67 days
  - EL: 15 + 15 - 5 = 25 days
```

**Verification**:
- [ ] All leave types visible
- [ ] Opening balance shown
- [ ] Accrued balance shown
- [ ] Used balance shown
- [ ] Available balance calculated correctly
- [ ] Balances match different roles' views

#### Test Case 2: Balance After Approval
```
1. Apply for 3 days of Casual Leave
2. Get approval through all levels
3. Check balance:
   - Casual Leave Available: 11.33 - 3 = 8.33 days

✓ Expected: Balance updated automatically
```

**Verification**:
- [ ] Used balance increased by 3 days
- [ ] Available balance decreased by 3 days
- [ ] Total balance correct
- [ ] No manual intervention needed

#### Test Case 3: Year-Specific Balance
```
1. Check balance for FY 2025
2. Check balance for FY 2026 (if available)
3. Verify balances don't mix between years
4. EL carry-forward rule:
   - Max 60 days can be carried forward
   - If >60, excess is forfeited

✓ Expected: Separate balances per year
```

#### Test Case 4: Balance Projection
```
1. Apply for leave (before submission)
2. Check "Projected Balance" shown
3. Apply different leave types
4. Verify projection updates
5. After submission, verify actual balance matches projection
```

---

### Feature 3: Approval Workflow

**Objective**: Test 4-step approval chain and routing

#### Approval Chain Visualization
```
Step 1: HR_ADMIN → Step 2: DEPT_HEAD → Step 3: HR_HEAD → Step 4: CEO (optional)

Test: View timeline for any approved leave
- [ ] All 4 steps visualized
- [ ] Completed steps show checkmark
- [ ] Pending steps show hourglass/pending
- [ ] Approver name shown for each step
- [ ] Approval date/time shown
- [ ] Comment from each level shown
```

#### Self-Approval Prevention
```
1. Create leave by CEO
2. As CEO, navigate to approvals
3. Verify your own request is NOT in approval queue
   ✓ Expected: Self-approvals blocked

Test with all roles:
- [ ] EMPLOYEE cannot approve own leaves
- [ ] DEPT_HEAD cannot approve own leaves
- [ ] HR_ADMIN cannot approve own leaves
- [ ] HR_HEAD cannot approve own leaves
- [ ] CEO cannot approve own leaves
```

#### Forward/Routing
```
1. As HR_ADMIN, view pending leave
2. Instead of approve, click "Forward"
3. Select next approver (if multiple options)
4. Add routing comment
5. Click "Forward"
   ✓ Expected: Leaves approval queue
   ✓ Expected: Next approver sees it
```

#### Bulk Actions (If Available)
```
1. As HR_HEAD, navigate to approvals
2. Select multiple pending requests
3. Click "Bulk Approve"
4. Add comment (applies to all)
5. Confirm
   ✓ Expected: All selected leaves approved
   ✓ Expected: Comments added to all
```

---

### Feature 4: Medical Certificate Upload

**Objective**: Test file upload for medical leave

#### Test Case 1: Valid Upload
```
1. Navigate to /leaves/apply
2. Select Leave Type: "Medical Leave"
3. Set dates: 2025-12-10 to 2025-12-12
4. In "Medical Certificate" field:
   - Click "Choose File"
   - Select file: sample_medical.pdf
   - File size: 2 MB (within 5 MB limit)
   ✓ Expected: File previewed/confirmed
5. Click "Save Draft"
   ✓ Expected: File saved with request
```

**Verification**:
- [ ] File appears in request detail
- [ ] File can be downloaded
- [ ] File can be replaced (edit mode)
- [ ] File persists after reload

#### Test Case 2: Invalid File - Wrong Type
```
1. Select Medical Leave
2. Try uploading: document.txt
   ✓ Expected: Error message
   ✓ Expected: "Only PDF, JPG, PNG allowed"
   ✓ Expected: File rejected
```

#### Test Case 3: Invalid File - Size Too Large
```
1. Select Medical Leave
2. Try uploading: large_file.pdf (6 MB)
   ✓ Expected: Error message
   ✓ Expected: "File size must be <5 MB"
   ✓ Expected: Upload button disabled
```

#### Test Case 4: File Operations
```
1. Upload valid certificate
2. Preview button shows file preview
3. Remove button deletes file
4. Re-upload new file
   ✓ Expected: Old file replaced
```

---

### Feature 5: Holiday Management

**Objective**: Test holiday calendar and impact on leave

#### Test Case 1: View Holidays
```
1. Navigate to /holidays (or calendar page)
2. Verify all holidays displayed for 2025:
   - Republic Day: 2025-01-26
   - Bengali New Year: 2025-03-17
   - Independence Day: 2025-08-15
   - Victory Day: 2025-12-16
   - Christmas (Optional): 2025-12-25

✓ Expected: All holidays shown in calendar view
```

#### Test Case 2: Add Holiday
```
As HR_ADMIN:
1. Navigate to holiday management
2. Click "Add Holiday"
3. Select date: 2025-09-16 (if not already added)
4. Enter name: "Special Holiday"
5. Select type: "National"
6. Click "Add"
   ✓ Expected: Holiday added to calendar
   ✓ Expected: Appears in list
```

#### Test Case 3: Apply Leave on Holiday
```
1. Apply for leave including a holiday
2. Example: Apply CL from 2025-12-15 to 2025-12-17
3. Holiday on 2025-12-16 (Victory Day)
   ✓ Expected: System calculates only 2 days (excluding holiday)
   ✓ Expected: Balance deducted for 2 days only
   ✓ Expected: Approval chain sees 2 days
```

#### Test Case 4: Bulk Holiday Import (As HR_ADMIN)
```
1. Prepare CSV file with holidays:
   Date,Holiday_Name,Type
   2025-11-01,Custom Holiday,National
   2025-11-02,Another Holiday,National

2. Navigate to holiday management
3. Click "Import Holidays"
4. Upload CSV file
5. Click "Confirm Import"
   ✓ Expected: All holidays imported
   ✓ Expected: Duplicates skipped
   ✓ Expected: Success message shown
```

---

### Feature 6: Notifications

**Objective**: Test notification system for all events

#### Test Case 1: Leave Submission Notification
```
1. As Employee, submit leave request
   ✓ Expected: In-app notification: "Leave submitted for approval"
2. Click on notification
   ✓ Expected: Navigates to leave detail
```

#### Test Case 2: Approval Notification
```
1. As HR_ADMIN, approve a leave
   ✓ Expected: Employee receives notification
   ✓ Expected: Text: "Your leave request for CL from 12-01 to 12-03 approved"
2. As DEPT_HEAD, approve
   ✓ Expected: HR_HEAD receives notification
3. As HR_HEAD, approve
   ✓ Expected: Employee receives "Final approval" notification
```

#### Test Case 3: Rejection Notification
```
1. As HR_ADMIN, reject a leave
2. Add reason: "Insufficient staffing"
   ✓ Expected: Employee receives notification
   ✓ Expected: Reason included: "Rejected - Insufficient staffing"
   ✓ Expected: Can resubmit link shown
```

#### Test Case 4: Notification Count
```
1. Generate multiple notifications
2. Check navbar notification icon
   ✓ Expected: Shows count (e.g., "3")
   ✓ Expected: Updates in real-time
3. Click on icon
   ✓ Expected: Dropdown shows recent notifications
   ✓ Expected: Shows unread status
4. Click "Mark all as read"
   ✓ Expected: Count disappears or shows 0
```

#### Test Case 5: Notification Types
Verify all 12 notification types appear:
- [ ] Leave Submitted
- [ ] Leave Approved
- [ ] Leave Rejected
- [ ] Leave Returned
- [ ] Leave Cancelled
- [ ] Approval Request
- [ ] Approval Done
- [ ] Balance Updated
- [ ] Policy Alert
- [ ] Holiday Updated
- [ ] User Added
- [ ] System Alert

---

## Pain Points & Edge Cases

### Pain Point 1: Leave Dates Spanning Weekend/Holidays

**Description**: Applying leave that includes weekends and holidays

#### Test Case 1: Weekend Exclusion
```
Scenario: Apply leave Thursday to Monday
- Start: 2025-12-04 (Thursday)
- End: 2025-12-08 (Monday)
- Expected: Only 4 days (Thu-Fri + Mon, excluding Sat-Sun)

1. Apply leave with dates above
2. Verify days calculation shows 4
3. Verify balance deducted by 4
✓ Expected: Correct calculation
```

#### Test Case 2: Holiday Exclusion
```
Scenario: Apply leave overlapping Victory Day (Dec 16)
- Start: 2025-12-15 (Monday)
- End: 2025-12-17 (Wednesday)
- Holiday: 2025-12-16 (Tuesday)
- Expected: Only 2 days (Mon + Wed, excluding Tue)

1. Apply leave
2. Verify calculation shows 2 days
3. Check balance deduction
✓ Expected: Holiday excluded from count
```

#### Test Case 3: Multiple Holidays in Range
```
Scenario: 5-day holiday period
- Leave: 2025-12-24 to 2025-12-28
- Holidays: 2025-12-25 (Christmas), 2025-12-26 (Observed), 2025-12-27 (Extra)
- Weekends: 2025-12-27 (Sat), 2025-12-28 (Sun)
- Expected: Only 2 days (Wed 24, Thu 25 which is holiday)

Actually: Just 2 actual working days
```

### Pain Point 2: Balance Insufficient

**Description**: Applying leave with insufficient balance

#### Test Case 1: Exact Balance
```
Employee has: 5 days CL available
Apply for: Exactly 5 days
   ✓ Expected: Form shows "Available: 5, Applying: 5, After: 0"
   ✓ Expected: No warning
   ✓ Expected: Can submit
```

#### Test Case 2: Exceed Balance
```
Employee has: 5 days CL available
Apply for: 6 days CL
   ✓ Expected: Error message: "Insufficient balance"
   ✓ Expected: Shows available vs requested
   ✓ Expected: Form cannot submit
```

#### Test Case 3: Zero Balance
```
Employee has: 0 days ML available
Try to apply: Any ML
   ✓ Expected: Disabled error message
   ✓ Expected: Cannot submit form
   ✓ Expected: Shows "Balance: 0 days"
```

#### Test Case 4: Policy Override (HR_ADMIN)
```
Employee has: 3 days CL
HR_ADMIN approves: 5 days CL request
   ✓ Expected: HR sees hard block warning
   ✓ Expected: Requires admin override checkbox
   ✓ Expected: Can still approve with warning
   ✓ Expected: Audit log records override
```

### Pain Point 3: Concurrent Leaves

**Description**: User has overlapping approved leaves

#### Test Case 1: Try to Apply During Approved Leave
```
Employee has approved leave: Dec 1-5
Try to apply new leave: Dec 4-8
   ✓ Expected: Warning: "You have approved leave during this period"
   ✓ Expected: Dates highlighted in conflict
   ✓ Expected: Can still apply (soft warning)
```

#### Test Case 2: Multiple Approval Levels Pending
```
1. Submit leave request
2. HR_ADMIN approves (pending DEPT_HEAD)
3. Try to modify the leave
   ✓ Expected: Cannot modify in-flight leaves
   ✓ Expected: Must return/reject before modifying
```

### Pain Point 4: Leave Cancellation

**Description**: Cancelling approved leaves and its impact

#### Test Case 1: Cancel Approved Leave
```
Approved leave: Dec 1-3 (3 days CL used)
1. Click "Cancel Leave"
2. Provide reason: "Changed plans"
3. Click "Confirm Cancel"
   ✓ Expected: Status changes to "Cancellation_Requested"
   ✓ Expected: Approval chain sees request
   ✓ Expected: HR_HEAD must approve cancellation
```

#### Test Case 2: Cancellation Approval
```
1. As HR_HEAD, see cancellation request
2. Click "Approve Cancellation"
3. Confirm
   ✓ Expected: Status = "Cancelled"
   ✓ Expected: Balance restored: CL available now 11.33 + 3 = 14.33
   ✓ Expected: Used balance decreased: 2 - 3 = -1 (invalid, should be 0 with adjustment)
```

#### Test Case 3: Cancellation Rejection
```
1. As HR_HEAD, see cancellation request
2. Click "Reject Cancellation"
3. Provide reason: "Outside cancellation window"
4. Confirm
   ✓ Expected: Status = "Approved" (stays approved)
   ✓ Expected: Cancellation request removed
   ✓ Expected: Employee notified of rejection
```

### Pain Point 5: Leave Modification After Submission

**Description**: Modifying dates/type after submitting

#### Test Case 1: Modify Pending Leave
```
Status: Pending (HR_ADMIN reviewing)
Try to modify:
   ✓ Expected: "Cannot modify - Under review"
   ✓ Expected: Must request return from HR_ADMIN
```

#### Test Case 2: Modify Returned Leave
```
Status: Returned (by HR_ADMIN for missing certificate)
1. Edit button is enabled
2. Change certificate/dates
3. Click "Save"
   ✓ Expected: Changes saved
4. Click "Resubmit"
   ✓ Expected: Goes back to approval chain
   ✓ Expected: Starts from HR_ADMIN again
```

#### Test Case 3: Modify Draft Leave
```
Status: Draft
1. Edit button enabled
2. Change all fields
3. Click "Save Draft"
   ✓ Expected: Changes saved
4. Can continue modifying until submitted
```

### Pain Point 6: Policy Violations

**Description**: Testing policy enforcement and warnings

#### Test Case 1: Monthly Limit Violation
```
CL Policy: Max 5 days per month
December approved: 3 days CL (Dec 1-3)
Try to apply: 4 days CL (Dec 10-13)
Total would be: 7 days (exceeds 5)
   ✓ Expected: Warning shown: "Exceeds monthly limit by 2 days"
   ✓ Expected: Can still apply (soft warning)
   ✓ Expected: HR_ADMIN sees hard block warning
```

#### Test Case 2: Annual Limit Violation
```
EL Policy: Max 20 days per year
FY 2025 taken: 15 days EL
Try to apply: 8 days EL (would be 23 total)
   ✓ Expected: Error: "Exceeds annual limit by 3 days"
   ✓ Expected: Cannot apply
   ✓ Expected: Shows remaining allocation (5 days)
```

#### Test Case 3: Blackout Date Violation
```
Blackout dates configured: Dec 20-31 (year-end closure)
Try to apply: Leave on Dec 21
   ✓ Expected: Error: "Blackout period - No leaves allowed"
   ✓ Expected: Cannot submit
   ✓ Expected: Dates highlighted in red
```

#### Test Case 4: Carry-Forward Limit
```
EL carry-forward policy: Max 60 days
Employee has: 70 days EL from last year
Current year: 20 days allocated
Expected calculation:
- FY 2024 closing: 70 days
- Carry-forward limit: 60 days
- Forfeited: 10 days
- FY 2025 opening: 60 days
- Add 20 days: Total 80 days

Test:
1. Check balance shows 60 (not 70)
   ✓ Expected: Forfeiture enforced
```

### Pain Point 7: Different Leave Types

**Description**: Testing all 11 leave types have correct rules

#### Test All Leave Types
```
1. CASUAL_LEAVE (CL)
   - Max: 5 days/month, 10 days/year
   - Carry-forward: Not allowed
   - Verification:
     [ ] Apply and verify limits enforced
     [ ] Month-end shows reset
     [ ] Cannot carry forward

2. MEDICAL_LEAVE (ML)
   - Max: 14 days/year
   - Requires certificate for >2 days
   - Verification:
     [ ] >2 days requires certificate
     [ ] Certificate file validation works
     [ ] Annual limit enforced

3. EARNED_LEAVE (EL)
   - Max: 20 days/year accrual
   - Carry-forward: Max 60 days
   - Accrual: 1.67 days/month
   - Verification:
     [ ] Accrued correctly
     [ ] Carry-forward limited to 60
     [ ] Annual cap enforced

4. EXTRA_LEAVE_WITH_PAY (EWP)
   - Rare, special cases
   - Requires approval chain
   - Verification:
     [ ] Can apply (if configured)
     [ ] Requires all approvals

5. EXTRA_LEAVE_WITHOUT_PAY (EWOP)
   - Unpaid leave
   - Max: Varies by policy
   - Verification:
     [ ] Can apply
     [ ] Does not affect paid balance
     [ ] Appears in reports as unpaid

6. MATERNITY_LEAVE (MTL)
   - Max: 90 days
   - For female employees
   - Verification:
     [ ] Only visible to female employees
     [ ] Cannot apply if male
     [ ] 90-day limit enforced

7. PATERNITY_LEAVE (PTL)
   - Max: 7 days
   - For male employees
   - Verification:
     [ ] Only visible to male employees
     [ ] 7-day limit enforced

8. STUDY_LEAVE (STL)
   - Requires documentation
   - Requires approval chain
   - Verification:
     [ ] Requires study plan/certificate
     [ ] Approval chain works

9. SPECIAL_DISABILITY_LEAVE (SDL)
   - For employees with disabilities
   - Max: Variable
   - Verification:
     [ ] Only appears if eligible
     [ ] Appropriate limits

10. QUARANTINE_LEAVE (QL)
    - For health/infection scenarios
    - Max: As needed
    - Verification:
      [ ] Can apply
      [ ] Appropriate messaging

11. SPECIAL_LEAVE (SL)
    - Rare, case-by-case
    - Requires special approval
    - Verification:
      [ ] Can apply (if enabled)
      [ ] Requires all approvals
```

---

## Browser & Accessibility Testing

### Browser Compatibility

Test on the following browsers:

#### Chrome/Edge (Chromium)
```
1. Open http://localhost:3000
2. Dashboard loads
3. Check console for errors (F12)
   ✓ Expected: No errors or warnings
4. Test all pages
   ✓ Expected: All working
5. Responsive design (toggle device toolbar)
   ✓ Expected: Looks good on mobile/tablet/desktop
```

#### Firefox
```
1. Same steps as Chrome
2. Check specific Firefox features:
   [ ] Animations smooth
   [ ] Dropdowns work
   [ ] Modals center correctly
   [ ] Console clean
```

#### Safari (macOS)
```
1. Same as Chrome
2. Check Safari-specific issues:
   [ ] Touch interactions work
   [ ] Fonts render correctly
   [ ] No layout shifts
```

### Mobile Responsiveness

#### iPhone/iPad (375px width)
```
1. Navigate to /dashboard
   [ ] Sidebar collapses to hamburger
   [ ] Navigation readable
   [ ] Buttons large enough to tap
   [ ] No horizontal scroll

2. Navigate to /leaves/apply
   [ ] Form fields full width
   [ ] Date pickers work
   [ ] File upload works
   [ ] Submit button accessible

3. Leave list /leaves
   [ ] Table becomes cards on mobile
   [ ] Can scroll horizontally if needed
   [ ] Filters accessible
```

#### Tablet (768px width)
```
1. Layout adapts for tablet
2. Two-column layout if applicable
3. Touch targets min 44px
4. Modals sized appropriately
```

### Accessibility Testing

#### Keyboard Navigation
```
1. On any page, use TAB to navigate
   [ ] Follows logical order
   [ ] No keyboard traps
   [ ] Can reach all buttons

2. Use SHIFT+TAB to go backward
   [ ] Order reverses
   [ ] All elements reachable

3. Form elements:
   [ ] TAB to next field
   [ ] ENTER submits form
   [ ] ESC closes modals
```

#### Screen Reader (NVDA/JAWS on Windows, VoiceOver on Mac)
```
1. Enable screen reader
2. Navigate dashboard
   [ ] Headings announced correctly
   [ ] Labels announced with form fields
   [ ] Buttons have clear text
   [ ] Status messages announced
   [ ] Table structure announced

3. Application form:
   [ ] Form label announce for each field
   [ ] Error messages announced
   [ ] Success messages announced
```

#### Color Contrast
```
1. Use Contrast Checker tool (WAVE, Lighthouse)
2. Check all text:
   [ ] Text on background: 4.5:1 ratio (normal)
   [ ] Large text: 3:1 ratio minimum
   [ ] Interactive elements: sufficient contrast
   [ ] Error messages red + icon
```

#### Focus Indicators
```
1. TAB through page
   [ ] Focus outline visible
   [ ] Outline color distinct from background
   [ ] Not removed with CSS (outline: none)
   [ ] At least 2px visible
```

---

## Test Report Template

### Test Summary

```markdown
# Test Report - CDBL Leave Management System
Date: [DATE]
Tester: [NAME]
Test Environment: Development
Build Version: [VERSION]

## Summary
Total Test Cases: ___
Passed: ___
Failed: ___
Skipped: ___
Pass Rate: ___%

## Critical Issues
(Issues blocking release)
- [ ] None found
- [ ] Issue 1: [DESCRIPTION]
- [ ] Issue 2: [DESCRIPTION]

## High Priority Issues
(Features broken)
- [ ] None found
- [ ] Issue 1: [DESCRIPTION]

## Medium Priority Issues
(Features work but not ideal)
- [ ] None found

## Low Priority Issues
(Minor/nice-to-have)
- [ ] None found

## Testing Done
- [x] Component Testing
- [x] Role-Based Testing
- [x] Feature Testing
- [x] Edge Cases
- [x] Browser Compatibility
- [x] Accessibility
- [x] Mobile Responsiveness
- [x] Performance
- [x] Security

## Browser Test Results
| Browser | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Chrome | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✓ | ✓ |
| Safari | ✓ | ✓ | ✓ |
| Edge | ✓ | ✓ | ✓ |

## Recommendations
1. [RECOMMENDATION]
2. [RECOMMENDATION]

## Sign Off
Tester: _________________
Date: _________________
```

---

## Automated Testing Checklist

For Claude Code / Automated Testing Agent:

### Pre-Test Checklist
- [ ] Authentication disabled (SKIP_AUTH=true)
- [ ] Database reset completed
- [ ] All 6 test users available
- [ ] Test data loaded (holidays, balances)
- [ ] Application running on port 3000
- [ ] No errors in console

### Automated Test Sequence
```
1. Test Login (if auth not bypassed)
   - Valid credentials
   - Invalid credentials
   - Session persistence

2. Dashboard Testing
   - Each role's dashboard loads
   - Data displays correctly
   - Widgets functional

3. Component Testing
   - All 29 UI components functional
   - Navigation working
   - Modals/dialogs work

4. Leave Application
   - All 11 leave types selectable
   - Form validation working
   - File upload working
   - Draft save/load working
   - Submission successful

5. Approval Workflow
   - 4-step chain working
   - Self-approval prevented
   - Rejection working
   - Return for modification working

6. Balance Management
   - Real-time updates
   - Year-specific tracking
   - Accrual calculation

7. Edge Cases
   - Weekend exclusion in dates
   - Holiday exclusion in dates
   - Policy violation warnings
   - Insufficient balance errors

8. All Roles
   - Employee: Can apply, cannot approve
   - DEPT_HEAD: Can see team, approve
   - HR_ADMIN: Can approve first level
   - HR_HEAD: Can approve final level
   - CEO: Full access

9. Accessibility
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - Focus indicators

10. Mobile
    - Responsive design
    - Touch interactions
    - Mobile optimized
```

---

## Quick Reference - Common Tasks

### Reset to Initial State
```bash
# 1. Stop server (Ctrl+C)
# 2. Reset database
npx prisma migrate reset

# 3. Verify database
npx prisma db push

# 4. Start server
npm run dev
```

### Test Different Role
```bash
# 1. Edit .env.local
MOCK_USER_ROLE=HR_HEAD

# 2. Reload page (F5 or Cmd+R)
# 3. You're now logged in as HR_HEAD
```

### Check Logs
```bash
# Database logs
npx prisma studio

# Application logs
npm run dev # Check terminal output
```

### Database Queries
```bash
# Connect to database
mysql -u user -p cdbl_leave_test

# Check users
SELECT id, email, name, role FROM User;

# Check leave requests
SELECT id, userId, startDate, endDate, status FROM LeaveRequest;

# Check balances
SELECT userId, leaveType, available FROM Balance;
```

---

## Conclusion

This comprehensive testing guide covers:
- 200+ test cases
- All 6 user roles
- All 11 leave types
- Complete component testing
- Edge cases and pain points
- Browser and accessibility testing
- Automated testing sequence

**Expected Duration**: 4-6 hours for complete manual testing

**Estimated Automated Testing**: 1-2 hours for automated test suite

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Status**: Ready for QA Team
