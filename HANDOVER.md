# CDBL Leave Management System - Project Handover

> **Version**: 0.1.0 | **Last Updated**: January 31, 2026  
> **Status**: Production-Ready (Web), In Development (Mobile)

This document consolidates all information needed for project handover and ongoing maintenance.

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Getting started, architecture overview |
| [User Guide](./docs/USER_GUIDE.md) | Complete user guide for all roles |
| [Admin Guide](./docs/ADMIN_GUIDE.md) | System administration guide |
| [Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md) | Production deployment instructions |
| [User Roles & Permissions](./docs/core/04-User-Roles-and-Permissions.md) | Complete RBAC documentation |
| [API Contracts](./docs/api/API_Contracts.md) | REST API endpoint reference |
| [Mobile Docs](./docs/mobile/README.md) | iOS app documentation |
| [Policy Reference](./docs/policies/Policy_Reference.md) | Leave policy rules |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [FAQ](./docs/FAQ.md) | Frequently asked questions |

---

## Platform Status

### Web Application ✅ PRODUCTION READY

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (Login/Logout) | ✅ Working | JWT-based, 8hr sessions |
| Employee Dashboard | ✅ Working | Role-adaptive |
| Manager Dashboard | ✅ Working | Team overview |
| HR Dashboard | ✅ Working | Approval queue, analytics |
| CEO Dashboard | ✅ Working | Executive metrics |
| Leave Application | ✅ Working | All leave types |
| Approval Workflow | ✅ Working | Configurable chain |
| Leave Balance | ✅ Working | Real-time tracking |
| Holiday Calendar | ✅ Working | Admin manageable |
| Employee Management | ✅ Working | CRUD by authorized roles |
| Reports & Export | ✅ Working | PDF/Excel export |
| Notifications | ✅ Working | In-app notifications |
| Email Notifications | ⚠️ Partial | Requires SMTP config |
| 2FA | ⚠️ Optional | Not enforced by default |
| Audit Logs | ✅ Working | Full action logging |

### iOS Application ⚠️ IN DEVELOPMENT

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Working | JWT auth to web API |
| Employee Dashboard | ⚠️ Partial | Basic stats, API issues |
| Leave Application | ⚠️ Partial | Form works, submission unstable |
| Leave History | ⚠️ Partial | Displays, pagination issues |
| Approvals | ❌ Not Working | API integration incomplete |
| Push Notifications | ❌ Not Working | FCM not configured |
| Offline Mode | ❌ Not Working | Not implemented |

**Known Issues:**
- API connection sometimes fails due to network configuration
- Dashboard widgets show "Oops" error when API times out
- Some API endpoints return wrong format expected by app
- iOS 26+ Liquid Glass styling may need verification

**Recommended Action**: iOS app needs API integration fixes before production use.

### Android Application ⚠️ IN DEVELOPMENT

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ Working | JWT auth |
| Employee Dashboard | ⚠️ Partial | Basic implementation |
| Leave Application | ⚠️ Partial | Form works, needs polish |
| Leave History | ⚠️ Partial | Basic list view |
| Approvals | ❌ Not Complete | Role-based dashboards incomplete |
| Push Notifications | ⚠️ Partial | Firebase setup done |
| Offline Mode | ❌ Not Working | Room DB for caching only |

**Known Issues:**
- Role-based dashboard routing needs completion
- Some API models don't match server response
- Build requires google-services.json for Firebase

**Recommended Action**: Complete role-based dashboard implementation.

---

## User Roles & Features

### EMPLOYEE (Base Role)
- ✅ Apply for leave (all types)
- ✅ View own leave history
- ✅ Check leave balances
- ✅ View company holidays
- ✅ Cancel pending requests
- ✅ Upload medical certificates
- ✅ View own profile

### DEPT_HEAD (Department Head)
*All EMPLOYEE features plus:*
- ✅ View team leave requests
- ✅ Forward requests to HR
- ✅ Access team calendar
- ✅ View team analytics
- ❌ Cannot directly approve (only forward)

### HR_ADMIN (HR Administrator)
*All DEPT_HEAD features plus:*
- ✅ View all leave requests
- ✅ Forward in approval chain
- ✅ Manage employee profiles
- ✅ Manage holiday calendar
- ✅ View audit logs
- ❌ Cannot approve/reject

### HR_HEAD (HR Head)
*All HR_ADMIN features plus:*
- ✅ Approve/Reject leave requests
- ✅ Policy compliance dashboard
- ✅ Organization-wide analytics
- ✅ Forward to CEO

### CEO (Chief Executive)
*All HR_HEAD features plus:*
- ✅ Final approval authority
- ✅ Executive dashboard
- ✅ Full system visibility
- ✅ Approve HR_HEAD requests

