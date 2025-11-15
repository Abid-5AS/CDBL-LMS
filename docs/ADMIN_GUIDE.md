# Admin Guide - CDBL Leave Management System

> System Architecture, Configuration, and Maintenance Guide

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Management](#database-management)
3. [Configuration](#configuration)
4. [User Management](#user-management)
5. [Holiday Management](#holiday-management)
6. [Maintenance Tasks](#maintenance-tasks)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Tuning](#performance-tuning)
9. [Security](#security)
10. [Monitoring](#monitoring)

---

## System Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- Framer Motion (animations)

**Backend:**
- Next.js API Routes
- Prisma ORM
- MySQL Database
- NextAuth.js (authentication)

**Infrastructure:**
- Node.js runtime
- Vercel/Custom hosting
- AWS S3 (file storage)
- Redis (caching - optional)

### Architecture Diagram

```
┌─────────────────┐
│   Client        │
│   Browser       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js       │
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│   (Server)      │
└────────┬────────┘
         │
         ├─────────┐
         │         │
         ▼         ▼
┌─────────────┐  ┌──────────┐
│  Prisma     │  │  S3      │
│  (ORM)      │  │  Files   │
└──────┬──────┘  └──────────┘
       │
       ▼
┌─────────────┐
│   MySQL     │
│   Database  │
└─────────────┘
```

### Database Schema

**Core Tables:**
- `User` - Employee/admin accounts
- `LeaveRequest` - All leave requests
- `Approval` - Approval workflow steps
- `Balance` - Leave balances by type/year
- `Holiday` - Company holidays
- `PolicyConfig` - Leave type configurations
- `LeaveComment` - Comments/discussions
- `LeaveVersion` - Modification history
- `EncashmentRequest` - Leave encashment requests
- `AuditLog` - System audit trail

**Key Relationships:**
```
User ──1:N── LeaveRequest
LeaveRequest ──1:N── Approval
User ──1:N── Balance
LeaveRequest ──1:N── LeaveComment
LeaveRequest ──1:N── LeaveVersion
LeaveRequest ──1:1── LeaveRequest (parent/extension)
```

---

## Database Management

### Connecting to Database

**Production:**
```bash
mysql -h production-db.mysql.database.azure.com -u admin@cdbl -p
```

**Development:**
```bash
mysql -h localhost -u root -p cdbl_leave_dev
```

### Prisma Commands

**Generate Client:**
```bash
npx prisma generate
```

**Run Migrations:**
```bash
npx prisma migrate deploy
```

**Create Migration:**
```bash
npx prisma migrate dev --name migration_name
```

**View Database:**
```bash
npx prisma studio
```

**Reset Database (DEV ONLY):**
```bash
npx prisma migrate reset
```

### Database Backup

**Manual Backup:**
```bash
mysqldump -h localhost -u root -p cdbl_leave_management > backup_$(date +%Y%m%d).sql
```

**Restore from Backup:**
```bash
mysql -h localhost -u root -p cdbl_leave_management < backup_20251115.sql
```

**Automated Backups:**
Set up daily cron job:
```bash
0 2 * * * /usr/local/bin/backup-cdbl-db.sh
```

---

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_leave_management"

# Authentication
NEXTAUTH_URL="https://leave.cdbl.com"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="cdbl-leave-documents"
AWS_REGION="ap-southeast-1"

# Email (optional)
EMAIL_SERVER="smtp://user:pass@smtp.gmail.com:587"
EMAIL_FROM="noreply@cdbl.com"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="production"
```

### Policy Configuration

Edit policy settings via database or admin panel:

```sql
-- View policy config
SELECT * FROM PolicyConfig;

-- Update casual leave max days
UPDATE PolicyConfig
SET maxDays = 14
WHERE leaveType = 'CASUAL';

-- Update accrual rate
UPDATE PolicyConfig
SET accrualRate = 2.0
WHERE leaveType = 'EARNED';
```

---

## User Management

### Creating Users

**Via Admin Panel:**
1. Login as admin
2. Navigate to Admin > Users
3. Click "Create User"
4. Fill in details
5. Assign role and department
6. Save

**Via Database:**
```sql
INSERT INTO User (
  name, email, empCode, role, department,
  joinDate, createdAt, updatedAt
) VALUES (
  'John Doe',
  'john.doe@cdbl.com',
  'EMP001',
  'EMPLOYEE',
  'Engineering',
  '2025-01-01',
  NOW(),
  NOW()
);
```

**Bulk Import:**
Create CSV file and use seed script:
```bash
npm run seed:users -- --file users.csv
```

### Resetting Passwords

```sql
-- Password is hashed, use application to reset
UPDATE User
SET password = NULL
WHERE email = 'user@cdbl.com';
```

User will be prompted to set new password on next login.

### Changing User Roles

```sql
UPDATE User
SET role = 'HR_ADMIN'
WHERE email = 'user@cdbl.com';
```

**Available Roles:**
- `EMPLOYEE`
- `DEPT_HEAD`
- `HR_ADMIN`
- `HR_HEAD`
- `CEO`
- `SYSTEM_ADMIN`

---

## Holiday Management

### Adding Holidays

**Via Admin Panel:**
1. Navigate to Admin > Holidays
2. Click "Add Holiday"
3. Enter date, name, and type
4. Mark as optional if needed
5. Save

**Via Database:**
```sql
INSERT INTO Holiday (date, name, isOptional)
VALUES
  ('2025-12-16', 'Victory Day', false),
  ('2025-12-25', 'Christmas', true);
```

**Bulk Import:**
```bash
npm run seed:holidays -- --year 2026
```

### Importing from CSV

Create CSV file (holidays.csv):
```csv
date,name,isOptional
2026-01-01,New Year's Day,false
2026-02-21,International Mother Language Day,false
2026-03-26,Independence Day,false
```

Import:
```bash
npm run import:holidays -- --file holidays.csv
```

---

## Maintenance Tasks

### Daily Tasks

**Monitor System Health:**
```bash
# Check database connections
npm run health:check

# View error logs
tail -f logs/error.log

# Check pending approvals
npm run stats:pending
```

**Clear Old Sessions:**
```sql
DELETE FROM Session WHERE expires < NOW();
```

### Weekly Tasks

**Audit Log Review:**
```sql
SELECT * FROM AuditLog
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY createdAt DESC;
```

**Balance Reconciliation:**
```bash
npm run reconcile:balances
```

### Monthly Tasks

**Process Accruals:**
```bash
npm run cron:monthly-accrual
```

**Generate Reports:**
```bash
npm run reports:monthly
```

**Database Optimization:**
```sql
OPTIMIZE TABLE LeaveRequest;
OPTIMIZE TABLE Approval;
ANALYZE TABLE User;
```

### Yearly Tasks

**Year-end Closing:**
```bash
npm run year-end:close -- --year 2025
```

**Carryforward Processing:**
```bash
npm run carryforward:process -- --year 2026
```

**Archive Old Data:**
```bash
npm run archive:leaves -- --year 2024
```

---

## Backup & Recovery

### Backup Strategy

**Full Backup (Daily):**
- Automated at 2 AM
- Retention: 30 days
- Location: `/backups/full/`

**Incremental Backup (Hourly):**
- Transaction logs
- Retention: 7 days
- Location: `/backups/incremental/`

**Document Backup (Continuous):**
- S3 versioning enabled
- Cross-region replication
- 90-day retention

### Manual Backup

```bash
# Full database backup
./scripts/backup-db.sh

# Backup with compression
mysqldump cdbl_leave_management | gzip > backup.sql.gz

# Backup specific tables
mysqldump cdbl_leave_management LeaveRequest Approval > leaves_backup.sql
```

### Recovery Procedures

**Full System Recovery:**
```bash
# 1. Stop application
pm2 stop cdbl-leave

# 2. Restore database
mysql cdbl_leave_management < backup.sql

# 3. Verify data integrity
npm run verify:data

# 4. Restart application
pm2 start cdbl-leave
```

**Point-in-Time Recovery:**
```bash
# Restore to specific timestamp
./scripts/restore-pitr.sh --timestamp "2025-11-15 14:30:00"
```

---

## Performance Tuning

### Database Optimization

**Add Indexes:**
```sql
CREATE INDEX idx_leave_status ON LeaveRequest(status, requesterId);
CREATE INDEX idx_approval_pending ON Approval(decision, leaveId);
CREATE INDEX idx_user_role ON User(role, department);
```

**Query Optimization:**
```sql
-- Use EXPLAIN to analyze slow queries
EXPLAIN SELECT * FROM LeaveRequest WHERE status = 'PENDING';

-- Add covering index for common queries
CREATE INDEX idx_leave_dates ON LeaveRequest(startDate, endDate, status);
```

### Application Performance

**Enable Caching:**
```typescript
// config/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheHolidays() {
  const holidays = await prisma.holiday.findMany();
  await redis.set('holidays', JSON.stringify(holidays), 'EX', 86400);
}
```

**Optimize Bundle Size:**
```bash
# Analyze bundle
npm run build && npm run analyze

# Tree-shake unused code
# Enable in next.config.js:
swcMinify: true
```

### Server Configuration

**PM2 Cluster Mode:**
```bash
pm2 start ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cdbl-leave',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

---

## Security

### Security Checklist

- [ ] HTTPS enabled
- [ ] Database credentials encrypted
- [ ] API rate limiting active
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload validation
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Audit logging enabled

### Access Control

**Role-Based Permissions:**
```typescript
// lib/permissions.ts
export const permissions = {
  EMPLOYEE: ['read:own', 'create:leave', 'cancel:own'],
  DEPT_HEAD: ['read:team', 'approve:leave'],
  HR_ADMIN: ['read:all', 'approve:leave', 'modify:balance'],
  HR_HEAD: ['read:all', 'approve:all', 'config:policy'],
  CEO: ['*'],
};
```

### Security Monitoring

**Check Failed Login Attempts:**
```sql
SELECT email, COUNT(*) as attempts
FROM AuditLog
WHERE action = 'LOGIN_FAILED'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY email
HAVING attempts > 5;
```

**Review Privilege Escalations:**
```sql
SELECT * FROM AuditLog
WHERE action = 'ROLE_CHANGED'
ORDER BY createdAt DESC
LIMIT 50;
```

---

## Monitoring

### Application Monitoring

**Health Check Endpoint:**
```bash
curl https://leave.cdbl.com/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123456,
  "memory": {
    "used": "245MB",
    "total": "512MB"
  }
}
```

### Performance Metrics

**Key Metrics to Monitor:**
- Response time (avg < 200ms)
- Error rate (< 0.1%)
- Database query time (avg < 50ms)
- CPU usage (< 70%)
- Memory usage (< 80%)
- Disk space (> 20% free)

**Monitoring Tools:**
- Application: PM2, New Relic, or Datadog
- Database: MySQL Workbench, Percona Monitoring
- Logs: ELK Stack or Splunk

### Alerting

**Set up alerts for:**
- Application downtime
- High error rates
- Database connection failures
- Disk space < 10%
- Unusual login patterns
- Failed backup jobs

---

## Troubleshooting Common Issues

### Database Connection Lost

```bash
# Check MySQL status
systemctl status mysql

# Restart if needed
systemctl restart mysql

# Check connections
SHOW PROCESSLIST;
```

### Application Won't Start

```bash
# Check logs
pm2 logs cdbl-leave

# Check environment variables
pm2 env 0

# Rebuild and restart
npm run build && pm2 restart cdbl-leave
```

### Slow Performance

```bash
# Check database slow query log
tail -f /var/log/mysql/slow-query.log

# Analyze queries
npm run analyze:queries

# Clear cache
redis-cli FLUSHALL
```

---

## Support Contacts

- **Database Admin:** dba@cdbl.com
- **System Admin:** sysadmin@cdbl.com
- **Development Team:** dev-team@cdbl.com
- **Emergency Hotline:** +880-XXXX-XXXXXX

---

*Last Updated: November 15, 2025*
