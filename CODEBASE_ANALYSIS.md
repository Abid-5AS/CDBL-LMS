# CDBL Leave Management System - Comprehensive Codebase Analysis

**Document Date**: November 14, 2025  
**Project**: CDBL Leave Management System  
**Framework**: Next.js 16.0.0 with React 19.2.0  
**Database**: MySQL with Prisma ORM  

---

## 1. PROJECT OVERVIEW

### 1.1 Project Type
**Full-Stack Web Application** - A modern, policy-compliant leave management system for Central Depository Bangladesh Limited (CDBL).

### 1.2 Key Objectives
- Digitize and automate leave management workflows
- Replace manual paper-based processes with digital solutions
- Enforce CDBL HR Leave Policy (v1.1) automatically
- Provide role-based access for different user types
- Maintain audit trail for compliance
- Real-time balance tracking and visibility

### 1.3 Technology Stack

**Frontend:**
- Next.js 16.0.0 (App Router)
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.x
- shadcn/ui components

**Backend:**
- Node.js (runtime)
- Next.js API Routes
- Prisma 6.17.1 ORM

**Database:**
- MySQL 8.0+
- Prisma migrations

**Authentication & Security:**
- JWT (JSON Web Tokens)
- HTTP-only cookies
- bcryptjs for password hashing
- José for JWT signing/verification

**Validation & Forms:**
- Zod (schema validation)
- React Hook Form
- Client & server-side validation

**Additional Libraries:**
- Framer Motion (animations)
- Recharts (data visualization)
- jsPDF (PDF generation)
- node-cron (background jobs)
- Nodemailer (email)
- date-fns & date-fns-tz (date handling)
- SWR (data fetching)
- Zustand (state management)

---

## 2. FOLDER STRUCTURE & ORGANIZATION

### 2.1 Main Directory Layout

