# 2-Factor Authentication (2FA) Setup Guide

**Version:** 1.0
**Last Updated:** January 2025
**Security Level:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Production Checklist](#production-checklist)

---

## Overview

CDBL-LMS implements **email-based 2-Factor Authentication (2FA)** to provide an additional layer of security beyond username and password authentication.

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login Page
    participant API as API Server
    participant E as Email Service
    participant DB as Database

    U->>L: Enter Email & Password
    L->>API: POST /api/login
    API->>DB: Validate Credentials
    DB-->>API: User Valid
    API->>DB: Generate & Store OTP
    API->>E: Send OTP Email
    E-->>U: Email with 6-digit OTP
    API-->>L: requiresOtp: true
    L->>U: Show OTP Input Screen
    U->>L: Enter OTP Code
    L->>API: POST /api/auth/verify-otp
    API->>DB: Verify OTP
    DB-->>API: OTP Valid
    API->>DB: Mark OTP as Used
    API->>API: Generate JWT
    API-->>L: Set JWT Cookie
    L->>L: Redirect to Dashboard
```

### Security Benefits

- **Phishing Protection**: Even if password is compromised, attacker needs access to user's email
- **Brute Force Protection**: OTP expires in 10 minutes with 3-attempt limit
- **Audit Trail**: All authentication attempts logged with IP addresses
- **Compliance**: Meets security requirements for sensitive employee data

---

## Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **OTP Generation** | Secure 6-digit codes | ✅ Implemented |
| **Email Delivery** | Professional HTML email templates | ✅ Implemented |
| **Expiry Management** | 10-minute expiration with countdown | ✅ Implemented |
| **Resend Functionality** | Request new code after 1 minute | ✅ Implemented |
| **Rate Limiting** | Protection against abuse | ✅ Implemented |
| **Attempt Tracking** | Max 3 failed attempts per code | ✅ Implemented |
| **IP Logging** | Security audit trail | ✅ Implemented |
| **Responsive UI** | Works on all devices | ✅ Implemented |

### User Experience Features

- 🎨 **Beautiful UI**: Smooth animations and modern design
- ⏱️ **Live Countdown**: Real-time expiry timer
- 📧 **Email Preview**: Professional branded emails
- 🔄 **Smart Resend**: Disabled during cooldown period
- ↩️ **Back Navigation**: Easy return to login
- ⌨️ **Auto-focus**: Streamlined input experience

---

## Prerequisites

Before setting up 2FA, ensure the following:

### System Requirements

- **Node.js**: 18.x or higher
- **Database**: MySQL 8.0+ or compatible
- **Email Provider**: SMTP-compatible email service

### Required Access

- Database administrator credentials
- Email service credentials (SMTP)
- Application environment configuration access

### Supported Email Providers

| Provider | Port | Authentication | Notes |
|----------|------|----------------|-------|
| **Gmail** | 587 (TLS) | App Password required | Requires 2-Step Verification enabled |
| **SendGrid** | 587 (TLS) | API Key | Best for production |
| **AWS SES** | 587 (TLS) | SMTP Credentials | Best for AWS infrastructure |
| **Office 365** | 587 (TLS) | Username & Password | Corporate email systems |
| **Custom SMTP** | Varies | Varies | Any SMTP-compliant server |

---

## Installation

### Step 1: Database Migration

The 2FA feature requires a new `OtpCode` table. Run the migration:

**Option 1: Using Prisma (Recommended)**
```bash
npx prisma migrate deploy
```

**Option 2: Generate Migration**
```bash
npx prisma migrate dev --name add_otp_table
```

**Option 3: Manual SQL**

If Prisma migrations fail, execute the SQL manually:

```bash
mysql -u root -p cdbl_lms < prisma/migrations/[migration_folder]/migration.sql
```

### Database Schema

The migration creates the following table:

```sql
CREATE TABLE `OtpCode` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `verified` BOOLEAN NOT NULL DEFAULT false,
  `attempts` INT NOT NULL DEFAULT 0,
  `ipAddress` VARCHAR(45),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `OtpCode_userId_idx` (`userId`),
  INDEX `OtpCode_email_idx` (`email`),
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Table Description:**
- `id`: Primary key
- `userId`: Reference to User table
- `email`: User's email address
- `code`: 6-digit OTP code
- `expiresAt`: Expiration timestamp (10 minutes from creation)
- `verified`: Flag indicating if code was successfully used
- `attempts`: Count of failed verification attempts (max 3)
- `ipAddress`: IP address of login attempt (security tracking)
- `createdAt`: OTP generation timestamp

### Step 2: Install Dependencies

All required dependencies should already be installed. Verify:

```bash
npm list nodemailer
```

If not installed:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 3: Generate Prisma Client

After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

This updates the Prisma Client with the new `OtpCode` model.

---

## Configuration

### Environment Variables

Create or update `.env` file with email configuration:

```bash
# Copy example file if starting fresh
cp .env.example .env
```

### Gmail Configuration

**Steps:**
1. Go to Google Account settings: https://myaccount.google.com
2. Enable "2-Step Verification"
3. Navigate to "App passwords": https://myaccount.google.com/apppasswords
4. Generate new app password
5. Use the 16-character password in `.env`

```env
# Email Configuration (Gmail)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # App-specific password (16 chars)
EMAIL_FROM="CDBL LMS <noreply@cdbl.com>"
EMAIL_SECURE="false"  # false for port 587 (STARTTLS)
```

⚠️ **Important:** Never use your regular Gmail password. Always use App Passwords.

### SendGrid Configuration

**Best for production use**

```env
# Email Configuration (SendGrid)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"  # Literally the word "apikey"
EMAIL_PASSWORD="SG.xxxxx..."  # Your SendGrid API key
EMAIL_FROM="CDBL LMS <noreply@cdbl.com>"
EMAIL_SECURE="false"
```

**Setup Steps:**
1. Create SendGrid account: https://sendgrid.com
2. Verify sender domain or email
3. Generate API key with "Mail Send" permissions
4. Use API key as password

### AWS SES Configuration

**Best for AWS-hosted applications**

```env
# Email Configuration (AWS SES)
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"  # Region-specific
EMAIL_PORT="587"
EMAIL_USER="AKIAIOSFODNN7EXAMPLE"  # SMTP username
EMAIL_PASSWORD="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # SMTP password
EMAIL_FROM="CDBL LMS <noreply@cdbl.com>"
EMAIL_SECURE="false"
```

**Setup Steps:**
1. Verify email/domain in AWS SES console
2. Create SMTP credentials in SES settings
3. Note the region-specific SMTP endpoint
4. Start in SES Sandbox mode, then request production access

### Office 365 Configuration

```env
# Email Configuration (Office 365)
EMAIL_HOST="smtp.office365.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@yourcompany.com"
EMAIL_PASSWORD="your-password"
EMAIL_FROM="CDBL LMS <your-email@yourcompany.com>"
EMAIL_SECURE="false"
```

### Configuration Validation

Verify your configuration with the email test script:

```typescript
// scripts/test-email.ts
import { sendOtpEmail } from '@/lib/email';

async function testEmail() {
  console.log('Testing email configuration...');

  const result = await sendOtpEmail(
    'test@example.com',
    '123456',
    'Test User'
  );

  if (result) {
    console.log('✅ Email sent successfully!');
  } else {
    console.error('❌ Email failed to send');
  }
}

testEmail();
```

Run the test:

```bash
npx tsx scripts/test-email.ts
```

---

## Testing

### Manual Testing Procedure

Follow this checklist to verify 2FA functionality:

#### 1. Login with Valid Credentials

- [ ] Navigate to `/login`
- [ ] Enter valid email and password
- [ ] Click "Sign In"
- [ ] Verify success message: "Verification code sent to your email!"
- [ ] Verify redirect to OTP verification screen

#### 2. Email Delivery

- [ ] Check email inbox (and spam folder)
- [ ] Verify email received within 30 seconds
- [ ] Verify email contains:
  - CDBL branding
  - 6-digit code in large font
  - Expiry warning (10 minutes)
  - Security notice

#### 3. OTP Verification - Success Case

- [ ] Enter correct 6-digit OTP
- [ ] Verify submit button enabled
- [ ] Click "Verify Code"
- [ ] Verify successful login
- [ ] Verify redirect to appropriate dashboard

#### 4. OTP Verification - Failure Cases

- [ ] **Wrong Code:** Enter incorrect OTP
  - Verify error message shows
  - Verify attempts remaining shown (2 remaining)
- [ ] **Second Wrong Code:** Enter incorrect OTP again
  - Verify error shows "1 attempt remaining"
- [ ] **Third Wrong Code:** Enter incorrect OTP third time
  - Verify OTP invalidated
  - Verify error: "Too many failed attempts"

#### 5. OTP Expiry

- [ ] Wait for countdown to reach 0:00
- [ ] Try to submit expired OTP
- [ ] Verify error: "Verification code has expired"
- [ ] Verify "Resend Code" button enabled

#### 6. Resend Functionality

- [ ] Click "Resend Code"
- [ ] Verify success message
- [ ] Check email for new code
- [ ] Verify new code works
- [ ] Verify old code no longer works

#### 7. Rate Limiting

- [ ] Try to resend code immediately after first resend
- [ ] Verify button disabled with countdown
- [ ] Wait 60 seconds
- [ ] Verify button re-enabled

#### 8. Back Navigation

- [ ] Click "Back to Login"
- [ ] Verify return to login screen
- [ ] Verify form state cleared

#### 9. Audit Logging

- [ ] Log in as admin
- [ ] Navigate to Audit Logs
- [ ] Verify `LOGIN` action logged with:
  - Actor email
  - IP address
  - Role
  - `twoFactor: true` in details

### Automated Testing

Create integration tests in `tests/auth/2fa.test.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('2FA Authentication Flow', () => {

  test('should send OTP after password verification', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cdbl.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*verify-otp/);
    await expect(page.locator('text=Verification code sent')).toBeVisible();
  });

  test('should verify valid OTP and redirect to dashboard', async ({ page }) => {
    // Test implementation
  });

  test('should reject expired OTP', async ({ page }) => {
    // Test implementation
  });

  test('should enforce 3-attempt limit', async ({ page }) => {
    // Test implementation
  });

  test('should allow OTP resend after cooldown', async ({ page }) => {
    // Test implementation
  });

});
```

Run tests:

```bash
npm run test:e2e
```

---

## Security Considerations

### OTP Security

**Code Generation:**
- 6 digits (1 million combinations)
- Cryptographically random using `Math.random()` * 900000 + 100000
- Unique per user per session

**Expiration:**
- 10-minute validity window
- Automatic cleanup of expired codes
- Cannot be reused after verification

**Attempt Limiting:**
- Maximum 3 verification attempts per code
- Code invalidated after 3 failures
- Forces new OTP request

**IP Tracking:**
- All login attempts logged with IP address
- Enables security auditing
- Detects suspicious login patterns

### Email Security

**Content Security:**
- HTML email with text fallback
- No sensitive information in email beyond OTP
- Clear expiration warning

**Sender Authentication:**
- SPF records recommended
- DKIM signing recommended
- DMARC policy recommended

### Rate Limiting

**Login Endpoint:**
- 5 attempts per 15 minutes per IP
- Prevents brute force attacks
- Automatic reset after window

**OTP Resend:**
- 1-minute cooldown between requests
- Maximum 3 resends per 15 minutes
- Prevents email flooding

### Database Security

**OTP Storage:**
- Stored in plain text (needed for verification)
- Automatically deleted after verification
- Expired codes cleaned up regularly

**Cleanup Strategy:**
```typescript
// Run daily via cron
import { cleanupExpiredOtpCodes } from '@/lib/otp';

const deleted = await cleanupExpiredOtpCodes();
console.log(`Cleaned up ${deleted} expired OTP codes`);
```

---

## Troubleshooting

### Email Not Sending

**Symptom:** OTP email not received

**Diagnosis:**
1. Check server logs for email errors
2. Verify `.env` configuration loaded
3. Test SMTP connection manually
4. Check email provider rate limits

**Solutions:**

**Gmail Issues:**
```bash
# Verify app password format (no spaces)
EMAIL_PASSWORD="abcdefghijklmnop"

# Check 2-Step Verification enabled
# Regenerate app password if needed
```

**SendGrid Issues:**
```bash
# Verify sender email/domain verified in SendGrid
# Check SendGrid activity logs for delivery status
# Verify API key has "Mail Send" permission
```

**AWS SES Issues:**
```bash
# Check if still in Sandbox mode (only verified emails)
# Verify sender email in SES console
# Check SES region matches SMTP endpoint
# Review SES sending statistics for bounces
```

**General SMTP Issues:**
```bash
# Test SMTP connection manually
telnet smtp.gmail.com 587

# Check firewall rules
# Verify port 587 or 465 not blocked
```

### Prisma Migration Fails

**Symptom:** `npx prisma migrate deploy` fails

**Solution 1: Check Database Connection**
```bash
# Test database connection
npx prisma db pull
```

**Solution 2: Manual SQL Execution**
```bash
# Find migration SQL file
ls -la prisma/migrations/

# Execute manually
mysql -u root -p cdbl_lms < prisma/migrations/[timestamp]_add_otp_table/migration.sql

# Mark as applied in Prisma
npx prisma migrate resolve --applied [migration_name]
```

### OTP Expires Immediately

**Symptom:** OTP shows as expired right after generation

**Diagnosis:** Server time mismatch

**Solution:**
```bash
# Check server time
date

# Check timezone
timedatectl

# Synchronize time (Linux)
sudo ntpdate -s time.nist.gov

# Or use systemd-timesyncd
sudo timedatectl set-ntp true
```

### Rate Limiting Too Aggressive

**Symptom:** Users locked out after few attempts

**Solution:** Adjust rate limiting in `lib/rateLimit.ts`

```typescript
// Before
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes

// After (more lenient)
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
```

### OTP Not Invalidating After Use

**Symptom:** Same OTP can be used multiple times

**Diagnosis:** Database update failing

**Solution:**
```typescript
// Check OTP verification logic in lib/otp.ts
await prisma.otpCode.update({
  where: { id: otp.id },
  data: { verified: true }
});
```

---

## Production Checklist

Before deploying to production, complete this checklist:

### Email Configuration

- [ ] Use production-grade email service (SendGrid, AWS SES, not personal Gmail)
- [ ] Configure sender domain authentication (SPF, DKIM, DMARC)
- [ ] Verify sender email/domain with provider
- [ ] Set up email monitoring and alerts
- [ ] Test deliverability to all major email providers
- [ ] Configure proper sender name and reply-to address
- [ ] Set up email templates with company branding

### Security Configuration

- [ ] Generate strong `JWT_SECRET` (minimum 32 characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set `NODE_ENV=production`
- [ ] Enable secure cookie flags
- [ ] Configure CORS for production domain
- [ ] Review and adjust rate limits
- [ ] Set up IP-based blocking for suspicious activity

### Database

- [ ] Run all migrations on production database
- [ ] Verify `OtpCode` table created successfully
- [ ] Set up automated OTP cleanup job (daily cron)
- [ ] Configure database backups
- [ ] Set up database connection pooling

### Monitoring

- [ ] Monitor OTP generation rate
- [ ] Track OTP verification success rate
- [ ] Set up alerts for high failure rates
- [ ] Monitor email delivery rates
- [ ] Review audit logs regularly
- [ ] Set up error tracking (Sentry, etc.)

### Testing

- [ ] Complete all manual testing procedures
- [ ] Run automated test suite
- [ ] Test with production email provider
- [ ] Verify emails across different clients (Gmail, Outlook, etc.)
- [ ] Test rate limiting behavior
- [ ] Verify audit logging working

### Documentation

- [ ] Document email provider setup for team
- [ ] Create runbook for common issues
- [ ] Document escalation procedures
- [ ] Update user-facing documentation

### Backup Plan

- [ ] Document how to disable 2FA in emergency
- [ ] Create bypass mechanism for admin recovery
- [ ] Set up alternate authentication method
- [ ] Document rollback procedure

---

## Customization

### Change OTP Expiry Time

Edit `lib/otp.ts`:

```typescript
// Before
const OTP_EXPIRY_MINUTES = 10;

// After (15 minutes)
const OTP_EXPIRY_MINUTES = 15;
```

### Change OTP Length

Edit `lib/otp.ts`:

```typescript
// Before (6 digits)
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// After (8 digits)
export function generateOtpCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
```

### Customize Email Template

Edit `lib/email.ts` → `getOtpEmailTemplate()` function:

```typescript
function getOtpEmailTemplate(code: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Custom CSS here */
        </style>
      </head>
      <body>
        <!-- Custom HTML here -->
        <h1>Your verification code: ${code}</h1>
      </body>
    </html>
  `;
}
```

### Disable 2FA (Development Only)

To temporarily disable 2FA in development:

```typescript
// app/api/login/route.ts

// Add after password verification
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_2FA === 'true') {
  // Skip OTP, create JWT session immediately
  const token = signJWT({ userId: user.id, email: user.email });
  // ... set cookies and return user
}
```

Then in `.env.local`:
```env
DISABLE_2FA=true
```

⚠️ **Warning:** Never disable 2FA in production.

---

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP Setup](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [OWASP 2FA Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## Support

If you encounter issues not covered in this guide:

1. Review this documentation thoroughly
2. Check server logs for detailed error messages
3. Test email configuration separately using test script
4. Verify all environment variables are loaded correctly
5. Check database migration succeeded
6. Review audit logs for authentication patterns
7. Contact CDBL IT support team with:
   - Error messages from logs
   - Steps to reproduce
   - Email provider being used
   - Server environment details

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Author:** CDBL Development Team
**Security Review:** Pending
