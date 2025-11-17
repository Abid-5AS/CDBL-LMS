# CDBL Leave Management System - Technical Documentation

## Technology Stack

### Frontend

- **Framework**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS 4.x
- **Animation**: Framer Motion 12.x
- **Form Management**: React Hook Form 7.x + Zod 4.x
- **Date Handling**: date-fns 4.x, react-day-picker 9.x
- **State Management**: Zustand 5.x, SWR 2.x
- **Charts**: Recharts 3.x
- **Icons**: Lucide React 0.546.0
- **Toast Notifications**: Sonner 2.x

### Backend

- **Framework**: Next.js 16 API Routes
- **Database**: MySQL (via Prisma ORM)
- **ORM**: Prisma 6.17.1
- **Authentication**: JWT (jose 6.x) + HTTP-only cookies
- **Password Hashing**: bcryptjs 3.x
- **Validation**: Zod 4.x

### Development Tools

- **Language**: TypeScript 5.9.3
- **Build Tool**: Turbopack (Next.js integrated)
- **React Compiler**: React Compiler enabled
- **Linting**: ESLint 9.x with Next.js config
- **Testing**: Playwright (E2E)
- **Package Manager**: pnpm

### Additional Libraries

- **3D Effects**: Three.js 0.181.0
- **Drag & Drop**: @dnd-kit (core, sortable, utilities)
- **Theme**: next-themes 0.4.6 (dark mode)
- **Search**: cmdk 1.1.1 (command palette)

---

## Architecture Overview

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                  │
├─────────────────────────────────────────────────────────┤
│  App Router (Server Components + Client Components)    │
│  ├── Pages (Server Components)                          │
│  ├── API Routes (Server Actions)                        │
│  └── Layout Providers                                   │
├─────────────────────────────────────────────────────────┤
│  Client-Side                                            │
│  ├── React Components (Client Components)               │
│  ├── State Management (Zustand, SWR)                   │
│  └── Form Handling (React Hook Form)                    │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  ├── lib/policy.ts (Policy rules)                       │
│  ├── lib/rbac.ts (Role-based access)                    │
│  ├── lib/workflow.ts (Approval workflow)                │
│  ├── lib/auth.ts (Authentication)                      │
│  └── lib/prisma.ts (Database client)                   │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  ├── Prisma ORM                                         │
│  └── MySQL Database                                     │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
cdbl-leave-management/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── leaves/           # Leave management pages
│   ├── admin/            # Admin pages
│   ├── employees/        # Employee management
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── roles/            # Role-specific views
├── lib/                   # Business logic & utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Authentication
│   ├── policy.ts         # Policy rules
│   ├── rbac.ts           # Role-based access
│   └── workflow.ts       # Approval workflow
├── prisma/                # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # Migration files
└── public/                # Static assets
```

---

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: Latest version (or npm/yarn)
- **MySQL**: 8.0+ (or compatible database)
- **Git**: For version control

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd cdbl-leave-management
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file in root directory:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave"
   JWT_SECRET="your-secret-key-here"
   NODE_ENV="development"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma Client
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate dev
   
   # Seed database (optional)
   pnpm prisma:seed
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   # Server runs on http://localhost:3000
   ```

### Development Scripts

```json
{
  "dev": "next dev --turbopack",      // Development server with Turbopack
  "build": "next build --turbopack",  // Production build
  "start": "next start",              // Production server
  "lint": "eslint",                   // Code linting
  "prisma:seed": "tsx prisma/seed.ts", // Seed database
  "policy:audit": "tsx scripts/policy-audit.ts", // Policy compliance check
  "test:e2e": "playwright test",      // E2E tests
  "verify:demo": "tsx scripts/verify-demo-data.ts" // Verify demo data
}
```

---

## Configuration

### Next.js Configuration (`next.config.ts`)

```typescript
{
  distDir: ".next-dev" (dev) / ".next" (prod),
  cacheComponents: true,        // Next.js 16 Cache Components
  reactCompiler: true,           // React Compiler enabled
  turbopack: {
    resolveAlias: { fs: "./empty.ts" } // Browser compatibility
  },
  headers: [
    {
      Referrer-Policy: "no-referrer",
      Permissions-Policy: "camera=(), microphone=(), geolocation=()",
      X-Content-Type-Options: "nosniff"
    }
  ]
}
```

### Environment Variables

**Required**:
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Secret key for JWT signing

**Optional**:
- `NODE_ENV`: `development` | `production`
- `NEXT_PUBLIC_*`: Public environment variables

### TypeScript Configuration

- **Strict Mode**: Enabled
- **Target**: ES2020+
- **Module**: ESNext
- **JSX**: `react-jsx`
- **Path Aliases**: `@/*` → `./*`

---

## Database Architecture

### Prisma ORM Setup

- **Provider**: MySQL
- **Connection**: Via `DATABASE_URL` environment variable
- **Client Generation**: `pnpm prisma generate`
- **Migrations**: `pnpm prisma migrate dev`

### Database Models

See [Database Schema Documentation](./03-Database-Schema.md) for complete schema details.

Key models:
- `User` - Employee/user accounts
- `LeaveRequest` - Leave applications
- `Approval` - Approval workflow records
- `Balance` - Leave balance tracking
- `Holiday` - Company holidays
- `AuditLog` - Audit trail
- `OrgSettings` - Organization configuration
- `PolicyConfig` - Policy configuration

