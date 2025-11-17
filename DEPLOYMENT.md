# CDBL LMS Deployment Guide

This guide covers deploying the CDBL Leave Management System for external hosting with both web and React Native mobile apps.

## Architecture Overview

The system consists of:
- **Next.js Web Application**: Frontend + Backend API (hosted externally)
- **React Native Mobile App**: iOS and Android apps connecting to the external backend
- **MySQL Database**: Hosted externally
- **Redis** (optional): For caching and rate limiting

## New Approval Workflow (Updated 2025-11-17)

The approval flow has been updated to:

### Regular Employees:
```
Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD (Final Approval)
```

### Department Heads:
```
DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO (Final Approval)
```

### Partial Cancellation:
- Employees can request partial cancellation of approved leaves
- Partial cancellation requests follow the same approval flow as new leave requests
- Past days are locked (already taken), only future days can be cancelled
- Once approved, balance is restored for the cancelled days

## Prerequisites

### Required:
- Node.js 20.x or higher
- MySQL 8.0 or higher
- Domain name with SSL certificate
- Email SMTP server (for notifications)

### Optional:
- Redis server (for caching)
- CDN for static assets

## Web Application Deployment

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="mysql://user:password@your-mysql-host:3306/cdbl_lms"

# Application URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"

# Security
JWT_SECRET="your-secure-random-string-min-32-chars"

# Email (for notifications)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@your-domain.com"

# CORS (include mobile app origin if needed)
ALLOWED_ORIGINS="https://your-domain.com"

# Features
ENABLE_2FA="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
```

### 2. Database Migration

Run Prisma migrations to set up the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed
```

### 3. Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### 4. Hosting Options

#### Option A: Vercel (Recommended for Next.js)
1. Connect your Git repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push

#### Option B: Traditional Hosting (VPS, AWS, etc.)
1. Use PM2 or similar process manager
2. Set up Nginx as reverse proxy
3. Configure SSL certificates

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "cdbl-lms" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Example Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## React Native Mobile App Deployment

### 1. Environment Configuration

Copy `mobile/companion-app/.env.example` to `mobile/companion-app/.env`:

```bash
# Backend API URL (your deployed web app)
EXPO_PUBLIC_API_URL="https://your-domain.com"

# AI Features (optional)
EXPO_PUBLIC_GEMINI_API_KEY="your-api-key"

# Environment
EXPO_PUBLIC_ENV="production"
```

### 2. Update app.json

Update `mobile/companion-app/app.json` with your app details:

```json
{
  "expo": {
    "name": "CDBL LMS",
    "slug": "cdbl-lms",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "cdbl-lms",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.cdbllms"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.cdbllms"
    }
  }
}
```

### 3. Build for Production

```bash
cd mobile/companion-app

# Install dependencies
npm install

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

### 4. Publish to App Stores

#### iOS (App Store):
1. Create an Apple Developer account
2. Configure App Store Connect
3. Upload build via Transporter or eas submit
4. Complete app review process

#### Android (Google Play):
1. Create a Google Play Developer account
2. Create app listing
3. Upload APK/AAB via eas submit
4. Complete review process

## Database Schema Migration

The new schema includes fields for partial cancellation approval flow:

### New Fields in LeaveRequest:
- `isCancellationRequest`: Boolean flag for cancellation requests
- `isPartialCancellation`: Boolean flag for partial cancellation
- `originalEndDate`: Stores original end date before partial cancellation
- `cancellationReason`: Reason for cancellation

### Migration Script:

Run this after deploying the new code:

```bash
npx prisma migrate deploy
```

If you need to create a migration manually:

```bash
npx prisma migrate dev --name add_partial_cancellation_fields
```

## Post-Deployment Checklist

### Web Application:
- [ ] Verify database connection
- [ ] Test email notifications
- [ ] Verify SSL certificate is working
- [ ] Test authentication (login/logout)
- [ ] Test leave application flow
- [ ] Test new approval workflow (Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD)
- [ ] Test dept head approval flow (DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO)
- [ ] Test partial cancellation approval flow
- [ ] Verify CORS headers for mobile app

### Mobile Application:
- [ ] Test API connection to backend
- [ ] Test authentication
- [ ] Test leave submission
- [ ] Test approval actions
- [ ] Test partial cancellation
- [ ] Test offline mode and sync
- [ ] Test push notifications (if configured)

## Monitoring and Maintenance

### Logging:
- Application logs are in console (use PM2 logs or hosting provider logs)
- Database queries logged by Prisma
- Audit logs stored in `AuditLog` table

### Backups:
```bash
# Database backup
mysqldump -u user -p cdbl_lms > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u user -p cdbl_lms < backup_20250117.sql
```

### Health Checks:
- Web app: `https://your-domain.com/api/health` (create this endpoint)
- Database: Monitor connection pool and query performance
- Mobile app: Monitor crash reports via Expo/Firebase

## Troubleshooting

### Common Issues:

1. **Mobile app can't connect to backend**:
   - Verify EXPO_PUBLIC_API_URL is correct
   - Check CORS headers in next.config.ts
   - Ensure SSL certificate is valid

2. **Database connection errors**:
   - Verify DATABASE_URL format
   - Check database firewall rules
   - Ensure database server is running

3. **Approval flow not working**:
   - Check user roles in database
   - Verify approval chain in lib/workflow.ts
   - Check approval records in database

4. **Email notifications not sending**:
   - Verify SMTP configuration
   - Check email server firewall
   - Test with a simple SMTP client

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **JWT Secrets**: Use strong, randomly generated secrets
3. **Database**: Use SSL/TLS for database connections in production
4. **CORS**: Restrict ALLOWED_ORIGINS to your domains only
5. **Rate Limiting**: Consider implementing API rate limiting
6. **File Uploads**: Validate file types and sizes
7. **SQL Injection**: Prisma protects against SQL injection by default
8. **XSS**: React/Next.js escapes output by default

## Support

For issues or questions:
- Check application logs
- Review audit logs in database
- Contact development team