```
cdbl-leave-management/
├── app/                          # Next.js App Router pages & API routes
│   ├── api/                      # RESTful API endpoints
│   ├── dashboard/                # Dashboard pages (role-specific)
│   ├── leaves/                   # Leave management (apply, view, edit)
│   ├── admin/                    # Administrative functions
│   ├── employees/                # Employee management & directory
│   ├── approvals/                # Approval queue interface
│   ├── balance/                  # Leave balance tracking
│   ├── holidays/                 # Holiday calendar
│   ├── policies/                 # Policy documentation & guidance
│   ├── reports/                  # Reporting module
│   ├── settings/                 # User settings
│   ├── help/                     # Help & support center
│   ├── login/                    # Authentication entry point
│   ├── manager/                  # Manager-specific features
│   ├── hr-head/                  # HR Head dashboard
│   ├── ceo/                      # CEO dashboard
│   ├── encashment/               # EL encashment requests
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Home page
│
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components (29 files)
│   │   ├── button, input, card, modal, etc.
│   ├── layout/                   # Navigation & layout components
│   │   ├── TopNavBar.tsx         # Main navigation bar
│   │   ├── ControlCenter.tsx     # Control panel
│   │   ├── LayoutWrapper.tsx
│   │   ├── FloatingDock.tsx      # Bottom navigation
│   │   ├── SearchModal.tsx
│   │   └── LiveClock.tsx
│   ├── dashboard/                # Dashboard-specific components (64 files)
│   │   ├── KPI & metric cards
│   │   ├── Charts & analytics
│   │   ├── Timeline components
│   │   ├── Leave balance displays
│   │   └── Role-specific widgets
│   ├── shared/                   # Shared/reusable components
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FilterBar.tsx
│   │   ├── KPICard.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── UnifiedModal.tsx
│   ├── filters/                  # Filter components
│   │   ├── FilterChips.tsx
│   │   ├── SearchInput.tsx
│   │   └── FilterBar.tsx
│   ├── cards/                    # Card-based UI components
│   ├── hr-admin/                 # HR Admin specific components
│   ├── roles/                    # Role-specific view components
│   │   ├── EmployeeView.tsx
│   │   ├── ManagerView.tsx
│   │   ├── HRAdminView.tsx
│   │   ├── HRHeadView.tsx
│   │   └── ExecutiveView.tsx
│   ├── notifications/            # Notification components
│   ├── leaves/                   # Leave-specific components
│   ├── admin/                    # Admin panel components
│   ├── reports/                  # Reporting components
│   ├── navbar/                   # Navigation components
│   ├── unified/                  # Unified layout components
│   └── legacy/                   # Deprecated components (archived)
│
├── lib/                          # Business logic & utilities
│   ├── auth-jwt.ts               # JWT authentication
│   ├── auth.ts                   # Auth utilities
│   ├── rbac.ts                   # Role-based access control (6 functions)
│   ├── policy.ts                 # Policy enforcement logic
│   ├── workflow.ts               # Approval workflow logic
│   ├── validation-rules.ts       # Input validation schemas
│   ├── apiClient.ts              # Unified API client
│   ├── exportUtils.ts            # Export functionality
│   ├── date-utils.ts             # Date/time utilities
│   ├── working-days.ts           # Working day calculations
│   ├── leave-days.ts             # Leave day calculations
│   ├── status-colors.ts          # Status-to-color mapping
│   ├── navigation.ts             # Route navigation
│   ├── page-context.ts           # Page context & metadata
│   ├── design-tokens.ts          # Design system tokens
│   ├── prisma.ts                 # Prisma client singleton
│   ├── breadcrumbs.ts            # Breadcrumb generation
│   ├── storage.ts                # Browser storage utilities
│   ├── session.ts                # Session management
│   ├── user-context.tsx          # User context provider
│   ├── errors.ts                 # Error types & handling
│   ├── animations.ts             # Animation utilities
│   ├── icons.ts                  # Icon mapping
│   ├── seed-utils.ts             # Database seeding
│   └── (30+ utility files)
│
├── prisma/                       # Database configuration
│   ├── schema.prisma             # Prisma data model
│   ├── seed.ts                   # Database seeding script
│   └── migrations/               # Database migration files
│       ├── 20251022042930_init_mysql/
│       ├── 20251026084848_sudo/
│       └── (6 total migrations)
│
├── docs/                         # Comprehensive documentation (23+ files)
│   ├── API/
│   │   └── API_Contracts.md      # API endpoint documentation
│   ├── Policy Logic/             # Detailed policy rules (12 documents)
│   │   ├── 01-Leave Types and Entitlements.md
│   │   ├── 02-Leave Application Rules and Validation.md
│   │   ├── 03-Holiday and Weekend Handling.md
│   │   ├── 04-Leave Balance and Accrual Logic.md
│   │   ├── 05-File Upload and Medical Certificate Rules.md
│   │   ├── 06-Approval Workflow and Chain.md
│   │   ├── 07-Cancellation and Modification Rules.md
│   │   ├── 08-Date Time and Display Logic.md
│   │   ├── 09-Role Based Behavior.md
│   │   ├── 10-System Messages and Error Handling.md
│   │   ├── 11-Miscellaneous Business Rules.md
│   │   └── 12-Source Mapping Index.md
│   ├── References/
│   │   ├── Data_Models.md
│   │   ├── RBAC.md
│   │   └── Workflow_Spec.md
│   ├── 01-Project-Goals.md
│   ├── 02-Technical-Documentation.md
│   ├── 03-Database-Schema.md
│   ├── 04-User-Roles-and-Permissions.md
│   ├── 05-System-Functionality.md
│   └── (18+ additional documentation files)
│
├── tests/                        # Test files
│   ├── api/                      # API endpoint tests
│   ├── components/               # Component unit tests
│   ├── e2e/                      # End-to-end tests
│   ├── integration/              # Integration tests
│   ├── jobs/                     # Job/scheduler tests
│   ├── lib/                      # Library function tests
│   └── unit/                     # Unit tests
│
├── scripts/                      # Utility scripts
│   ├── jobs/                     # Background job scripts
│   │   ├── el-accrual.ts         # EL accrual job
│   │   └── auto-lapse.ts         # CL auto-lapse job
│   ├── scheduler.ts              # Job scheduler
│   ├── policy-audit.ts           # Policy compliance check
│   ├── verify-demo-data.ts       # Demo data validation
│   ├── verify-deployment.ts      # Deployment verification
│   └── (10+ additional scripts)
│
├── public/                       # Static assets
│   ├── brand/
│   │   └── office-fallback.jpg
│   ├── SVG icons
│   └── favicons
│
├── qa/                           # QA & testing artifacts
│   ├── screenshots/
│   ├── test reports/
│   └── QA documentation
│
└── Root config files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── .env
    └── ESLint config
```

---

## 3. MAIN COMPONENTS & FEATURES

### 3.1 Component Categories

