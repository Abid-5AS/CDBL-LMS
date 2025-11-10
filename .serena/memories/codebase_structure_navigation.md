# CDBL Leave Management System - Codebase Structure & Navigation

## Top-Level Directory Organization

```
cdbl-leave-management/
├── app/                    # Next.js App Router (Pages & API)
├── components/            # React Components
├── lib/                   # Business Logic & Utilities
├── prisma/               # Database Schema & Migrations
├── docs/                 # Comprehensive Documentation
├── tests/                # Test Files
├── scripts/              # Background Jobs & Utilities
├── public/               # Static Assets
├── styles/               # Global Styles
└── types/                # TypeScript Type Definitions
```

## App Directory Structure (Next.js App Router)

```
app/
├── api/                   # API Routes
│   ├── auth/             # Authentication endpoints
│   ├── leaves/           # Leave management APIs
│   ├── employees/        # Employee management APIs
│   ├── approvals/        # Approval workflow APIs
│   └── admin/            # Admin functionality APIs
├── dashboard/            # Dashboard pages
├── leaves/               # Leave management pages
│   ├── apply/            # Leave application
│   ├── history/          # Leave history
│   └── balance/          # Leave balance
├── employees/            # Employee management pages
├── admin/                # Admin pages
├── approvals/            # Approval workflow pages
├── reports/              # Reporting pages
├── settings/             # Settings pages
└── layout.tsx            # Root layout with providers
```

## Components Directory Structure

```
components/
├── ui/                    # shadcn/ui Base Components
│   ├── button.tsx        # Button variants
│   ├── input.tsx         # Input components
│   ├── form.tsx          # Form components
│   └── ...               # Other UI primitives
├── shared/               # Reusable Business Components
│   ├── LeaveCharts/      # Chart components
│   ├── LeaveBalancePanel.tsx
│   ├── SharedTimeline.tsx
│   └── widgets/          # Dashboard widgets
├── dashboards/           # Role-Specific Dashboard Components
│   ├── shared/           # Common dashboard elements
│   ├── employee/         # Employee dashboard
│   ├── manager/          # Manager dashboard
│   └── hr/               # HR dashboard
├── layout/               # Layout Components
│   ├── Navbar.tsx        # Navigation bar
│   ├── Sidebar.tsx       # Sidebar navigation
│   └── Footer.tsx        # Footer component
├── leaves/               # Leave-Specific Components
├── roles/                # Role-Based UI Components
└── providers/            # Context Providers
```

## Library Directory Structure

```
lib/
├── auth.ts               # Authentication utilities
├── auth-jwt.ts           # JWT token handling
├── rbac.ts               # Role-based access control
├── policy.ts             # Leave policy enforcement
├── workflow.ts           # Approval workflow logic
├── prisma.ts             # Prisma client configuration
├── date-utils.ts         # Date handling utilities
├── working-days.ts       # Business day calculations
├── leave-validation.ts   # Leave request validation
├── utils.ts              # General utilities (cn, formatters)
├── api.ts                # API client utilities
├── session.ts            # Session management
└── errors.ts             # Error handling utilities
```

## Key Navigation Patterns

### Component Import Paths
- **UI Components**: `@/components/ui/button`
- **Shared Components**: `@/components/shared/LeaveCharts/TrendChart`
- **Dashboard Components**: `@/components/dashboards/shared/ResponsiveDashboard`
- **Business Logic**: `@/lib/policy`
- **Database**: `@/lib/prisma`

### Path Aliases (tsconfig.json)
- `@/*` - Root directory access
- `@shared/*` - Direct access to shared components
- `@dash/*` - Direct access to dashboard components

### Component Organization Rules
1. **UI Primitives**: Base components in `/components/ui/`
2. **Business Components**: Reusable logic in `/components/shared/`
3. **Role-Specific**: Dashboard components in `/components/dashboards/`
4. **Feature-Specific**: Domain components in respective directories

## Database Structure

```
prisma/
├── schema.prisma         # Main database schema
├── migrations/           # Database migration history
├── seed.ts              # Database seeding script
└── seed-data/           # Static seed data files
```

### Key Database Models
- **User**: Employee information and authentication
- **LeaveRequest**: Leave applications and status
- **LeaveBalance**: Current leave balances per employee
- **ApprovalFlow**: Multi-step approval workflow
- **Policy**: Leave policy rules and versions
- **Holiday**: Company holiday calendar

## Documentation Structure

```
docs/
├── 01-Project-Goals.md           # Project objectives
├── 02-Technical-Documentation.md # Tech stack details
├── 03-Database-Schema.md         # Database documentation
├── 04-User-Roles-and-Permissions.md # RBAC details
├── 05-System-Functionality.md    # Feature documentation
├── 06-Flow-Charts.md            # Workflow diagrams
├── 07-Development-Phases.md     # Development timeline
├── API/                         # API documentation
└── Policy Logic/                # Business rule documentation
```

## Common File Patterns

### Component Files
- **Component**: `ComponentName.tsx` (PascalCase)
- **Hook**: `useHookName.ts` (camelCase with 'use' prefix)
- **Utility**: `utility-name.ts` (kebab-case)
- **Type**: `types.ts` or inline interfaces

### API Route Files
- **Route**: `route.ts` in directory structure
- **Middleware**: `middleware.ts`
- **Validation**: Co-located Zod schemas

### Testing Files
- **Unit**: `ComponentName.test.tsx`
- **Integration**: `feature.test.ts`
- **E2E**: `workflow.spec.ts` (Playwright)