---

## Authentication & Security

### Authentication Flow

1. User submits credentials via `/api/login`
2. Server validates credentials against database
3. Server generates JWT token
4. JWT stored in HTTP-only cookie (`jwt`)
5. Additional user info in cookies (`auth_user_email`, `auth_user_name`, `auth_user_role`)
6. Middleware validates JWT on protected routes

### Security Implementation

#### Password Security
- **Hashing**: bcryptjs with salt rounds
- **Storage**: Hashed passwords only (never plain text)

#### Session Security
- **JWT Tokens**: Signed with secret key
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: Enabled in production
- **SameSite**: Strict cookie policy

#### API Security
- **Input Validation**: Zod schemas on all API endpoints
- **Rate Limiting**: Implemented on auth endpoints (via lib/rateLimit.ts)
- **CSRF Protection**: Per-route POST checks
- **SQL Injection**: Prevented via Prisma ORM

#### Access Control
- **RBAC**: Role-based access control (5 roles)
- **Middleware**: Route protection based on JWT and roles
- **Least Privilege**: Users only access what their role allows

#### Security Headers
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Content-Type-Options: nosniff`

---

## Performance Optimization

### Next.js Optimizations

- **Turbopack**: Faster builds and HMR
- **React Compiler**: Automatic memoization
- **Cache Components**: Next.js 16 caching for server components
- **Server Components**: Reduce client bundle size
- **Code Splitting**: Automatic via Next.js

### Database Optimization

- **Indexes**: On foreign keys and frequently queried fields
- **Pagination**: Cursor-based for large datasets
- **Connection Pooling**: Via Prisma

### Frontend Optimization

- **SWR**: Client-side data caching and revalidation
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js Image component
- **Bundle Size**: Tree-shaking and code splitting

### Caching Strategy

- **Static Pages**: Pre-rendered where possible
- **API Routes**: `cache: "no-store"` for dynamic data
- **Client Cache**: SWR for optimistic updates

---

## Build & Deployment

### Build Process

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Production server
pnpm start
```

### Build Output

- **Development**: `.next-dev/`
- **Production**: `.next/`
- **Static Assets**: `public/`

### Deployment Considerations

1. **Environment Variables**: Must be set in production
2. **Database Migrations**: Run before deployment
3. **Prisma Client**: Must be generated
4. **Build Optimization**: Use production build
5. **Asset Optimization**: Static assets optimized automatically

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

## API Architecture

### API Routes Structure

All API routes are in `app/api/` directory using Next.js App Router:

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── me/route.ts
├── leaves/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (PATCH - cancel)
│       ├── approve/route.ts
│       ├── reject/route.ts
│       └── forward/route.ts
├── approvals/
│   └── route.ts
├── balance/
│   └── mine/route.ts
├── holidays/
│   ├── route.ts
│   └── [id]/route.ts
└── admin/
    ├── users/
    └── policies/
```

### API Response Format

**Success Response**:
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "error": "error_code",
  "message": "Human readable message"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Server Error

---

## Error Handling

### Client-Side Error Handling

- **Form Validation**: React Hook Form + Zod
- **Toast Notifications**: Sonner for user feedback
- **Error Boundaries**: React error boundaries for component errors

### Server-Side Error Handling

- **API Routes**: Try-catch blocks with appropriate status codes
- **Validation Errors**: 400 with error details
- **Authentication Errors**: 401
- **Authorization Errors**: 403
- **Server Errors**: 500 with logging

### Logging

- **Audit Logs**: Stored in `AuditLog` table
- **Server Logs**: Console logging (enhance with proper logger in production)
- **Error Tracking**: Error details logged for debugging

---

## Testing Strategy

### E2E Testing

- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Command**: `pnpm test:e2e`

### Verification Scripts

- **Policy Audit**: `pnpm policy:audit`
- **Demo Data Verification**: `pnpm verify:demo`

### Testing Coverage

- Critical user flows
- Policy compliance
- Role-based access
- Error scenarios

---

## Monitoring & Observability

### Current Implementation

- **Audit Logs**: All approvals/rejections logged
- **Error Logging**: Server-side error logging
- **Database Queries**: Via Prisma logging (dev mode)

### Recommended Enhancements

- Application performance monitoring (APM)
- Error tracking service (Sentry, etc.)
- Usage analytics
- Database query monitoring
- Uptime monitoring

---

## Development Best Practices

### Code Organization

- **Components**: Reusable UI components in `components/ui/`
- **Business Logic**: Utility functions in `lib/`
- **API Routes**: RESTful endpoints in `app/api/`
- **Pages**: Route handlers in `app/`

### TypeScript Usage

- Strict mode enabled
- Type-safe API contracts
- Prisma-generated types
- Zod schema validation

### Git Workflow

- Feature branches
- Meaningful commit messages
- Code review process
- Maintain git history properly (per workspace rules)

---

## Related Documentation

- **Database Schema**: [Database Schema Documentation](./03-Database-Schema.md)
- **API Reference**: [API Contracts](./API/API_Contracts.md)
- **Deployment Guide**: See deployment provider documentation
- **Policy Rules**: [Policy Logic Reference](./Policy%20Logic/README.md)

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Technology Stack Version**: See package.json for exact versions

