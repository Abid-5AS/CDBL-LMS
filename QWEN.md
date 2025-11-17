# CDBL Leave Management System - Project Context

## Project Overview

The CDBL Leave Management System is a comprehensive web-based leave management solution for Central Depository Bangladesh Limited (CDBL), built with Next.js 16, React 19, and Prisma ORM. The system digitizes and automates the leave management process, replacing manual workflows with a modern, policy-compliant digital solution that enforces CDBL HR Leave Policy (v1.1) automatically.

### Key Features
- **Leave Application**: Digital leave requests with real-time validation
- **Multi-Level Approval**: 4-step approval workflow (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO)
- **Policy Enforcement**: Automatic enforcement of CDBL leave policy rules
- **Balance Management**: Real-time leave balance tracking and accrual
- **Holiday Management**: Company holiday calendar with impact on leave dates
- **Role-Based Dashboards**: Customized dashboards for each user role
- **Audit Trail**: Complete audit logging for compliance
- **Employee Management**: Comprehensive employee directory and profile management

### Core Architecture
- **Frontend Framework**: Next.js 16.0.0 (App Router)
- **Frontend Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.x with shadcn/ui components
- **Database**: MySQL with Prisma 6.17.1 ORM
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod 4.x, React Hook Form 7.x
- **Type Safety**: TypeScript 5.9.3

## Project Structure

```
cdbl-leave-management/
├── app/                        # Next.js App Router
│   ├── (authenticated)/        # Authenticated route group
│   ├── actions/                # Server actions
│   ├── admin/                  # Admin-specific routes
│   ├── api/                    # API routes
│   ├── approvals/              # Approval workflow pages
│   ├── balance/                # Leave balance pages
│   ├── ceo/                    # CEO-specific routes
│   ├── dashboard/              # Dashboard pages (role-based)
│   ├── employees/              # Employee management
│   ├── encashment/             # EL encashment features
│   ├── guidelines/             # Guidelines pages
│   ├── holidays/               # Holiday calendar
│   ├── hr-head/                # HR Head routes
│   ├── leaves/                 # Leave management
│   ├── login/                  # Login page
│   ├── manager/                # Manager routes
│   └── reports/                # Reports pages
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── leaves/                 # Leave-specific components
│   ├── dashboard/              # Dashboard components
│   └── shared/                 # Shared components
├── lib/                        # Business logic & utilities
│   ├── auth.ts                 # Authentication logic
│   ├── policy.ts               # Policy enforcement logic
│   ├── rbac.ts                 # Role-based access control
│   ├── prisma.ts               # Prisma client
│   ├── date-utils.ts           # Date utilities
│   └── navigation.ts           # Navigation configuration
├── prisma/                     # Database schema & migrations
│   └── schema.prisma           # Prisma schema
├── public/                     # Static assets
├── styles/                     # Global styles
└── docs/                       # Documentation
```

## Database Schema

The application uses a MySQL database with the following key entities:

- **User**: Employee information, roles, department assignments
- **LeaveRequest**: Leave applications with status tracking
- **Approval**: Multi-step approval workflow tracking
- **Balance**: Leave balance calculations by type and year
- **Holiday**: Company holiday calendar
- **PolicyConfig**: Policy rules and limits
- **AuditLog**: Complete audit trail
- **EncashmentRequest**: EL encashment requests
- **Notification**: Real-time notification system
- **OtpCode**: 2FA OTP codes

## User Roles & Permissions

The system supports 6 user roles with different capabilities:

1. **EMPLOYEE** - Apply for leave, view own data
2. **DEPT_HEAD** - Team oversight, forward requests
3. **HR_ADMIN** - Leave management, user administration
4. **HR_HEAD** - Final approval authority, policy compliance
5. **CEO** - Executive oversight, full system access
6. **SYSTEM_ADMIN** - Administrative functions

## Leave Types

- **Earned Leave (EL)**: 20 days/year, 2 days/month accrual, 60-day carry-forward
- **Casual Leave (CL)**: 10 days/year, max 3 consecutive days
- **Medical Leave (ML)**: 14 days/year, certificate required for >3 days
- **Extra with Pay/Without Pay**
- **Maternity/Paternity**
- **Study Leave**
- **Special Disability Leave**
- **Quarantine Leave**
- **Special Leave** (EL excess >60 days)

## Building and Running

### Prerequisites
- Node.js 18.x or higher
- pnpm package manager
- MySQL 8.0+
- Git

### Setup
1. Clone the repository
2. Install dependencies with `pnpm install`
3. Set up environment variables in `.env` file
4. Run database migrations with `pnpm prisma migrate dev`
5. Seed database with `pnpm prisma:seed` (optional)

### Running the Application
- Development: `pnpm dev` (or `pnpm dev:turbo` for Turbopack)
- Production build: `pnpm build`
- Production start: `pnpm start`

### Key Scripts
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm lint`: Run ESLint
- `pnpm test:e2e`: Run Playwright E2E tests
- `pnpm policy:audit`: Run policy compliance audit
- `pnpm prisma:seed`: Seed database with demo data
- `pnpm jobs:el-accrual`: Run EL accrual job
- `pnpm jobs:cl-lapse`: Run CL lapse job

## Development Conventions

### Technology Stack
- TypeScript with strict mode enabled
- Next.js App Router with server components and actions
- Prisma ORM for database operations
- Shadcn/ui for accessible UI components
- Tailwind CSS for styling
- Zod for validation schemas
- React Hook Form for form management

### Key Libraries
- **@prisma/client**: Database ORM
- **@radix-ui/react-* components**: Accessible UI primitives
- **lucide-react**: Icon library
- **date-fns**: Date manipulation
- **recharts**: Charting library
- **zustand**: State management
- **framer-motion**: Animations

### File Organization
- Components are organized by feature and shared functionality
- Server actions in `app/actions/` for data mutations
- Business logic in `lib/` directory
- UI components in `components/ui/` following shadcn patterns
- Role-specific dashboards in `app/dashboard/` directories

### Policy Enforcement
- All CDBL leave policies are enforced automatically in the system
- Business rules are implemented in `lib/policy.ts`
- Validation occurs at both UI and API levels
- Approval workflows follow the 4-step process: HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO

## Testing Strategy

The application includes multiple testing layers:
- Unit tests with Vitest
- Integration tests with Vitest
- E2E tests with Playwright
- Policy compliance verification scripts

## Documentation Structure

The documentation is organized into logical categories:
- `docs/core/` - Core project documentation
- `docs/policies/` - Policy documentation
- `docs/api/` - API documentation
- `docs/ui-ux/` - UI/UX and design guidelines
- `docs/development/` - Development practices
- `docs/testing/` - Testing documentation
- `docs/deployment/` - Deployment guides
- `docs/legacy/` - Historical documentation

## Important Files & Directories

- `README.md`: Main project overview
- `package.json`: Dependencies and scripts
- `prisma/schema.prisma`: Database schema
- `lib/policy.ts`: Policy enforcement logic
- `lib/auth-jwt.ts`: Authentication system
- `lib/navigation.ts`: Role-based navigation
- `lib/rbac.ts`: Role-based access control
- `components/ui/`: Reusable UI components
- `app/dashboard/`: Role-based dashboard implementations