#### **UI Components (29 files)**
- Forms: Input, Button, Textarea, Label, Form
- Layout: Accordion, Tabs, Separator, Breadcrumb
- Dialogs: Dialog, Alert Dialog, Popover, Dropdown Menu
- Data: Table, Select, Calendar, Checkbox
- Feedback: Toast (Sonner), Progress, Skeleton
- Interactive: Command (Command Palette), Tooltip

#### **Layout Components (6 files)**
- `TopNavBar.tsx` - Main navigation bar with user menu
- `ControlCenter.tsx` - Central control panel (13.1 KB)
- `FloatingDock.tsx` - Bottom floating navigation
- `LayoutWrapper.tsx` - Layout container
- `SearchModal.tsx` - Global search functionality
- `LiveClock.tsx` - Real-time clock display

#### **Dashboard Components (64 files)**
- **Metrics & Cards**: KPICard, LeaveBalanceCards, LeaveSummaryCard, PendingLeaveRequestsTable
- **Analytics**: AnalyticsSection, LeaveHeatmap, LeaveTrendChart, LeaveTypePieChart
- **Timelines**: ApprovalTimeline, ActiveRequestsTimeline, SortedTimeline, LiveActivityTimeline
- **Approval Features**: ReviewLeaveModal, LeaveDetailsModal, ApprovalStepper
- **Team Features**: TeamOnLeaveWidget, DeptHeadPendingTable, DeptHeadTeamOverview
- **Widgets**: InsightsWidget, SmartRecommendations, QuickActions, UpcomingHolidays

#### **Shared Components (11 files)**
- `StatusBadge.tsx` - Status display component
- `EmptyState.tsx` - Empty state placeholder
- `FilterBar.tsx` - Filter interface
- `KPICard.tsx` - Reusable KPI card
- `ConfirmModal.tsx` - Confirmation dialogs
- `UnifiedModal.tsx` - Universal modal component
- `LeaveTable.tsx` - Leave data table
- `CancellationTable.tsx` - Cancellation display
- `ErrorBoundary.tsx` - Error handling

#### **Filter Components (3 files)**
- `FilterChips.tsx` - Chip-based filtering
- `SearchInput.tsx` - Search functionality
- `FilterBar.tsx` - Bar-style filters

#### **Role-Specific Views (5 files)**
- `EmployeeView.tsx` - Employee dashboard view
- `ManagerView.tsx` - Department head view
- `HRAdminView.tsx` - HR admin view
- `HRHeadView.tsx` - HR head view
- `ExecutiveView.tsx` - CEO/Executive view

#### **HR Admin Components (3 files)**
- `ApprovalTable.tsx` - Approval queue display (15.3 KB)
- `HRAdminStats.tsx` - HR metrics display
- Type definitions

---

### 3.2 Page Routes & Navigation

#### **Main Pages**
1. **Authentication**
   - `/login` - Login page (email/password)
   - `/` - Home/redirect page

2. **Personal Dashboard**
   - `/dashboard` - User's personal dashboard (role-aware)
   - `/dashboard/dept-head` - Department head view
   - `/dashboard/hr-admin` - HR admin view
   - `/dashboard/employee` - Employee view
   - `/dashboard/admin` - System admin view
   - `/dashboard/ceo` - Executive dashboard
   - `/dashboard/hr-head` - HR head dashboard

3. **Leave Management**
   - `/leaves` - Leave list/history
   - `/leaves/my` - My leaves view
   - `/leaves/apply` - Leave application form
   - `/leaves/[id]` - Leave details page
   - `/leaves/[id]/edit` - Leave editing page

4. **Approvals & Workflows**
   - `/approvals` - Pending approvals queue
   - API: POST `/api/leaves/[id]/approve|reject|forward`

5. **Employee Management**
   - `/employees` - Employee directory
   - `/employees/[id]` - Employee profile & details
   - `/admin` - Admin panel
   - `/admin/users` - User management

6. **Leave Balance**
   - `/balance` - Leave balance tracking
   - API: GET `/api/balance/mine`

7. **Holiday Management**
   - `/holidays` - Holiday calendar view
   - `/admin/holidays` - Holiday administration
   - API: GET/POST `/api/holidays`

8. **Administrative**
   - `/admin` - Main admin dashboard
   - `/admin/audit` - Audit logs
   - `/admin/holidays` - Holiday management
   - API: GET `/api/admin/users`, `/api/admin/logs`, etc.

9. **Reports & Analytics**
   - `/reports` - Reporting dashboard
   - `/balance` - Balance reports
   - API: GET `/api/dashboard/analytics`, `/api/reports/export`

