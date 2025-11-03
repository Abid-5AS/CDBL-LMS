# CDBL Leave Management System

A comprehensive web-based leave management system for Central Depository Bangladesh Limited (CDBL), built with Next.js 16, React 19, and Prisma ORM.

---

## Overview

The CDBL Leave Management System digitizes and automates the leave management process, replacing manual workflows with a modern, policy-compliant digital solution. The system enforces CDBL HR Leave Policy (v1.1) automatically and provides role-based access for employees, managers, and HR teams.

### Key Features

- **Leave Application**: Digital leave requests with real-time validation
- **Multi-Level Approval**: 4-step approval workflow (HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO)
- **Policy Enforcement**: Automatic enforcement of CDBL leave policy rules
- **Balance Management**: Real-time leave balance tracking and accrual
- **Holiday Management**: Company holiday calendar with impact on leave dates
- **Role-Based Dashboards**: Customized dashboards for each user role
- **Audit Trail**: Complete audit logging for compliance
- **Employee Management**: Comprehensive employee directory and profile management

---

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **Frontend**: React 19.2.0, TypeScript 5.9.3
- **UI**: shadcn/ui, Tailwind CSS 4.x
- **Database**: MySQL with Prisma 6.17.1
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod 4.x, React Hook Form 7.x

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (or npm/yarn)
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cdbl-leave-management
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave"
   JWT_SECRET="your-secret-key-here"
   NODE_ENV="development"
   ```

4. **Set up database**
   ```bash
   # Generate Prisma Client
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate dev
   
   # Seed database (optional, for demo data)
   pnpm prisma:seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

```bash
# Development
pnpm dev          # Start dev server with Turbopack

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
```

---

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

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation
- **[Project Goals](./docs/01-Project-Goals.md)** - Purpose, objectives, success criteria
- **[Technical Documentation](./docs/02-Technical-Documentation.md)** - Tech stack, architecture, setup
- **[Database Schema](./docs/03-Database-Schema.md)** - Complete database documentation with ER diagrams
- **[User Roles & Permissions](./docs/04-User-Roles-and-Permissions.md)** - Complete RBAC documentation
- **[System Functionality](./docs/05-System-Functionality.md)** - Feature list by module
- **[Flow Charts](./docs/06-Flow-Charts.md)** - Visual workflow diagrams
- **[Development Phases](./docs/07-Development-Phases.md)** - Development timeline and milestones

### Policy & Logic
- **[Policy Logic Reference](./docs/Policy%20Logic/README.md)** - Comprehensive policy rules extraction (12 documents)

### API & Reference
- **[API Contracts](./docs/API/API_Contracts.md)** - Complete API endpoint documentation
- **[Reference Documentation](./docs/References/)** - Additional reference materials

---

## User Roles

The system supports 5 user roles:

1. **EMPLOYEE** - Apply for leave, view own data
2. **DEPT_HEAD** - Team oversight, forward requests
3. **HR_ADMIN** - Leave management, user administration
4. **HR_HEAD** - Final approval authority, policy compliance
5. **CEO** - Executive oversight, full system access

See [User Roles & Permissions](./docs/04-User-Roles-and-Permissions.md) for complete details.

---

## Leave Policy (v1.1)

### Leave Types

- **Earned Leave (EL)**: 20 days/year, 2 days/month accrual, 60-day carry-forward, 15-day advance notice
- **Casual Leave (CL)**: 10 days/year, max 3 consecutive days, no carry-forward
- **Medical Leave (ML)**: 14 days/year, certificate required for >3 days

### Policy Enforcement

The system automatically enforces all policy rules including:
- Advance notice requirements
- Annual caps
- Consecutive day limits
- Medical certificate requirements
- Backdate rules
- Balance availability

See [Policy Logic Reference](./docs/Policy%20Logic/README.md) for complete policy documentation.

---

## Development

### Code Quality

- TypeScript strict mode enabled
- ESLint with Next.js config
- Pre-commit hooks (recommended)

### Git Workflow

- Feature branches
- Meaningful commit messages
- Code review process
- Maintain proper git history

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] Build succeeds without errors
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

---

## Support & Resources

- **Documentation**: See `docs/` directory
- **API Reference**: [API Contracts](./docs/API/API_Contracts.md)
- **Policy Rules**: [Policy Logic Reference](./docs/Policy%20Logic/README.md)
- **Issues**: Report via project issue tracker

---

## License

Internal use only - CDBL Leave Management System

---

## Version

**Current Version**: 0.1.0  
**Policy Version**: v1.1  
**Next.js Version**: 16.0.0  
**Last Updated**: Current

---

## Contributing

This is an internal CDBL project. For contributions, please follow the established development workflow and documentation standards.
