# 2-Factor Authentication (2FA) Setup Guide

## Overview

CDBL-LMS now includes **email-based 2-Factor Authentication (2FA)** for enhanced security. Every login requires:
1. Email & Password verification
2. 6-digit OTP code sent via email

---

## ✅ Features

- 🔐 **Secure OTP Generation**: 6-digit codes with 10-minute expiry
- ✉️ **Email Delivery**: Professional HTML email templates
- ⏱️ **Countdown Timer**: Real-time expiry countdown in UI
- 🔄 **Resend Functionality**: Request new codes after 1 minute
- 🚫 **Rate Limiting**: Protection against brute force attacks
- 📊 **Audit Logging**: All login attempts logged with 2FA status
- 🎨 **Beautiful UI**: Smooth animations and responsive design

---

## 📋 Prerequisites

Before setting up 2FA, ensure you have:

1. **Database Access**: MySQL database configured
2. **Email SMTP Server**: Gmail, SendGrid, AWS SES, or any SMTP provider
3. **Environment Variables**: Properly configured `.env` file

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Apply the OTP table migration to your database:

```bash
# Option 1: Using Prisma (Recommended)
npx prisma migrate deploy

# Option 2: Manual SQL (if Prisma fails)
# Execute the SQL file directly on your MySQL database
mysql -u username -p database_name < prisma/migrations/add_2fa_otp/migration.sql
```

This creates the `OtpCode` table with the following structure:
- `id`: Primary key
- `userId`: User ID reference
- `email`: Email address
- `code`: 6-digit OTP code
- `expiresAt`: Expiration timestamp (10 minutes)
- `verified`: Boolean flag for used codes
- `attempts`: Failed verification attempts (max 3)
- `ipAddress`: Security tracking
- `createdAt`: Generation timestamp

### Step 2: Configure Email Settings

Copy `.env.example` to `.env` and configure email settings:

```bash
cp .env.example .env
```

#### For Gmail (Most Common):

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="CDBL LMS <noreply@cdbl.com>"
```

**⚠️ Important for Gmail:**
1. Enable 2-Step Verification on your Google Account
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the generated 16-character password (NOT your regular password)

#### For Other SMTP Providers:

**SendGrid:**
```env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="your-sendgrid-api-key"
```

**AWS SES:**
```env
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_PORT="587"
EMAIL_USER="your-aws-smtp-username"
EMAIL_PASSWORD="your-aws-smtp-password"
```

**Office 365:**
```env
EMAIL_HOST="smtp.office365.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@yourcompany.com"
EMAIL_PASSWORD="your-password"
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Test Email Configuration

Create a simple test script (`scripts/test-email.ts`):

```typescript
import { sendOtpEmail } from "@/lib/email";

async function testEmail() {
  const result = await sendOtpEmail(
    "test@example.com",
    "123456",
    "Test User"
  );
  console.log(result ? "✅ Email sent!" : "❌ Email failed!");
}

testEmail();
```

Run it:
```bash
npx tsx scripts/test-email.ts
```

### Step 5: Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000/login and test the 2FA flow!

---

## 🔐 Security Features

### OTP Code Security

- **6 digits**: Balance between security and usability
- **10-minute expiry**: Short enough to prevent misuse
- **Single use**: Codes are invalidated after verification
- **3 attempt limit**: Protection against brute force
- **IP tracking**: Audit trail for security monitoring

### Rate Limiting

The system includes built-in rate limiting:
- **Login attempts**: Limited per IP address
- **OTP generation**: Prevents spam
- **Resend cooldown**: 1-minute wait between resends

### Audit Logging

All 2FA events are logged to `AuditLog`:
```json
{
  "action": "LOGIN",
  "actorEmail": "user@cdbl.com",
  "details": {
    "ip": "192.168.1.1",
    "role": "EMPLOYEE",
    "twoFactor": true
  }
}
```

---

## 📱 User Experience Flow

### Step 1: Email & Password

<img src="https://placehold.co/600x400/3b82f6/ffffff?text=Login+Screen" alt="Login Screen" />

User enters email and password, clicks "Sign In"

### Step 2: OTP Sent

<img src="https://placehold.co/600x400/10b981/ffffff?text=OTP+Sent" alt="OTP Sent" />

Success toast shows "Verification code sent to your email!"

### Step 3: Email Received

User receives a beautiful HTML email with:
- CDBL branding
- 6-digit code in large, clear font
- Expiry warning (10 minutes)
- Security notice

### Step 4: OTP Verification

<img src="https://placehold.co/600x400/8b5cf6/ffffff?text=OTP+Input" alt="OTP Input" />

- Countdown timer shows remaining time
- "Resend Code" button available after 1 minute
- "Back to Login" option
- Auto-disabled submit until 6 digits entered

### Step 5: Success

<img src="https://placehold.co/600x400/16a34a/ffffff?text=Login+Success" alt="Login Success" />