10. **User Features**
    - `/policies` - Policy documentation
    - `/help` - FAQ & support
    - `/settings` - User preferences
    - `/encashment` - EL encashment requests

---

## 4. AUTHENTICATION & AUTHORIZATION SYSTEM

### 4.1 Authentication Method

**JWT-Based Authentication**
- **Location**: `/lib/auth-jwt.ts`, `/lib/auth.ts`
- **Token Storage**: HTTP-only cookies (secure, XSS protected)
- **Token Name**: `session_token`
- **Additional Cookies**: `auth_user_email`, `auth_user_name`
- **Token Lifespan**: 8 hours (28,800 seconds)
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: From `JWT_SECRET` or `AUTH_SECRET` environment variable

**Auth Flow:**
1. User logs in with email/password
2. Password verified with bcryptjs
3. JWT token generated with user claims (sub, email, name, role)
4. Token stored in HTTP-only cookie + user data in cookies
5. On each request, token is verified and cached via React's `cache()`
6. Session validated automatically on protected routes

**Key Functions** (`lib/auth-jwt.ts`):
- `signJwt(claims, maxAgeSeconds)` - Generate JWT token
- `verifyJwt(token)` - Verify and decode JWT
- `getCurrentUser()` - Get authenticated user (cached)
- `getJwtCookieName()` - Get cookie name constant

### 4.2 Role-Based Access Control (RBAC)

**6 User Roles** (Hierarchical):
1. **EMPLOYEE** - Base role
2. **DEPT_HEAD** - Department head/manager
3. **HR_ADMIN** - HR operations staff
4. **HR_HEAD** - HR department head
5. **CEO** - Chief Executive Officer
6. **SYSTEM_ADMIN** - System administration (infrastructure)

**RBAC Permission Functions** (`lib/rbac.ts`):
- `canViewAllRequests(role)` - Can view all leave requests
- `canApprove(role)` - Can perform approval actions
- `canViewEmployee(viewerRole, targetRole)` - Profile visibility
- `canEditEmployee(viewerRole, targetRole)` - Profile edit permissions
- `getVisibleRoles(role)` - Roles visible in UI dropdowns
- `canAssignRole(viewerRole, targetRole)` - Role assignment permissions
- `canCreateEmployee(role)` - Employee creation permissions
- `canCancel(role, isOwnLeave)` - Leave cancellation
- `canReturn(role)` - Return leave for modification
- `canManageSystemStructure/Policy/Holidays/Audit(role)` - Admin functions

**Permission Matrix:**

| Feature | EMPLOYEE | DEPT_HEAD | HR_ADMIN | HR_HEAD | CEO | SYSTEM_ADMIN |
|---------|----------|-----------|----------|---------|-----|--------------|
| Apply Leave | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| View Own Leaves | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Leaves | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Forward (Approval) | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Holidays | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Employees | ❌ | ✅ Team | ✅ | ✅ | ✅ | ✅ |
| Edit Employees | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 5. DATABASE & DATA MODELS

### 5.1 Database Overview
- **Provider**: MySQL 8.0+
- **ORM**: Prisma 6.17.1
- **Location**: Defined in `/prisma/schema.prisma`

### 5.2 Core Data Models

#### **1. User Model**
```typescript
model User {
  id: Int
  name: String
  email: String @unique
  password: String? (hashed with bcryptjs)
  empCode: String? @unique
  role: Role @default(EMPLOYEE)
  department: String?
  deptHeadId: Int? // Self-relation for hierarchy
  joinDate: DateTime? // Service start date
  retirementDate: DateTime? // For study leave
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  // Relations
  leaves: LeaveRequest[]
  balances: Balance[]
  approvals: Approval[] @relation("ApprovalApprover")
  teamMembers: User[] @relation("HeadToMembers") // Managed employees
  encashmentRequests: EncashmentRequest[]
}
```

#### **2. LeaveRequest Model**
```typescript
model LeaveRequest {
  id: Int
  requesterId: Int // Who applied
  type: LeaveType (EARNED, CASUAL, MEDICAL, etc.)
  startDate: DateTime
  endDate: DateTime
  workingDays: Int
  reason: String
  needsCertificate: Boolean @default(false)
  certificateUrl: String? // Medical certificate
  fitnessCertificateUrl: String? // Fitness cert for ML
  status: LeaveStatus (DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, etc.)
  policyVersion: String (e.g., "v2.0")
  isModified: Boolean @default(false) // Returned & resubmitted
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  // Relations
  requester: User
  approvals: Approval[] // Multi-step approval chain
  comments: LeaveComment[]
  versions: LeaveVersion[] // Version history
}
```