### SYSTEM_ADMIN (Technical Admin)
*Full system access:*
- ✅ All approval capabilities
- ✅ Create/manage employees
- ✅ Manage policies
- ✅ System settings
- ✅ Audit log access

---

## Configurable Workflow System

The approval workflow is fully configurable based on requester role.

### Default Workflow Matrix

```
EMPLOYEE     → DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO
DEPT_HEAD    → HR_HEAD → CEO
HR_ADMIN     → HR_HEAD → CEO
HR_HEAD      → CEO
CEO          → (Self-approved or SYSTEM_ADMIN)
```

### Configuration Location

File: `lib/workflow.ts`

```typescript
const ROLE_WORKFLOW_MATRIX: Record<AppRole, Role[]> = {
  EMPLOYEE: ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"],
  DEPT_HEAD: ["HR_HEAD", "CEO"],
  HR_ADMIN: ["HR_HEAD", "CEO"],
  HR_HEAD: ["CEO"],
  CEO: [],
  SYSTEM_ADMIN: []
};
```

### Modifying Workflow

1. Edit `ROLE_WORKFLOW_MATRIX` in `lib/workflow.ts`
2. Restart application
3. New requests follow updated chain
4. Existing requests continue with original chain

### Leave-Type Specific Rules

The workflow can be extended to have leave-type specific rules by modifying `getChainFor()` function.

---

## Leave Types & Policy

| Type | Days/Year | Key Rules |
|------|-----------|-----------|
| **Earned (EL)** | 24 | 5 days advance notice, 60-day carry-forward |
| **Casual (CL)** | 10 | Max 3 consecutive days, no carry-forward |
| **Medical (ML)** | 14 | Certificate for >3 days |
| **Maternity** | 56 | 6 months service required |
| **Paternity** | 7 | 1 year service required |
| **Quarantine** | 21-30 | 30 days needs CEO approval |
| **Study** | 365+ | Board approval for extension |
| **Special Disability** | 180 | Full/half pay structure |

**Policy Configuration**: `lib/policy.ts`

---

## Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/cdbl_leave"

# Authentication
JWT_SECRET="<32+ character secret>"
AUTH_SECRET="<32+ character secret>"

# Email (Optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASS="password"

# Firebase (Mobile Push, Optional)
FIREBASE_ADMIN_SDK="<path or JSON>"
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed demo data
pnpm prisma:seed

# Start dev server
pnpm dev
```

### Production Deployment

See [Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md) for complete instructions.

Quick checklist:
- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Generate Prisma client
- [ ] Build: `pnpm build`
- [ ] Start: `pnpm start`

---

## Scheduled Jobs

| Job | Command | Schedule |
|-----|---------|----------|
| EL Accrual | `pnpm jobs:el-accrual` | Monthly (1st) |
| CL Lapse | `pnpm jobs:cl-lapse` | Yearly (Jan 1) |

Production: Set up cron jobs to run these automatically.

---

## Database

- **ORM**: Prisma 7.x
- **Database**: MySQL 8.0
- **Schema**: `prisma/schema.prisma`

### Key Commands

```bash
pnpm prisma studio    # Visual browser
pnpm prisma migrate   # Run migrations
pnpm prisma:seed      # Seed data
pnpm db:status        # Migration status
```

---

## Known Issues & Limitations

### Web App
1. **Email notifications** require SMTP configuration
2. **Large exports** may timeout (>10,000 records)
3. **Concurrent approval** race condition (rare)

### iOS App
1. **API integration incomplete** - Dashboard errors
2. **Push notifications not configured**
3. **Liquid Glass effects** may not render on all devices
4. **Offline mode not implemented**

### Android App
1. **Role-based dashboards incomplete**
2. **Some API response parsing issues**
3. **Requires Firebase configuration**

---

## Project Structure

```
cdbl-leave-management/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
├── lib/                   # Core business logic
│   ├── auth.ts           # Authentication
│   ├── policy.ts         # Leave policy rules
│   ├── rbac.ts           # Role permissions
│   ├── workflow.ts       # Approval workflow
│   └── ...
├── prisma/                # Database schema
├── docs/                  # Documentation
├── mobile/
│   ├── ios/              # SwiftUI app
│   └── android/          # Kotlin/Compose app
└── scripts/              # Utility scripts
```

---

## Support & Contacts

For technical issues:
1. Check [Troubleshooting](./docs/TROUBLESHOOTING.md)
2. Check [FAQ](./docs/FAQ.md)
3. Review application logs
4. Contact development team

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 31, 2026 | Initial | Initial handover documentation |