User redirected to role-based dashboard

---

## 🛠️ API Endpoints

### POST `/api/login`

**Request:**
```json
{
  "email": "user@cdbl.com",
  "password": "password123"
}
```

**Response (2FA Enabled):**
```json
{
  "ok": true,
  "requiresOtp": true,
  "userId": 123,
  "email": "user@cdbl.com",
  "expiresIn": 600
}
```

### POST `/api/auth/verify-otp`

**Request:**
```json
{
  "email": "user@cdbl.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "user@cdbl.com",
    "role": "EMPLOYEE"
  }
}
```

**Response (Invalid Code):**
```json
{
  "error": "Invalid code. 2 attempts remaining."
}
```

### POST `/api/auth/resend-otp`

**Request:**
```json
{
  "email": "user@cdbl.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "New verification code sent",
  "expiresIn": 600
}
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with correct email/password
- [ ] Receive OTP email within 30 seconds
- [ ] Enter correct OTP → successful login
- [ ] Enter incorrect OTP → error message + remaining attempts
- [ ] Wait for OTP to expire → "expired" error
- [ ] Click "Resend Code" → new OTP received
- [ ] Test rate limiting (try 10 rapid logins)
- [ ] Check audit logs for 2FA entries
- [ ] Test "Back to Login" button
- [ ] Verify countdown timer works correctly

### Automated Testing

Create tests in `tests/integration/2fa.test.ts`:

```typescript
describe("2FA Flow", () => {
  it("should send OTP after password verification", async () => {
    // Test implementation
  });

  it("should verify valid OTP and create session", async () => {
    // Test implementation
  });

  it("should reject expired OTP", async () => {
    // Test implementation
  });
});
```

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem**: OTP email not received

**Solutions**:
1. Check email credentials in `.env`
2. For Gmail: Ensure App Password is used (not regular password)
3. Check spam/junk folder
4. Verify SMTP port (587 for TLS, 465 for SSL)
5. Check server logs: `console.log` in `lib/email.ts`
6. Test with `npx tsx scripts/test-email.ts`

### Prisma Migration Fails

**Problem**: `npx prisma migrate dev` fails

**Solution**:
Run the SQL manually:
```bash
mysql -u root -p cdbl_lms < prisma/migrations/add_2fa_otp/migration.sql
```

### OTP Expired Immediately

**Problem**: OTP shows as expired right away

**Solution**:
Check server time synchronization:
```bash
date  # Should match your local time
timedatectl  # Check timezone settings
```

### Rate Limiting Too Aggressive

**Problem**: Users locked out after few attempts

**Solution**:
Adjust rate limiting in `lib/rateLimit.ts`:
```typescript
const MAX_ATTEMPTS = 10;  // Increase from 5
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
```

---

## 🔧 Customization

### Change OTP Expiry Time

Edit `lib/otp.ts`:
```typescript
const OTP_EXPIRY_MINUTES = 15;  // Change from 10 to 15
```

### Change OTP Length

Edit `lib/otp.ts`:
```typescript
const OTP_LENGTH = 8;  // Change from 6 to 8
export function generateOtpCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
```

### Customize Email Template

Edit `lib/email.ts` → `getOtpEmailTemplate()` function

### Disable 2FA (Development Only)

To temporarily disable 2FA in development, comment out OTP logic in `/app/api/login/route.ts`:

```typescript
// Skip OTP in development
if (process.env.NODE_ENV === "development") {
  // ... create JWT session immediately
}
```

---

## 📊 Database Cleanup

OTP codes are automatically cleaned up, but you can run manual cleanup:

```typescript
// In a cron job or scheduled task
import { cleanupExpiredOtpCodes } from "@/lib/otp";

// Delete expired/used OTP codes
const deleted = await cleanupExpiredOtpCodes();
console.log(`Cleaned up ${deleted} expired OTP codes`);
```

Add to `scripts/cleanup-otp.ts` and run daily:
```bash
0 0 * * * cd /path/to/cdbl-lms && npx tsx scripts/cleanup-otp.ts
```

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Use production email provider (not personal Gmail)
- [ ] Enable SSL/TLS on SMTP connection
- [ ] Set up email monitoring/alerting
- [ ] Test email deliverability to all domains
- [ ] Configure proper email sender reputation (SPF, DKIM, DMARC)
- [ ] Set up rate limiting with Redis (not in-memory)
- [ ] Enable database connection pooling
- [ ] Monitor OTP verification success rate
- [ ] Set up alerts for high failure rates
- [ ] Review audit logs regularly
- [ ] Implement IP-based blocking for suspicious activity

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [OWASP 2FA Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 🆘 Support

If you encounter issues:

1. Check this guide thoroughly
2. Review server logs
3. Test email configuration separately
4. Verify database migration succeeded
5. Check environment variables are loaded
6. Contact CDBL IT support team

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Author**: Claude (Anthropic AI)