#### **3. Approval Model**
```typescript
model Approval {
  id: Int
  leaveId: Int
  step: Int (1=HR_ADMIN, 2=DEPT_HEAD, 3=HR_HEAD, 4=CEO)
  approverId: Int
  decision: ApprovalDecision (APPROVED, REJECTED, FORWARDED, PENDING)
  toRole: String? (Role forwarded to)
  comment: String?
  decidedAt: DateTime?
  
  // Relations
  leave: LeaveRequest
  approver: User
}
```

#### **4. Balance Model**
```typescript
model Balance {
  id: Int
  userId: Int
  type: LeaveType
  year: Int
  opening: Int (Carry-forward balance)
  accrued: Int (Earned this year)
  used: Int @default(0)
  closing: Int (Calculated)
  
  // Constraints
  @@unique([userId, type, year]) // One balance per user/type/year
  
  // Relations
  user: User
}
```

#### **5. Holiday Model**
```typescript
model Holiday {
  id: Int
  date: DateTime @unique
  name: String
  isOptional: Boolean @default(false)
}
```

#### **6. Notification Model**
```typescript
model Notification {
  id: Int
  userId: Int (Recipient)
  type: NotificationType (LEAVE_SUBMITTED, LEAVE_APPROVED, etc.)
  title: String
  message: String
  link: String? (Related resource)
  leaveId: Int?
  read: Boolean @default(false)
  readAt: DateTime?
  createdAt: DateTime @default(now())
  expiresAt: DateTime?
}
```

#### **7. Additional Models**
- **LeaveComment**: Comments on leave requests
- **LeaveVersion**: Version history (for modified requests)
- **AuditLog**: Complete audit trail
- **PolicyConfig**: Leave type configuration
- **EncashmentRequest**: EL encashment (policy 6.19.f)
- **OrgSettings**: Organization-wide settings
- **OtpCode**: 2FA one-time passwords

### 5.3 Leave Types (11 types)
1. EARNED - 20 days/year, accrued 2 days/month
2. CASUAL - 10 days/year
3. MEDICAL - 14 days/year
4. EXTRAWITHPAY - Extra with pay
5. EXTRAWITHOUTPAY - Extra without pay
6. MATERNITY - Maternity leave
7. PATERNITY - Paternity leave
8. STUDY - Study leave
9. SPECIAL_DISABILITY - For disabled staff
10. QUARANTINE - For health quarantine
11. SPECIAL - For EL excess (>60 days)

### 5.4 Leave Statuses (8 statuses)
1. DRAFT - Not submitted
2. SUBMITTED - Submitted, awaiting approval
3. PENDING - In approval chain
4. APPROVED - Approved
5. REJECTED - Rejected
6. CANCELLED - Cancelled by user
7. RETURNED - Returned for modification
8. CANCELLATION_REQUESTED - Cancel request pending
9. RECALLED - Recalled by approver

---

## 6. FEATURES & FUNCTIONALITY

### 6.1 Core Features

#### **1. Leave Management (Module 2)**
- **Leave Application** - Multi-step form with validation
- **Leave History** - View all personal leave requests
- **Leave Details** - Complete leave information & timeline
- **Leave Cancellation** - Cancel pending requests
- **Draft Auto-save** - Automatic form save
- **Real-time Validation** - Immediate policy feedback

**Validation Rules Enforced:**
- Date range validation
- Weekend/holiday exclusion
- Advance notice requirements
- Balance availability
- Annual cap enforcement
- Consecutive day limits
- Medical certificate requirements
- Backdate approval rules

#### **2. Approval Workflow (Module 3)**
- **4-Step Sequential Chain**:
  1. HR_ADMIN → can forward to DEPT_HEAD
  2. DEPT_HEAD → can forward to HR_HEAD
  3. HR_HEAD → can approve/reject or forward to CEO
  4. CEO → final approval/rejection

- **Features**:
  - Approval comments
  - Forwarding with routing
  - Decision history
  - Timeline visualization
  - Approval queue management

#### **3. Leave Balance Management (Module 4)**
- **Real-time Balance Display**:
  - Opening balance (carry-forward)
  - Accrued balance
  - Used balance
  - Remaining balance
  - Year-specific tracking

- **Balance Calculations**:
  - Available = opening + accrued - used
  - Annual caps (CL: 10, ML: 14)
  - Carry-forward limits (EL: 60 days)
  - Closing balance projection

