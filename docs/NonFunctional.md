# Non-Functional & Security

## Security

### Authentication & Session Management
- **JWT-based authentication**: JWT tokens signed with HS256 algorithm
- **Session cookies**: 
  - Cookie name: `session_token` (HTTP-only)
  - Secure flag enabled in production (`secure: true` in prod only)
  - Additional cookies: `auth_user_email`, `auth_user_name`, `auth_user_role`
  - Session expiration: 8 hours default
- **CSRF protection**: Per-route POST checks (middleware validation)
- **Private network**: Designed for internal network deployment

### Rate Limiting
- **Implementation**: Redis-based with in-memory fallback
- **Limits**: 5 attempts per 5-minute window per IP
- **Endpoints**: Authentication endpoints (`/api/login`)
- **Fallback**: In-memory rate limiting if Redis unavailable
- **Location**: `lib/rateLimit.ts`

### Input Validation
- **Schema validation**: Zod schemas at all API boundaries
- **Type safety**: TypeScript strict mode enabled
- **Sanitization**: Prisma ORM prevents SQL injection

### Security Headers
Set in `proxy.ts` middleware:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cache-Control: no-store` (for API routes)

### Database Security
- **Least privilege**: Application uses dedicated DB user with minimal permissions
- **Separate admin user**: For database operations and migrations
- **Prisma ORM**: Automatic parameterized queries prevent SQL injection

## Logging & Audit

### Audit Trail
- **Location**: `AuditLog` table in database
- **Logged Actions**:
  - `LEAVE_APPROVE` - Leave approved
  - `LEAVE_REJECT` - Leave rejected
  - `LEAVE_FORWARD` - Leave forwarded
  - `LEAVE_CANCELLED` - Leave cancelled
  - `LEAVE_BACKDATE_ASK` - Backdate confirmation requested
  - `LOGIN` / `LOGOUT` - Authentication events
  - `POLICY_NOTE` - Policy-related notes
  - `UPDATE_EMPLOYEE` - Employee data changes
  - `BALANCE_ADJUSTED` - Balance adjustments
- **Fields**: `actorEmail`, `action`, `targetEmail`, `details` (JSON), `createdAt`
- **Access**: Available via `/admin/audit` (HR_ADMIN, HR_HEAD, CEO)

### Error Logging
- **Server-side**: Console logging for errors
- **Request context**: Route + userId included (no PII duplication)
- **Production**: Should integrate with external logging service

## Backups & Data Retention

### Database Backups
- **Strategy**: MySQL nightly dumps
- **Retention**: 30 days
- **Location**: Production backup server
- **Automation**: Scheduled via cron/systemd

### File Storage
- **Location**: `public/uploads/` directory
- **Backup**: Mirrored backup on local server share
- **File naming**: UUID-based for security
- **Types**: PDF, JPG, PNG (medical certificates)

### Data Retention Policy
- **Leave requests**: Permanent (audit compliance)
- **Audit logs**: Permanent (compliance requirement)
- **User data**: Permanent while employee active

## Performance

### Database Optimization
- **Indexes**: 
  - Primary keys on all tables
  - Foreign keys indexed
  - Unique constraints indexed
  - `Approval.leaveId` indexed
  - `AuditLog.createdAt` indexed for time-based queries
- **Connection pooling**: Prisma handles connection pooling automatically

### Query Optimization
- **Pagination**: Cursor-based pagination for large result sets (where implemented)
- **Selective fields**: Only fetch required fields using Prisma `select`
- **Relations**: Use `include` judiciously to avoid N+1 queries

### Frontend Performance
- **Next.js optimizations**:
  - Server Components (reduce client bundle)
  - Turbopack for faster builds
  - React Compiler for automatic memoization
  - Code splitting (automatic via Next.js)
- **Caching**: 
  - SWR for client-side data caching
  - API routes: `cache: "no-store"` for dynamic data

## Operations

### Scheduled Jobs (Future)
- **Year-end automation**:
  - CL lapse (December 31)
  - EL carry-forward calculation
  - Balance record creation for new year
  - Summary emails
- **EL accrual**: Monthly accrual job (2 days/month per employee)
- **Current status**: Manual process (jobs not yet implemented)

### Timezone & Date Handling
- **Timezone**: Asia/Dhaka (Bangladesh Standard Time)
- **Storage**: All dates persisted as UTC ISO format
- **Display**: Converted to local timezone in UI
- **Weekends**: Friday and Saturday (non-working days)

### Policy Versioning
- **Implementation**: Every `LeaveRequest` stores `policyVersion` field (e.g., "v1.1")
- **Purpose**: Audit trail for policy changes
- **Benefits**: 
  - Historical accuracy (policy at time of request)
  - No retroactive policy changes
  - Compliance and auditability

### Configuration Management
- **Policy constants**: `lib/policy.ts` (version v1.1)
- **Organization settings**: `OrgSettings` table for configurable policies
- **Backdate settings**: Configurable via `orgSettings.allowBackdate`
- **Environment variables**: `.env` file for secrets and configuration

## Scalability Considerations

### Current Limitations
- **Single instance**: No horizontal scaling implemented
- **Session storage**: In-memory (not shared across instances)
- **File storage**: Local filesystem (not distributed)

### Future Enhancements
- **Redis**: For shared session storage (rate limiting already uses Redis)
- **CDN**: For static assets and file uploads
- **Load balancing**: Multiple application instances
- **Database replication**: Read replicas for scaling reads

## Monitoring & Observability

### Current Implementation
- **Audit logs**: Complete audit trail in database
- **Error logging**: Console logging
- **Request tracking**: Via audit logs

### Recommended Enhancements
- **APM**: Application Performance Monitoring (Sentry, New Relic, etc.)
- **Health checks**: `/api/health` endpoint
- **Metrics**: Request rates, error rates, response times
- **Alerts**: Automated alerts for critical errors

---

**Related Documentation**:
- **Security Headers**: See `proxy.ts`
- **Rate Limiting**: `lib/rateLimit.ts`
- **Authentication**: `lib/auth-jwt.ts`
- **Policy Constants**: `lib/policy.ts`
- **Database Schema**: [03-Database-Schema.md](./03-Database-Schema.md)
