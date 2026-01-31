****# CDBL Leave Management System - Architecture Documentation

## Table of Contents

1. [High-Level Architecture Overview](#high-level-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [Service Layer](#service-layer)
7. [Middleware and Authentication](#middleware-and-authentication)
8. [State Management](#state-management)
9. [UI Component Hierarchy](#ui-component-hierarchy)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Key Business Logic](#key-business-logic)
12. [File Modification Guide](#file-modification-guide)
13. [Cross-References](#cross-references)
14. [Environment Configuration](#environment-configuration)
15. [Deployment and Build Process](#deployment-and-build-process)

## High-Level Architecture Overview

The CDBL Leave Management System is a Next.js 16 application built with React 19, featuring a modern, component-based architecture with clear separation of concerns. The system follows a client-server architecture with:

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Next.js API routes with Prisma ORM connecting to MariaDB
- **Authentication**: JWT-based with cookie storage
- **State Management**: SWR for data fetching, React Context for global state
- **UI Framework**: Custom component library built on Radix UI primitives

## Technology Stack

### Frontend Technologies

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **State Management**: SWR for server state, React Context for client state
- **Animations**: Framer Motion

### Backend Technologies

- **Runtime**: Node.js
- **Database**: MariaDB with Prisma ORM
- **API Framework**: Next.js API routes
- **Authentication**: JWT with jose library
- **Validation**: Zod for request validation
- **Cron Jobs**: node-cron for automated processes
- **File Storage**: Signed URLs for document uploads

### Development Tools

- **Package Manager**: pnpm
- **Testing**: Vitest for unit/integration, Playwright for E2E
- **Linting**: ESLint with flat config
- **Type Checking**: TypeScript

## Frontend Architecture

### Component Structure

```
components/
├── accessibility/          # WCAG compliance components
├── admin/                 # Admin-specific UI components
├── analytics/             # Analytics and reporting components
├── calendar/              # Calendar and date components
├── cards/                 # Reusable card components
├── corporate/             # Corporate branding components
├── dashboards/            # Role-specific dashboard components
├── employee/              # Employee-specific components
├── errors/                # Error handling components
├── faq/                   # FAQ components
├── filters/               # Filtering and search components
├── holidays/              # Holiday calendar components
├── hr-admin/              # HR admin components
├── images/                # Image optimization components
├── kokonutui/             # Custom UI components
├── layout/                # Layout components
├── leaves/                # Leave management components
├── loading/               # Loading and skeleton components
├── modals/                # Modal and dialog components
├── navbar/                # Navigation components
├── notifications/         # Notification components
├── policies/              # Policy display components
├── providers/             # React context providers
├── reports/               # Reporting components
├── roles/                 # Role-specific components
├── tables/                # Table components
├── ui/                    # shadcn/ui components
└── unified/               # Unified components
```

### Key UI Components

#### Dashboard Components

- **Location**: `components/dashboards/`
- **Purpose**: Role-specific dashboard interfaces
- **Subdirectories**: employee, dept-head, hr-admin, hr-head, ceo, admin
- **Key Files**:
  - `Overview.tsx` - Main dashboard content
  - `sections/` - Dashboard sections (Greeting, ActionCenter, LeaveOverview, History)
  - `hooks/` - Dashboard-specific hooks

#### Leave Management Components

- **Location**: `components/leaves/`
- **Purpose**: All leave-related UI components
- **Key Files**:
  - `LeaveActionsMenu.tsx` - Dropdown menu for leave actions
  - `LeaveActionModals.tsx` - Modals for extension, shortening, cancellation
  - `LeaveBalanceView.tsx` - Balance display component
  - `LeaveCalendar.tsx` - Calendar visualization

#### Calendar Components

- **Location**: `components/calendar/`
- **Purpose**: Calendar-based leave visualization
- **Key Files**:
  - `CalendarGrid.tsx` - Calendar grid display
  - `CalendarHeader.tsx` - Calendar header controls
  - `DayClickModal.tsx` - Modal for day clicks
  - `TeamCalendarView.tsx` - Team calendar view

### Layout Components

- **Location**: `components/layout/`
- **Purpose**: Page layout and structure
- **Key Files**:
  - `LayoutWrapper.tsx` - Main layout wrapper
  - `PageShell.tsx` - Page-level shell
  - `ModalShell.tsx` - Modal container
  - `DashboardGrid.tsx` - Dashboard grid layout

## Backend Architecture

### API Routes Structure

```
app/api/
├── admin/                 # Administrative API endpoints
├── analytics/             # Analytics and reporting APIs
├── approvals/             # Leave approval APIs
├── auth/                  # Authentication APIs
├── balance/               # Leave balance APIs
├── calendar/              # Calendar APIs
├── compliance/            # Compliance validation APIs
├── conversions/           # Leave conversion APIs
├── cron/                  # Automated job APIs
├── dashboard/             # Dashboard data APIs
├── departments/           # Department APIs
├── employees/             # Employee APIs
├── encashment/            # Encashment APIs
├── files/                 # File upload/download APIs
├── holidays/              # Holiday APIs
├── leaves/                # Leave request APIs
├── login/                 # Login API
├── logout/                # Logout API
├── manager/               # Manager APIs
├── me/                    # Current user APIs
├── notifications/         # Notification APIs
├── policy/                # Policy APIs
├── reports/               # Report generation APIs
├── search/                # Search APIs
└── team/                  # Team APIs
```

### Key API Routes

#### Leave Management APIs

- **Location**: `app/api/leaves/`
- **Purpose**: All leave request operations
- **Key Endpoints**:
  - `GET /api/leaves` - Get leave requests (with filters)
  - `POST /api/leaves` - Create new leave request
- `GET /api/leaves/[id]` - Get specific leave request
- `PUT /api/leaves/[id]` - Update leave request
- `DELETE /api/leaves/[id]` - Delete leave request
- `POST /api/leaves/[id]/approve` - Approve leave
- `POST /api/leaves/[id]/reject` - Reject leave
- `POST /api/leaves/[id]/cancel` - Cancel leave
- `POST /api/leaves/[id]/extend` - Extend leave
- `POST /api/leaves/[id]/shorten` - Shorten leave
- `POST /api/leaves/[id]/partial-cancel` - Partial cancel

#### Approval APIs

- **Location**: `app/api/approvals/`
- **Purpose**: Leave approval workflow
- **Key Endpoints**:
  - `GET /api/approvals` - Get approvals for current user
  - `POST /api/approvals/resolve-leave` - Resolve leave decision
  - `POST /api/approvals/[id]/decision` - Make approval decision
  - `GET /api/approvals/history` - Get approval history

#### Dashboard APIs

- **Location**: `app/api/dashboard/`
- **Purpose**: Dashboard data aggregation
- **Key Endpoints**:
  - `GET /api/dashboard/analytics` - Get dashboard analytics
  - `GET /api/dashboard/hr-admin/stats` - HR admin stats
  - `GET /api/dashboard/hr-head/stats` - HR head stats
  - `GET /api/dashboard/ceo/stats` - CEO stats
- `GET /api/dashboard/alerts` - Get dashboard alerts

### Authentication APIs

- **Location**: `app/api/auth/`
- **Purpose**: User authentication
- **Key Endpoints**:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP

## Database Schema

### Prisma Schema

- **Location**: `prisma/schema.prisma`
- **Purpose**: Database schema definition
- **Models**:

#### User Model

```prisma
model User {
  id                  Int                 @id @default(autoincrement())
  empCode             String?             @unique
  name                String
  email               String              @unique
  role                Role                @default(EMPLOYEE)
  department          String?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  joinDate            DateTime?
  retirementDate      DateTime?
  password            String?
  deptHeadId          Int?
  approvals           Approval[]          @relation("ApprovalApprover")
  balances            Balance[]
  encashmentApprovals EncashmentRequest[] @relation("EncashmentApprover")
  encashmentRequests  EncashmentRequest[]
  leaves              LeaveRequest[]
  deptHead            User?               @relation("HeadToMembers", fields: [deptHeadId], references: [id])
  teamMembers         User[]              @relation("HeadToMembers")
}
```

#### LeaveRequest Model

```prisma
model LeaveRequest {
  id                    Int            @id @default(autoincrement())
  requesterId           Int
 type                  LeaveType
  startDate             DateTime
  endDate               DateTime
  workingDays           Int
 reason                String
 needsCertificate      Boolean        @default(false)
  certificateUrl        String?
  status                LeaveStatus    @default(DRAFT)
  policyVersion         String
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  fitnessCertificateUrl String?
  isModified            Boolean        @default(false)
 incidentDate          DateTime?
  isExtension           Boolean        @default(false)
  parentLeaveId         Int?
  payCalculation        Json?
  studyLeaveDocuments   Json?
  cancellationReason    String?
  isCancellationRequest Boolean        @default(false)
 isPartialCancellation Boolean        @default(false)
  originalEndDate       DateTime?
  approvals             Approval[]
  comments              LeaveComment[]
  parentLeave           LeaveRequest?  @relation("LeaveExtension", fields: [parentLeaveId], references: [id])
  extensions            LeaveRequest[] @relation("LeaveExtension")
  requester             User           @relation(fields: [requesterId], references: [id])
  versions              LeaveVersion[]
}
```

#### Approval Model

```prisma
model Approval {
  id         Int              @id @default(autoincrement())
  leaveId    Int
  step       Int
  approverId Int
  decision   ApprovalDecision @default(PENDING)
  comment    String?
  decidedAt  DateTime?
  toRole     String?
  approver   User             @relation("ApprovalApprover", fields: [approverId], references: [id])
  leave      LeaveRequest     @relation(fields: [leaveId], references: [id])
}
```

#### Balance Model

```prisma
model Balance {
  id      Int       @id @default(autoincrement())
  userId  Int
  type    LeaveType
  year    Int
  opening Int
  accrued Int
  used    Int       @default(0)
  closing Int
  user    User      @relation(fields: [userId], references: [id])
}
```

#### Holiday Model

```prisma
model Holiday {
  id         Int      @id @default(autoincrement())
  date       DateTime @unique
  name       String
  isOptional Boolean  @default(false)
}
```

### Enums

- **Role**: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
- **LeaveType**: EARNED, CASUAL, MEDICAL, EXTRAWITHPAY, EXTRAWITHOUTPAY, MATERNITY, PATERNITY, STUDY, SPECIAL_DISABILITY, QUARANTINE, SPECIAL
- **LeaveStatus**: DRAFT, SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED, RETURNED, CANCELLATION_REQUESTED, RECALLED
- **ApprovalDecision**: APPROVED, REJECTED, FORWARDED, PENDING, RETURNED
- **EncashmentStatus**: PENDING, APPROVED, REJECTED, PAID

## Service Layer

### Service Structure

```
lib/services/
├── approval.service.ts      # Approval workflow management
├── leave.service.ts         # Leave request business logic
├── leave-validator.ts       # Leave validation logic
├── notification.service.ts  # Notification management
├── encashment.service.ts    # Encashment request processing
└── other service files...
```

### Key Services

#### LeaveService

- **Location**: `lib/services/leave.service.ts`
- **Purpose**: Orchestrates business logic for leave management
- **Key Methods**:
  - `createLeaveRequest()` - Creates new leave requests
  - `approveLeave()` - Approves leave requests
- `rejectLeave()` - Rejects leave requests
- `forwardLeave()` - Forwards leave to next approver
- `returnLeave()` - Returns leave for modification
- `cancelLeave()` - Cancels leave requests
- `getTeamLeaveRequests()` - Gets team leave requests for dept heads

#### ApprovalService

- **Location**: `lib/services/approval.service.ts`
- **Purpose**: Handles approval workflow business logic
- **Key Methods**:
  - `getPendingForApprover()` - Gets pending approvals
  - `approve()` - Approves leave request
- `reject()` - Rejects leave request
- `forward()` - Forwards to next approver
- `returnForModification()` - Returns for modification
- `bulkApprove()` - Bulk approval operations

#### NotificationService

- **Location**: `lib/services/notification.service.ts`
- **Purpose**: Manages system notifications
- **Key Methods**:
  - `notifyLeaveSubmitted()` - Notifies on leave submission
  - `notifyLeaveApproved()` - Notifies on approval
  - `notifyLeaveRejected()` - Notifies on rejection
- `notifyLeaveForwarded()` - Notifies on forwarding
- `notifyLeaveReturned()` - Notifies on return

## Middleware and Authentication

### Authentication System

- **Location**: `lib/auth.ts`
- **Purpose**: JWT-based authentication with cookie storage
- **Key Functions**:
  - `signJwt()` - Creates JWT tokens
  - `verifyJwt()` - Verifies JWT tokens
  - `getCurrentUser()` - Gets current authenticated user
- `getJwtCookieName()` - Gets JWT cookie name

### Authorization Middleware

- **Location**: `lib/middleware/authorize-leave-action.ts`
- **Purpose**: Authorization checks for leave actions
- **Key Functions**:
  - `authorizeLeaveAction()` - Authorizes leave actions
- `authorizeViewLeave()` - Authorizes leave viewing
- `authorizeViewBalance()` - Authorizes balance viewing

### RBAC System

- **Location**: `lib/rbac.ts`
- **Purpose**: Role-based access control
- **Key Functions**:
  - `canViewAllRequests()` - Checks view permissions
  - `canApprove()` - Checks approval permissions
  - `canViewEmployee()` - Checks employee view permissions
  - `canEditEmployee()` - Checks employee edit permissions
  - `canAssignRole()` - Checks role assignment permissions

## State Management

### Client-Side State

- **Primary Tool**: SWR for server state management
- **Secondary Tool**: React Context for global client state
- **Form State**: React Hook Form for form state

### Custom Hooks

- **Location**: `hooks/`
- **Key Hooks**:
- `useLeaveRequests.ts` - Manages leave request data
- `useDashboardLayout.ts` - Manages dashboard layout
- `useRetry.ts` - Handles retry logic
- `useErrorRecovery.ts` - Handles error recovery
- `useOptimizedAPI.ts` - Optimizes API calls

### Context Providers

- **Location**: `components/providers/`
- **Key Providers**:
- `UserProvider` - User authentication context
- `LeaveDataProvider` - Leave data context
- `AnnotationModeProvider` - Annotation mode context

## UI Component Hierarchy

### Dashboard Hierarchy

```
DashboardPage
├── DashboardContent
    ├── DashboardHeader
    ├── ActionCenterCard
    ├── LeaveOverviewCard
    └── HistoryAnalyticsCard
        └── RequestsTable
```

### Leave Request Hierarchy

```
LeaveRequestForm
├── FormShell
├── Form Fields
├── LeaveCalendar
├── LeaveActionsMenu
└── Submit Button
```

### Approval Hierarchy

```
ApprovalPage
├── ApprovalGate
├── ApprovalDetailsContent
├── ApprovalActionCard
├── EmployeeStatsCard
├── PolicyComplianceCheck
└── TeamImpactCard
```

## Data Flow Diagrams

### Leave Creation Flow

```
UI Component (Leave Form)
    ↓
API Route (POST /api/leaves)
    ↓
Validation (Zod schema)
    ↓
Authentication Check (JWT)
    ↓
Business Logic (LeaveService.createLeaveRequest)
    ↓
Validation (LeaveValidator.validateLeaveRequest)
    ↓
Database Operation (LeaveRepository.create)
    ↓
Approval Creation (Prisma)
    ↓
Notification (NotificationService)
    ↓
Response to UI
```

### Leave Approval Flow

```
UI Component (Approval Button)
    ↓
API Route (POST /api/approvals/[id]/decision)
    ↓
Authentication Check (JWT)
    ↓
Authorization Check (authorizeLeaveAction)
    ↓
Business Logic (ApprovalService.approve)
    ↓
Database Update (Prisma)
    ↓
Balance Update (if final approval)
    ↓
Notification (NotificationService)
    ↓
Response to UI
```

### Dashboard Data Flow

```
Dashboard Component
    ↓
useLeaveRequests Hook
    ↓
SWR Fetch (/api/leaves?mine=1)
    ↓
API Route (GET /api/leaves)
    ↓
Authentication Check (JWT)
    ↓
Database Query (LeaveRepository.findByUserId)
    ↓
Response to SWR
    ↓
UI Update
```

## Key Business Logic

### Leave Validation Logic

- **Location**: `lib/leave-validation.ts`
- **Purpose**: Validates leave requests based on policies
- **Key Functions**:
  - `validateLeaveRequest()` - Main validation function
  - `validateFileUpload()` - Validates file uploads
  - `validateLeaveDates()` - Validates leave date ranges
- `validateBalance()` - Validates leave balance availability

### Workflow Engine

- **Location**: `lib/workflow.ts`
- **Purpose**: Manages approval workflows
- **Key Functions**:
  - `getChainFor()` - Gets approval chain for leave type
  - `getNextRoleInChain()` - Gets next approver in chain
  - `getStepForRole()` - Gets step number for role
  - `isFinalApprover()` - Checks if role is final approver
  - `canPerformAction()` - Checks if role can perform action

### Balance Management

- **Location**: `lib/balance-manager.ts`
- **Purpose**: Manages leave balances
- **Key Functions**:
  - `calculateBalance()` - Calculates leave balances
  - `updateBalance()` - Updates leave balances
  - `checkAvailability()` - Checks if leave is available

### Date Calculation

- **Location**: `lib/working-days.ts`
- **Purpose**: Calculates working days excluding holidays
- **Key Functions**:
  - `countWorkingDays()` - Counts working days in range
  - `getWorkingDays()` - Gets working days between dates
  - `isWorkingDay()` - Checks if date is a working day

## File Modification Guide

### UI Updates

#### Adding New Dashboard Components

- **Files to Modify**:
  - `components/dashboards/[role]/Overview.tsx` - Add new section
  - `components/dashboards/[role]/sections/[NewSection].tsx` - Create new section
  - `components/dashboards/[role]/hooks/[newHook].ts` - Create new hook if needed
- **Dependencies**:
- Import new components in the overview file
- Update the component structure in the return statement

#### Updating Leave Forms

- **Files to Modify**:
- `components/leaves/LeaveActionsMenu.tsx` - Add new actions
- `components/leaves/LeaveActionModals.tsx` - Add new modals
- `app/api/leaves/[id]/[action]/route.ts` - Add new API endpoints
- **Dependencies**:
  - Update Zod schemas to include new fields
- Add new service methods if needed

#### Modifying Navigation

- **Files to Modify**:
- `lib/navigation.ts` - Update navigation configuration
- `components/navbar/Navbar.tsx` - Update navbar rendering
- **Dependencies**:
  - Ensure new routes exist in the app directory

### Business Logic Changes

#### Adding New Leave Types

- **Files to Modify**:
  - `prisma/schema.prisma` - Add new enum value to LeaveType
  - `lib/workflow.ts` - Update workflow chains if needed
- `lib/policy.ts` - Add policy rules for new leave type
- `lib/leave-validation.ts` - Add validation rules
- **Dependencies**:
  - Run `npx prisma db push` to update database
  - Update UI components to handle new leave type

#### Modifying Approval Workflow

- **Files to Modify**:
  - `lib/workflow.ts` - Update approval chains
  - `lib/services/approval.service.ts` - Update service logic
  - `lib/middleware/authorize-leave-action.ts` - Update authorization
- **Dependencies**:
  - Test all approval paths thoroughly
  - Update related UI components that display workflow status

#### Changing Business Rules

- **Files to Modify**:
- `lib/policy.ts` - Update policy definitions
- `lib/leave-validation.ts` - Update validation rules
- `lib/services/leave.service.ts` - Update business logic
- **Dependencies**:
- Update related UI to reflect new rules
- Update API responses to match new behavior

### API Modifications

#### Adding New API Endpoints

- **Files to Create/Modify**:
  - `app/api/[resource]/route.ts` - Create new endpoint file
  - `app/api/[resource]/[id]/route.ts` - For resource-specific endpoints
- `lib/services/[resource].service.ts` - Add service methods
- `lib/repositories/[resource].repository.ts` - Add repository methods
- **Dependencies**:
  - Add authentication/authorization checks
  - Include proper error handling
  - Add Zod validation schemas

#### Modifying Existing Endpoints

- **Files to Modify**:
- `app/api/[resource]/route.ts` - Update endpoint logic
- `lib/services/[resource].service.ts` - Update service methods
- `lib/repositories/[resource].repository.ts` - Update repository methods
- **Dependencies**:
- Update related UI components that call the endpoint
- Update Zod schemas if request/response changes
- Update API documentation

### Database Schema Changes

#### Adding New Tables

- **Files to Modify**:
  - `prisma/schema.prisma` - Define new model
  - `lib/repositories/[newModel].repository.ts` - Create repository
- `lib/services/[newModel].service.ts` - Create service
- `app/api/[newResource]/route.ts` - Create API endpoints
- **Dependencies**:
  - Run `npx prisma db push` to apply changes
- Create seed data if needed
- Update related components to use new data

#### Modifying Existing Tables

- **Files to Modify**:
- `prisma/schema.prisma` - Update model definition
- `lib/repositories/[model].repository.ts` - Update repository methods
- `lib/services/[model].service.ts` - Update service methods
- `app/api/[resource]/route.ts` - Update API endpoints
- **Dependencies**:
  - Create migration with `npx prisma migrate dev`
  - Update all components that use the modified data
  - Consider backward compatibility

## Cross-References

### UI to API Relationships

- **Dashboard UI** ↔ **Dashboard APIs** (`/api/dashboard/*`)
- **Leave Form UI** ↔ **Leave APIs** (`/api/leaves/*`)
- **Approval UI** ↔ **Approval APIs** (`/api/approvals/*`)
- **Employee Management UI** ↔ **Employee APIs** (`/api/employees/*`)

### Service Dependencies

- **LeaveService** → **ApprovalService** (for approval creation)
- **LeaveService** → **NotificationService** (for notifications)
- **LeaveService** → **LeaveValidator** (for validation)
- **ApprovalService** → **NotificationService** (for notifications)

### Component Dependencies

- **LeaveDataProvider** → **useApiQuery** (for data fetching)
- **UserProvider** → **getCurrentUser** (for user data)
- **LayoutProvider** → **getCurrentUser** (for user context)

### File Relationships

- **API routes** ←→ **Service files** (API calls service methods)
- **Service files** ←→ **Repository files** (Service uses repositories)
- **UI components** ←→ **API routes** (Components make API calls)
- **UI components** ←→ **Service files** (Direct service calls in some cases)

## Environment Configuration

### Environment Files

- **`.env.example`** - Example environment variables
- **`.env`** - Local environment variables (not committed)
- **`.env.local`** - Local development environment (not committed)

### Key Environment Variables

- **`DATABASE_URL`** - Database connection string
- **`JWT_SECRET`** - JWT signing secret (minimum 32 characters)
- **`REDIS_URL`** - Redis connection for caching (optional)
- **`SMTP_*`** - Email configuration variables
- **`ALLOWED_ORIGINS`** - CORS allowed origins

### Configuration Files

- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`eslint.config.mjs`** - ESLint configuration
- **`prisma.config.ts`** - Prisma configuration

## Deployment and Build Process

### Build Process

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Build application
pnpm build

# Start production server
pnpm start
```

### Development Process

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Alternative with Turbopack
pnpm dev:turbo
```

### Testing Process

```bash
# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test
```

### Database Operations

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# Create migration
pnpm prisma migrate dev

# Seed database
pnpm prisma:seed
```

### Deployment Configuration

- **Platform**: Vercel (recommended) or any Node.js hosting
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Environment Variables**: Set in deployment platform
- **Node Version**: 18+ (as specified in package.json)

### Docker Configuration

- **Dockerfile** - Available in root directory
- **docker-compose.yml** - For local development with services
- **Services**: MariaDB, Redis (optional)

### CI/CD Considerations

- **Prisma**: Ensure client generation in build process
- **Environment**: Proper environment variable handling
- **Database**: Migration strategy for deployments
- **Testing**: All tests should pass before deployment

## Practical Examples

### Example 1: Adding a New Leave Type

1. **Update Database Schema** (`prisma/schema.prisma`):

```prisma
enum LeaveType {
  EARNED
  CASUAL
  MEDICAL
  // ... existing types
  NEW_LEAVE_TYPE  // Add new type here
}
```

2. **Update Workflow** (`lib/workflow.ts`):

```typescript
export const WORKFLOW_CHAINS: Record<LeaveType | "DEFAULT", AppRole[]> = {
  // ... existing chains
  NEW_LEAVE_TYPE: ["HR_ADMIN", "HR_HEAD", "DEPT_HEAD"], // Define workflow
};
```

3. **Update Validation** (`lib/leave-validation.ts`):

```typescript
// Add validation rules for new leave type
if (type === "NEW_LEAVE_TYPE") {
  // Add specific validation logic
}
```

4. **Update UI** (`components/leaves/LeaveForm.tsx`):

```typescript
// Add new leave type to form options
const leaveTypeOptions = [
  // ... existing options
  { value: "NEW_LEAVE_TYPE", label: "New Leave Type" },
];
```

### Example 2: Adding a New Dashboard Widget

1. **Create Widget Component** (`components/dashboards/shared/NewWidget.tsx`):

```tsx
export function NewWidget() {
  // Widget implementation
}
```

2. **Update Dashboard** (`components/dashboards/employee/Overview.tsx`):

```tsx
import { NewWidget } from "./widgets/NewWidget";

export function EmployeeDashboardContent() {
  return (
    <div className="space-y-6">
      {/* ... existing widgets */}
      <NewWidget />
    </div>
  );
}
```

3. **Create API Endpoint** (`app/api/dashboard/new-data/route.ts`):

```ts
export async function GET() {
  // API implementation
}
```

4. **Update Service** (`lib/services/dashboard.service.ts`):

```ts
export async function getNewDashboardData() {
  // Service implementation
}
```

This architecture documentation provides a comprehensive reference for understanding and modifying the CDBL Leave Management System. Each component, service, and file is documented with its purpose, location, and relationships to other parts of the system, making it easier to implement changes and understand the overall architecture.