#### **4. Holiday Management (Module 5)**
- **Holiday Calendar** - View/print company holidays
- **Holiday Administration** - Add/edit/delete holidays
- **Impact on Leave Dates** - Holidays excluded from leave calculation
- **Optional Holidays** - Special holiday handling
- **CSV Import** - Bulk holiday upload

#### **5. Employee Management (Module 6)**
- **Employee Directory** - Searchable employee list
- **Employee Profiles** - Detailed employee information
- **Leave History per Employee** - Admin view of employee leaves
- **Employee Statistics** - Leave usage charts
- **Employee Administration** - Create/edit/assign roles
- **Department Management** - Organizational structure

#### **6. Dashboard & Analytics (Module 7)**

**Personal Dashboard** (`/dashboard`)
- Leave balance summary cards
- Recent leave requests
- Monthly usage trends
- Leave type distribution
- Policy reminders
- Pending approvals count
- Activity timeline

**Manager Dashboard** (`/manager/dashboard`)
- Team leave overview
- Team statistics
- Team member calendar
- Department analytics

**HR Admin Dashboard** (`/admin`)
- All pending requests
- Employee directory
- Approval queue
- Holiday management
- Audit logs

**Executive Dashboards** (`/ceo/dashboard`, `/hr-head/dashboard`)
- Organization-wide KPIs
- Strategic metrics
- System health
- Policy compliance

#### **7. Policy Enforcement (Module 8)**
- **Automatic Validation** - All policy rules enforced
- **Hard Blocks** - Prevents policy violations
- **Soft Warnings** - Advisory messages for risky actions
- **Compliance Checks** - `/api/compliance/validate`
- **Policy Audit** - `scripts/policy-audit.ts`
- **Version Tracking** - Policy version per request

#### **8. File Management (Module 10)**
- **Medical Certificate Upload** - PDF/JPG/PNG up to 5MB
- **Secure Storage** - Signed URLs via `/private/uploads/`
- **Secure Naming** - UUID-based filenames
- **File Validation** - Type & size checks
- **Fitness Certificates** - For ML >7 days on return

#### **9. Audit & Compliance (Module 9)**
- **Complete Audit Trail** - All actions logged
- **Action Tracking** - LEAVE_APPROVE, REJECT, FORWARD, CANCEL, etc.
- **User Activity Logging** - Who did what and when
- **Approval Chain History** - Full approval path
- **Compliance Reporting** - Audit export & analysis

#### **10. Notifications** (Module 11)
- **In-App Notifications** - Real-time update notifications
- **Notification Types**:
  - LEAVE_SUBMITTED
  - LEAVE_APPROVED / REJECTED
  - LEAVE_RETURNED / FORWARDED
  - LEAVE_CANCELLED
  - APPROVAL_REQUIRED
  - ENCASHMENT_APPROVED/REJECTED
  - SYSTEM_ANNOUNCEMENT

---

### 6.2 Advanced Features

#### **EL Encashment** (Policy 6.19.f)
- Request encashment for EL > 10 days
- CEO approval workflow
- Payment tracking
- Year-specific requests
- Balance audit trail

#### **Leave Modification**
- Return leave for modification (RETURNED status)
- Employee resubmits modified request
- Version history tracking
- Full change audit

#### **Background Jobs**
- **EL Accrual** (`scripts/jobs/el-accrual.ts`) - 2 days/month accrual
- **CL Auto-lapse** (`scripts/jobs/auto-lapse.ts`) - Year-end lapse
- **Scheduler** (`scripts/scheduler.ts`) - Job orchestration

#### **Reporting & Export**
- Leave reports with filters
- PDF/CSV export
- Custom date ranges
- Role-based data filtering
- Analytics dashboards

---

## 7. API ENDPOINTS

### 7.1 API Organization
- **Location**: `/app/api/`
- **Structure**: RESTful routes aligned with Next.js App Router
- **Format**: JSON request/response
- **Authentication**: JWT token in cookie or Authorization header

### 7.2 Core API Endpoints

#### **Authentication**
```
POST /api/auth/login          - User login
POST /api/auth/logout         - User logout
GET  /api/auth/me             - Current user info
GET  /api/auth/users          - List users (admin)
```

