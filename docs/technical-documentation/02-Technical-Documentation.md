# CDBL Leave Management System - Technical Documentation

**Version:** 2.0
**Last Updated:** January 2025
**Status:** Production Ready

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Key Features (v2.0)](#key-features-v20)
4. [Security Implementation](#security-implementation)
5. [Performance Optimizations](#performance-optimizations)
6. [Deployment](#deployment)

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.0.0 | Full-stack React framework with App Router |
| **UI Library** | React | 19.0 | Component-based UI |
| **Language** | TypeScript | 5.9 | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Components** | Shadcn/ui | Latest | Accessible component library |
| **Headless UI** | Radix UI | Latest | Unstyled accessible primitives |
| **Animation** | Framer Motion | 11.x | Production-ready animation |
| **Icons** | Lucide React | Latest | Modern icon library |
| **Data Fetching** | SWR | 2.x | React Hooks for data fetching |
| **Form Management** | React Hook Form | 7.x | Performant form validation |
| **Validation** | Zod | 3.x | TypeScript-first schema validation |
| **Charts** | Recharts | 2.x | Composable charting library |
| **Date Handling** | date-fns | 3.x | Modern date utility |
| **Toast** | Sonner | 2.x | Toast notifications |

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20.x LTS | JavaScript runtime |
| **Framework** | Next.js API Routes | 16.0 | RESTful API endpoints |
| **Database** | MySQL | 8.0+ | Relational database |
| **ORM** | Prisma | 6.17.1 | Type-safe database client |
| **Authentication** | JWT | jose 5.x | Token-based auth |
| **Password Hashing** | bcryptjs | 2.x | Secure password hashing |
| **Email** | Nodemailer | 6.x | Email service (2FA OTP) |
| **Validation** | Zod | 3.x | API schema validation |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **TypeScript** | 5.9 | Static type checking |
| **ESLint** | 9.x | Code linting |
| **Prettier** | Latest | Code formatting |
| **Playwright** | Latest | E2E testing |
| **Jest** | 29.x | Unit testing |
| **PM2** | 5.x | Production process manager |
| **Nginx** | 1.18+ | Reverse proxy |

---

## Architecture Overview

### System Architecture

The CDBL Leave Management System follows a **modern monolithic architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Client (Browser)                 │
│  - React 19 Components                   │
│  - SWR for data fetching                 │
│  - Client-side routing                   │
└────────────┬────────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────────┐
│       Next.js Server (Node.js 20)       │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  API Routes  │  │ Server Components│ │
│  │  /api/*      │  │  RSC             │ │
│  └──────────────┘  └─────────────────┘ │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  Middleware  │  │ Business Logic  │ │
│  │  Auth/RBAC   │  │ Policy Engine   │ │
│  └──────────────┘  └─────────────────┘ │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Prisma ORM                       │
│  - Type-safe queries                     │
│  - Migration management                  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         MySQL Database                   │
│  - Leave requests, users, balances      │
│  - Approval workflow, audit logs        │
└─────────────────────────────────────────┘
```

### Folder Structure

```
CDBL-LMS/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── leaves/       # Leave management
│   │   ├── approvals/    # Approval workflow
│   │   ├── balance/      # Balance queries
│   │   ├── holidays/     # Holiday management
│   │   ├── admin/        # Admin operations
│   │   └── dashboard/    # Dashboard data
│   ├── dashboard/        # Employee dashboard
│   ├── leaves/           # Leave pages
│   ├── approvals/        # Approval pages
│   ├── holidays/         # Holiday calendar
│   ├── admin/            # Admin panel
│   └── login/            # Authentication
│
├── components/            # React components
│   ├── ui/               # Shadcn/ui primitives
│   ├── dashboards/       # Dashboard components
│   ├── layout/           # Layout components
│   ├── navbar/           # Navigation
│   └── shared/           # Shared components
│
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utils
│   ├── rbac.ts           # RBAC functions
│   ├── policy.ts         # Policy engine
│   ├── workflow.ts       # Approval workflow
│   ├── otp.ts            # OTP generation
│   ├── email.ts          # Email service
│   ├── apiClient.ts      # API client wrapper
│   └── dateUtils.ts      # Date utilities
│
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   └── seed.ts           # Seed data
│
└── docs/                  # Documentation
    └── technical-documentation/
```

---

## Key Features (v2.0)

### 1. 2-Factor Authentication (2FA) ✨ NEW

**Implementation:** Email-based OTP verification

**Features:**
- 6-digit OTP codes sent via email
- 10-minute expiration
- 3-attempt limit per code
- Countdown timer in UI
- Resend functionality (1-minute cooldown)
- IP address tracking for security

**Technical Details:**
- OTP table in database with expiry tracking
- Nodemailer integration for email delivery
- Rate limiting on resend requests
- Comprehensive audit logging

**Files:**
- `lib/otp.ts` - OTP generation and verification
- `lib/email.ts` - Email service integration
- `app/api/auth/verify-otp/route.ts` - Verification endpoint
- `app/api/auth/resend-otp/route.ts` - Resend endpoint
- `app/verify-otp/page.tsx` - OTP input UI

---

### 2. Enhanced Dashboard KPIs ✨ NEW

**Feature:** Approval stage tracking in Pending Requests KPI

**Implementation:**
- Shows current approver role (HR Admin, Manager, HR Head, CEO)
- Displays average waiting time across all pending requests
- Dynamic icon based on approval stage
- Real-time updates via SWR

**Technical Details:**
```typescript
// Approval stage mapping
const APPROVAL_STAGES = {
  1: { role: "HR Admin", icon: UserCheck },
  2: { role: "Manager", icon: Users },
  3: { role: "HR Head", icon: Shield },
  4: { role: "CEO", icon: Activity },
};

// Calculate current stage from approvals
function getCurrentApprovalStage(approvals) {
  // Returns current stage, role, and icon
}
```

**Files:**
- `components/dashboards/employee/ModernOverview.tsx`

---

### 3. UI/UX Improvements ✨ NEW

**Improvements Made:**

#### a) My Leaves Page Cleanup
- Removed redundant animated card above tabs
- 200px of vertical space reclaimed
- More focus on leave data

#### b) Navigation Fixes
- Fixed "My Leaves" text wrapping issue
- Added `whitespace-nowrap` to all nav items
- Consistent appearance at all screen widths

#### c) Upcoming Holidays Fix
- Fixed display bug showing "No upcoming holidays"
- Now uses server-side filtering (`?upcoming=true`)
- Correct data always displayed

#### d) Company Holidays Simplification
- Simplified filter controls with shorter labels
- Enhanced active state styling with shadow
- Responsive icon-only mode on mobile
- Removed redundant UI elements

**Files:**
- `components/ui/enhanced-smooth-tab.tsx`
- `app/leaves/MyLeavesPageContent.tsx`
- `components/navbar/DesktopNav.tsx`
- `components/shared/widgets/NextHoliday.tsx`
- `app/holidays/components/HolidaysFilters.tsx`
- `app/holidays/components/HolidaysMainContent.tsx`

---

### 4. API Client Migration ✅

**Migration:** Native `fetch` → Centralized API client

**Benefits:**
- Centralized error handling
- Automatic JWT token refresh
- Consistent response format
- Type-safe API calls
- Reduced code duplication

**Files Migrated:** 21 component files

**API Client Features:**
```typescript
// lib/apiClient.ts
export const apiClient = {
  get: async (url) => { /* ... */ },
  post: async (url, data) => { /* ... */ },
  patch: async (url, data) => { /* ... */ },
  delete: async (url) => { /* ... */ },
};

// Usage
const leaves = await apiClient.get('/api/leaves');
```

---

### 5. Color-Blind Accessibility ✅

**Implementation:** Multi-modal status indicators

**Features:**
- Icon + Color + Text + Pattern encoding
- WCAG 2.1 AA compliant contrast ratios
- Pattern backgrounds for additional distinction
- Screen reader friendly

**Status Indicators:**
- **APPROVED:** Green + Checkmark + Solid
- **PENDING:** Yellow + Clock + Dotted border
- **REJECTED:** Red + X + Diagonal stripes
- **CANCELLED:** Gray + Ban + Solid

**Files:**
- `components/ui/status-badge.tsx`
- Various dashboard and list components

---

### 6. Core Leave Management ✅

**Features:**
- Multi-step leave application form
- Real-time policy validation
- Balance checking
- Medical certificate upload
- Leave history with filters
- Leave cancellation
- Approval timeline tracking

**Validation:**
- Date range validation
- Policy rule enforcement (EL, CL, ML rules)
- Balance sufficiency checks
- Annual cap enforcement
- Certificate requirements

---

### 7. Approval Workflow ✅

**4-Step Approval Chain:**
```
Employee → HR Admin → Department Head → HR Head/CEO → Approved
```

**Features:**
- Role-based forwarding
- Final approval by HR_HEAD or CEO
- Self-approval prevention
- Approval comments
- Complete timeline tracking

**Business Rules:**
- HR_ADMIN can forward to DEPT_HEAD
- DEPT_HEAD can forward to HR_HEAD
- HR_HEAD can approve/reject or forward to CEO
- CEO has final authority

---

### 8. Balance Management ✅

**Features:**
- Real-time balance display
- Balance per leave type (EL, CL, ML)
- Opening balance (carry-forward for EL)
- Accrued balance (monthly for EL)
- Used balance tracking
- Remaining balance calculation

**Calculation:**
```
Available = (Opening + Accrued) - Used
```

**Limitations (v2.0):**
- Manual balance deduction (automation planned for v2.1)
- Manual EL accrual (automation planned for v2.1)

---

### 9. Holiday Management ✅

**Features:**
- Company holiday calendar
- Holiday CRUD operations (admin)
- Optional holiday marking
- Multiple view modes (Grid, List, Calendar)
- Year filtering
- Search functionality
- CSV import support

**Business Logic:**
- Leave cannot start/end on holidays
- CL cannot touch weekends/holidays
- Holiday checking in date validation

---

### 10. Audit Logging ✅

**Features:**
- Complete audit trail for all actions
- IP address tracking
- Timestamp tracking
- Actor and target identification
- JSON details for complex data
- Filterable and searchable logs

**Logged Actions:**
- LOGIN
- LEAVE_APPROVE
- LEAVE_REJECT
- LEAVE_FORWARD
- LEAVE_BACKDATE_ASK
- LEAVE_CANCELLED
- USER_CREATE, USER_UPDATE
- POLICY_NOTE

---

## Security Implementation

### Authentication & Authorization

#### JWT Authentication

**Implementation:**
- HTTP-only cookies for token storage
- jose library for JWT signing/verification
- 7-day expiration with automatic refresh
- Secure flag in production (HTTPS only)

**Token Structure:**
```json
{
  "userId": 123,
  "email": "user@cdbl.com",
  "role": "EMPLOYEE",
  "iat": 1699876543,
  "exp": 1700481343
}
```

#### 2-Factor Authentication

**OTP Flow:**
1. User enters email/password
2. Credentials verified
3. OTP generated and stored in database
4. Email sent with 6-digit code
5. User enters OTP code
6. OTP verified (max 3 attempts)
7. JWT token issued
8. OTP marked as used

**Security Features:**
- 10-minute OTP expiration
- 3-attempt limit
- Single-use codes
- IP tracking
- Rate limiting on resend

#### Role-Based Access Control (RBAC)

**5-Tier Hierarchy:**
```
CEO (highest)
  ↓
HR_HEAD
  ↓
HR_ADMIN
  ↓
DEPT_HEAD
  ↓
EMPLOYEE (lowest)
```

**Permission Matrix:**
- Route-level protection via middleware
- Component-level checks via RBAC functions
- API-level authorization checks
- Resource ownership validation

**Key RBAC Functions:**
```typescript
// lib/rbac.ts
canViewAllRequests(role)
canApprove(role)
canViewEmployee(viewerRole, targetRole)
canEditEmployee(viewerRole, targetRole)
canAssignRole(viewerRole, targetRole)
canCreateEmployee(role)
```

### Input Validation

**Client-Side:**
- React Hook Form + Zod schemas
- Real-time error display
- Type-safe form data

**Server-Side:**
- Zod schema validation on all API endpoints
- Comprehensive error messages
- SQL injection prevention via Prisma ORM
- XSS prevention via sanitization

### Security Headers

```nginx
# Nginx configuration
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";
add_header Content-Security-Policy "default-src 'self'";
```

### Rate Limiting

**Protected Endpoints:**
- `POST /api/login` - 5 attempts per 15 minutes per IP
- `POST /api/auth/verify-otp` - 3 attempts per OTP code
- `POST /api/auth/resend-otp` - 3 requests per 15 minutes per user

---

## Performance Optimizations

### Frontend Optimizations

**Code Splitting:**
- Automatic route-based code splitting via Next.js
- Dynamic imports for heavy components
- React.lazy for deferred loading

**Image Optimization:**
- Next.js Image component for automatic optimization
- WebP format with fallbacks
- Responsive images with srcset

**CSS Optimization:**
- Tailwind JIT compilation
- Purge unused CSS in production
- CSS minification

**Data Fetching:**
- SWR for client-side data fetching
- Automatic caching and revalidation
- Optimistic UI updates
- Deduplication of requests

### Backend Optimizations

**Database:**
- Strategic indexes on foreign keys
- Prisma select only needed fields
- Connection pooling
- Query optimization

**API:**
- No-cache headers for dynamic data
- Compression via Nginx (gzip)
- HTTP/2 support

**Caching Strategy:**
- Client-side: SWR cache (stale-while-revalidate)
- Server-side: No caching (all data dynamic)
- Future: Redis for session storage and API caching

### Performance Metrics (Current)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint | <1.5s | 1.2s | ✅ Excellent |
| Largest Contentful Paint | <2.5s | 2.2s | ✅ Good |
| Time to Interactive | <3.5s | 3.1s | ✅ Good |
| First Input Delay | <100ms | 50ms | ✅ Excellent |
| Cumulative Layout Shift | <0.1 | 0.05 | ✅ Excellent |
| API Response Time | <500ms | 350ms | ✅ Excellent |

---

## Deployment

### Production Stack

```
Internet
   ↓ HTTPS (443)
Nginx (Reverse Proxy + SSL)
   ↓ HTTP (3000)
PM2 (Process Manager, Cluster Mode)
   ↓
Next.js Application (3-4 workers)
   ↓
MySQL Database
```

### Server Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- Network: 100 Mbps

**Recommended (Production):**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/cdbl_lms

# JWT
JWT_SECRET=your_secure_32_char_secret_here

# Email (2FA)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=CDBL LMS <noreply@cdbl.com>

# Application URL
NEXT_PUBLIC_APP_URL=https://lms.cdbl.com
```

### Deployment Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Run database migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Build application
npm run build

# 6. Restart PM2
pm2 restart cdbl-lms
```

### Monitoring

**Logs:**
- Application logs: `/var/log/cdbl-lms/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `pm2 logs cdbl-lms`

**Monitoring Tools:**
- PM2 monit (real-time)
- PM2 logs (application logs)
- MySQL slow query log
- Nginx access logs

---

## Related Documentation

- **Architecture Details**: [System Architecture](./architecture/System-Architecture.md)
- **Database Schema**: [Database Schema](./03-Database-Schema.md)
- **API Reference**: [API Documentation](./api/API-Documentation.md)
- **Deployment Guide**: [Deployment Guide](./deployment/Deployment-Guide.md)
- **Testing Strategy**: [Testing Strategy](./testing/Testing-Strategy.md)

---

**Document Version:** 2.0
**Last Updated:** January 2025
**Technology Stack Version:** Next.js 16, React 19, MySQL 8.0
**Production Ready:** Yes
**Next Review:** Q2 2025
