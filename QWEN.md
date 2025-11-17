# CDBL Leave Management System - Project Overview

## Project Summary

The CDBL Leave Management System is a comprehensive web-based leave management solution for Central Depository Bangladesh Limited (CDBL), built with Next.js 16, React 19, and Prisma ORM. It digitizes and automates the leave management process, replacing manual workflows with a modern, policy-compliant digital solution.

### Key Features
- **Leave Application**: Digital leave requests with real-time validation
- **Multi-Level Approval**: 4-step approval workflow (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO)
- **Policy Enforcement**: Automatic enforcement of CDBL leave policy rules
- **Balance Management**: Real-time leave balance tracking and accrual
- **Holiday Management**: Company holiday calendar with impact on leave dates
- **Role-Based Dashboards**: Customized dashboards for each user role
- **Audit Trail**: Complete audit logging for compliance
- **Employee Management**: Comprehensive employee directory and profile management

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **Frontend**: React 19.2.0, TypeScript 5.9.3
- **UI**: shadcn/ui, Tailwind CSS 4.x
- **Database**: MySQL with Prisma 6.17.1
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod 4.x, React Hook Form 7.x

## Project Structure

```
cdbl-leave-management/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── leaves/           # Leave management
│   ├── admin/            # Admin functions
│   └── employees/         # Employee management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Business logic & utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Authentication
│   ├── policy.ts         # Policy rules
│   └── rbac.ts           # Role-based access
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema
└── docs/                  # Documentation
```

## User Roles

The system supports 6 user roles:

1. **EMPLOYEE** - Apply for leave, view own data
2. **DEPT_HEAD** - Team oversight, forward requests
3. **HR_ADMIN** - Leave management, user administration
4. **HR_HEAD** - Final approval authority, policy compliance
5. **CEO** - Executive oversight, full system access
6. **SYSTEM_ADMIN** - Administrative functions

## Leave Types

- **Earned Leave (EL)**: 20 days/year, 2 days/month accrual, 60-day carry-forward, 15-day advance notice
- **Casual Leave (CL)**: 10 days/year, max 3 consecutive days, no carry-forward
- **Medical Leave (ML)**: 14 days/year, certificate required for >3 days
- **Extra with Pay**
- **Extra without Pay**
- **Maternity**
- **Paternity**
- **Study**
- **Special Disability**
- **Quarantine**
- **Special** - EL excess >60 days, usable for medical or rest outside Bangladesh

## Database Schema

The system uses a MySQL database with the following key models:

- **User**: Employee information, roles, department assignments
- **LeaveRequest**: Leave applications with status tracking
- **Approval**: Multi-step approval workflow tracking
- **Balance**: Leave balance calculations by type and year
- **Holiday**: Company holiday calendar
- **PolicyConfig**: Policy rules and limits
- **AuditLog**: Complete audit trail
- **EncashmentRequest**: EL encashment requests (Policy 6.19.f)

## Key Business Logic

### Leave Policy (v1.1)
- Automatic enforcement of all policy rules including advance notice requirements, annual caps, consecutive day limits, medical certificate requirements, backdate rules, and balance availability
- EL accrual at 2 days per month
- EL carry-forward up to 60 days
- CL limit of maximum 3 consecutive days with no carry-forward
- ML with 14 days/year limit, certificate required for >3 days

### Approval Workflow
- Step 1: HR_ADMIN
- Step 2: DEPT_HEAD
- Step 3: HR_HEAD
- Step 4: CEO

## Development Scripts

```bash
# Development
pnpm dev          # Start dev server with Turbopack
pnpm dev:turbo    # Start dev server with Turbopack

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm prisma:seed  # Seed database with demo data

# Testing & Validation
pnpm lint         # Run ESLint
pnpm test:e2e     # Run Playwright E2E tests
pnpm policy:audit # Run policy compliance audit
pnpm verify:demo  # Verify demo data integrity

# Background Jobs
pnpm jobs:scheduler     # Start job scheduler
pnpm jobs:el-accrual    # EL accrual job
pnpm jobs:cl-lapse      # CL lapse job
```

## Dashboard Components

The system includes 8 reusable, standardized dashboard components:

1. **MetricCard**: Display key statistics with trend indicators
2. **ActionCenter**: Widget for pending tasks/actions
3. **RecentActivityTable**: Standardized activity table
4. **LeaveBreakdownChart**: Visual leave distribution
5. **TeamCapacityHeatmap**: Team availability visualization
6. **ApprovalList**: Approval workflow management
7. **DocumentUploader**: Unified file upload
8. **LeaveTimeline**: Leave history timeline

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation
- **Project Goals** - Purpose, objectives, success criteria
- **Technical Documentation** - Tech stack, architecture, setup
- **Database Schema** - Complete database documentation with ER diagrams
- **User Roles & Permissions** - Complete RBAC documentation
- **System Functionality** - Feature list by module
- **Flow Charts** - Visual workflow diagrams
- **Development Phases** - Development timeline and milestones

### Policy & Logic
- **Policy Logic Reference** - Comprehensive policy rules extraction (12 documents)

### API & Reference
- **API Contracts** - Complete API endpoint documentation
- **Reference Documentation** - Additional reference materials

## Environment Variables

Required environment variables:
```env
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
```

## Important Files and Directories

- **README.md**: Main project documentation
- **package.json**: Dependencies and scripts
- **prisma/schema.prisma**: Database schema
- **IMPLEMENTATION_SUMMARY.md**: Dashboard component implementation details
- **DASHBOARD_REFACTOR_GUIDE.md**: Guide for dashboard refactoring
- **AGENTS.md**: Agent configuration for Qwen Code
- **AUTH_BYPASS_IMPLEMENTATION.md**: Authentication bypass implementation details
- **USER_CREDENTIALS.md**: User credentials information
- **DEPLOYMENT.md**: Deployment instructions

## Key Libraries and Dependencies

- **@prisma/client**: Database ORM
- **@radix-ui/react-* components**: Accessible UI components
- **lucide-react**: Icon library
- **react-hook-form**: Form management
- **zod**: Validation library
- **date-fns**: Date manipulation
- **recharts**: Charting library
- **zustand**: State management
- **framer-motion**: Animations

## Development Workflow

- TypeScript strict mode enabled
- ESLint with Next.js config
- Pre-commit hooks (recommended)
- Feature branches
- Meaningful commit messages
- Code review process
- Maintain proper git history

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] Build succeeds without errors
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

## File Locations for Common Tasks

- **API Routes**: `app/api/`
- **UI Components**: `components/ui/`
- **Business Logic**: `lib/`
- **Database Models**: `prisma/schema.prisma`
- **Authentication**: `lib/auth.ts`
- **Policy Logic**: `lib/policy.ts`
- **Role-based Access**: `lib/rbac.ts`
- **Dashboard Components**: `app/components/dashboard/`
- **User Management**: `app/employees/`
- **Leave Management**: `app/leaves/`
- **Approvals**: `app/approvals/`
- **Reports**: `app/reports/`
- **Admin Features**: `app/admin/`

## Testing

- Unit tests: `pnpm test:unit`
- Integration tests: `pnpm test:integration`
- E2E tests: `pnpm test:e2e`
- Test files are located in the `tests/` directory

## Key Business Rules

- EL is accrued at 2 days per month
- EL can be carried forward up to 60 days
- CL has a maximum of 3 consecutive days
- ML requires medical certificate for more than 3 days
- 15-day advance notice required for EL
- Multi-level approval workflow with 4 steps
- Automatic policy enforcement for all leave types
- Encashment of EL balance exceeding 10 days (CEO approval required)