#### **Leave Management**
```
GET  /api/leaves              - List leaves (filtered)
POST /api/leaves              - Create leave request
GET  /api/leaves/[id]         - Get leave details
PATCH /api/leaves/[id]        - Cancel leave
DELETE /api/leaves/[id]       - Delete leave (draft only)

POST /api/leaves/[id]/approve - Approve leave
POST /api/leaves/[id]/reject  - Reject leave
POST /api/leaves/[id]/forward - Forward leave
POST /api/leaves/[id]/cancel  - Cancel leave
POST /api/leaves/[id]/recall  - Recall leave
POST /api/leaves/[id]/resubmit - Resubmit modified leave
POST /api/leaves/[id]/duty-return - Return from leave
POST /api/leaves/[id]/return-for-modification - Return for changes

GET  /api/leaves/[id]/versions      - Get leave versions
GET  /api/leaves/[id]/certificate  - Download certificate
POST /api/leaves/bulk/approve       - Bulk approve
POST /api/leaves/bulk/cancel        - Bulk cancel
GET  /api/leaves/export             - Export leaves
```

#### **Balance**
```
GET /api/balance/mine         - Get own balance
GET /api/balance/[userId]     - Get user balance (admin)
```

#### **Holiday Management**
```
GET  /api/holidays            - List holidays
POST /api/holidays            - Create holiday
GET  /api/holidays/[id]       - Get holiday
PATCH /api/holidays/[id]      - Update holiday
DELETE /api/holidays/[id]     - Delete holiday
```

#### **Dashboard & Analytics**
```
GET /api/dashboard/analytics        - Analytics data
GET /api/dashboard/analytics/summary - Analytics summary
GET /api/dashboard/alerts           - Dashboard alerts
GET /api/dashboard/insights         - Smart recommendations
GET /api/dashboard/leave-trend      - Trend analysis
GET /api/dashboard/leave-type-distribution - Type distribution
```

#### **Approvals**
```
GET  /api/approvals                - Pending approvals
POST /api/approvals/[id]/decision  - Make decision
GET  /api/manager/pending          - Manager pending
GET  /api/manager/team-overview    - Team overview
```

#### **Employee Management**
```
GET  /api/auth/users         - List users
POST /api/admin/users/create - Create user
GET  /api/admin/users        - Admin user list
GET  /api/admin/users/[id]   - Get user
PATCH /api/admin/users/[id]  - Update user
GET  /api/employees/[id]     - Get employee data
GET  /api/departments        - List departments
```

#### **Admin Functions**
```
GET  /api/admin/logs              - Audit logs
GET  /api/admin/system-stats      - System statistics
GET  /api/admin/policies          - Policy config
PATCH /api/admin/policies/[id]    - Update policy
```

#### **Compliance & Validation**
```
GET /api/compliance/validate - Validate policy compliance
```

#### **Notifications**
```
GET /api/notifications/latest - Latest notifications
```

#### **File Management**
```
GET /api/files/signed/[filename] - Download signed file
```

---

## 8. KEY TECHNOLOGIES & LIBRARIES

### 8.1 Frontend Stack
- **React 19.2.0** - UI library
- **Next.js 16.0.0** - Framework with App Router
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.x** - Styling
- **shadcn/ui** - Pre-built components

### 8.2 UI & Animation
- **Framer Motion 12.x** - Advanced animations
- **Recharts 3.3.0** - Data visualization
- **Lucide React 0.546.0** - Icon library (500+ icons)
- **Sonner 2.0.7** - Toast notifications
- **@radix-ui** - Accessible components (11 packages)
- **jsPDF 3.0.3** - PDF generation
- **jspdf-autotable 5.0.2** - PDF tables

### 8.3 Forms & Validation
- **React Hook Form 7.65.0** - Form state management
- **Zod 4.1.12** - Schema validation
- **Input-OTP 1.4.2** - OTP input component

### 8.4 Data Management
- **Prisma Client 6.17.1** - ORM
- **SWR 2.3.6** - Data fetching & caching
- **Zustand 5.0.8** - State management
- **date-fns 4.1.0** - Date utilities
- **date-fns-tz 3.2.0** - Timezone support

### 8.5 Server & Backend
- **Node.js** (runtime)
- **Next.js API Routes** (backend)
- **Prisma 6.17.1** - Database ORM
- **José 6.1.0** - JWT handling
- **bcryptjs 3.0.2** - Password hashing
- **Nodemailer 7.0.10** - Email sending
- **node-cron 4.2.1** - Job scheduling
- **ioredis 5.8.2** - Redis client (for caching)

### 8.6 Utilities
- **papaparse 5.5.3** - CSV parsing
- **react-to-print 3.2.0** - Print functionality
- **file-type 16.5.4** - File type detection
- **liquid-glass-react 1.1.1** - Glass effect
- **three 0.181.0** - 3D graphics (optional)

### 8.7 Testing
- **Vitest 4.0.6** - Unit & integration tests
- **@vitest/ui 4.0.6** - Test UI
- **Playwright 1.49.0** - E2E tests
- **@testing-library/react 14.2.1** - Component testing

---

## 9. SECURITY & BEST PRACTICES

### 9.1 Authentication Security
- **JWT with HS256** - HMAC-SHA256 signing
- **HTTP-only Cookies** - Prevents XSS access
- **Secure Secret** - Minimum 32 chars required in production
- **Token Expiry** - 8-hour validity period
- **Session Caching** - React cache() for performance

### 9.2 Authorization & Access Control
- **Role-Based Access** - 6 role hierarchy
- **Route Protection** - Middleware validation
- **Component-Level Checks** - `lib/rbac.ts` functions
- **API Validation** - Server-side permission checks
- **Self-Approval Prevention** - Cannot approve own requests

### 9.3 Data Security
- **Password Hashing** - bcryptjs with salt rounds
- **File Uploads** - Type & size validation, UUID naming
- **Database Indexes** - On foreign keys and search fields
- **Audit Logging** - Complete action trail
- **Secure File URLs** - Signed URLs for downloads

### 9.4 Validation
- **Client-Side** - React Hook Form + Zod schemas
- **Server-Side** - Zod validation on API routes
- **Policy Enforcement** - Hard blocks and warnings
- **Type Safety** - TypeScript strict mode

---

## 10. FILE STATISTICS

- **Total Files**: 763
- **Total Directories**: 207
- **Total Size**: 50.6 MB

### Breakdown:
- `.tsx` files: 221 (React components)
- `.ts` files: 142 (TypeScript utilities)
- `.js` files: 203 (Build artifacts)
- `.md` files: 79 (Documentation)
- `.json` files: 74 (Config files)
- `.css` files: 5 (Stylesheets)

---

## 11. PROJECT MATURITY & STATUS

### ✅ Implemented Features
- User authentication & authorization
- Leave application with full validation
- Multi-step approval workflow
- Real-time balance tracking
- Holiday management
- Employee directory & profiles
- Role-based dashboards
- Policy enforcement
- Audit logging
- File upload (medical certificates)
- Leave cancellation & modification

### ⚠️ Partially Implemented
- Balance updates on approval (logic ready)
- Balance restoration on cancellation
- Email notifications (prepared)
- Advanced reporting (basic included)

### ❌ Not Yet Implemented
- Automatic EL accrual (monthly job - scripts ready)
- Year transition automation
- Leave modification (cancel & recreate)
- Overstay detection
- Email/Teams notifications
- Advanced analytics

---

## 12. DEVELOPMENT SETUP

### Quick Start
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with database credentials

# Database setup
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma:seed

# Start development
pnpm dev
```

### Available Scripts
```bash
pnpm dev                  # Dev server with Turbopack
pnpm build               # Production build
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests
pnpm test:e2e           # E2E tests with Playwright
pnpm prisma:seed        # Seed database
pnpm policy:audit       # Policy compliance check
pnpm verify:demo        # Verify demo data
pnpm jobs:el-accrual    # Run EL accrual job
pnpm jobs:cl-lapse      # Run CL lapse job
```

---

## 13. DOCUMENTATION

Comprehensive documentation available in `/docs/`:
- **01-Project-Goals.md** - Project vision & objectives
- **02-Technical-Documentation.md** - Tech stack & architecture
- **03-Database-Schema.md** - Database documentation
- **04-User-Roles-and-Permissions.md** - Complete RBAC guide
- **05-System-Functionality.md** - Feature list by module
- **06-Flow-Charts.md** - Visual workflows
- **Policy Logic/** - 12 documents on policy implementation
- **API Contracts** - Complete API documentation

---

## CONCLUSION

The CDBL Leave Management System is a **modern, full-stack web application** with:
- **6 user roles** with fine-grained permission matrix
- **11 leave types** with complex policy enforcement
- **4-step approval workflow** with audit trail
- **Real-time analytics** and dashboards
- **Robust validation** at client and server levels
- **Comprehensive documentation** (79+ pages)
- **Production-ready** architecture

The codebase is well-organized, follows Next.js best practices, and includes extensive documentation for policy rules, API contracts, and user permissions.

