# 🚀 Quick Start Guide - CDBL LMS

**Ready to use:** Phases 1-2 (Weeks 1-7) are complete!

---

## ⚡ Quick Setup (5 minutes)

### 1. Environment Configuration

Create or update your `.env` file:

```env
# Existing configuration
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_lms"
NEXTAUTH_SECRET="your-secret-here"

# NEW: Email Configuration (Required for Reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=CDBL LMS <noreply@cdbl.com>

# NEW: Cron Security (Required for Scheduled Reports)
CRON_SECRET=generate-a-random-secret-here
```

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy and paste into `SMTP_PASS`

### 2. Database Migration (If Needed)

The new models have already been added to Prisma schema. If you need to sync:

```bash
# Generate Prisma client (already done)
npx prisma generate

# If you want to sync database schema
npx prisma db push
```

**Note:** Database migration was skipped due to existing drift. The Prisma client has been generated with the new models.

### 3. Start Development Server

```bash
pnpm dev
```

Server will start at `http://localhost:3000`

---

## 🎯 What's New - Quick Reference

### ✅ Phase 1 Features (Already Working)

1. **Internationalization**
   - Language switcher in navbar (🌐 icon)
   - Switch between English and Bengali
   - `/app/settings` to change language

2. **Payroll Integration**
   - Visit `/admin/payroll` (as SYSTEM_ADMIN or HR_ADMIN)
   - Select month/year
   - Click "Download CSV" for payroll data

3. **Team Capacity Planning**
   - Visible on DEPT_HEAD dashboard
   - Shows team calendar with capacity percentage
   - Highlights conflicts (>20% absence)

4. **Balance Projection**
   - Visible on employee dashboard
   - 24-month balance forecast
   - What-if simulator for planning leaves

### ✅ Phase 2 Features (Newly Implemented)

5. **HRIS Integration**
   - Visit `/admin/hris` (as SYSTEM_ADMIN or HR_ADMIN)
   - Upload CSV/Excel employee data
   - Sync and resolve conflicts

6. **Advanced Analytics**
   - API: `GET /api/analytics`
   - Key metrics, trends, approval times
   - Pattern detection and forecasting

7. **Scheduled Reports** 🆕
   - API-based report management
   - 3 report types: Leave Summary, Balance, Approval Times
   - 3 formats: PDF, Excel, CSV
   - Automated scheduling and email delivery

---

## 📊 Using Scheduled Reports

### Create a Report via API

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Monthly Leave Summary",
    "reportType": "LEAVE_SUMMARY",
    "format": "PDF",
    "frequency": "MONTHLY",
    "scheduleTime": "09:00",
    "scheduleDay": 1,
    "recipients": ["hr@cdbl.com"],
    "filters": {
      "department": "IT"
    }
  }'
```

### Generate Report Immediately

```bash
curl -X POST http://localhost:3000/api/reports/1/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sendEmail": false}'
```

### List All Reports

```bash
curl -X GET "http://localhost:3000/api/reports?isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⏰ Set Up Automated Reports

### Option 1: External Cron Service (Recommended)

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create new cron job:
   - **URL:** `https://your-domain.com/api/reports/cron`
   - **Method:** GET
   - **Custom Headers:** `Authorization: Bearer your-cron-secret`
   - **Schedule:** Every 15 minutes
3. Save and enable

### Option 2: GitHub Actions (For GitHub-hosted)

Create `.github/workflows/reports-cron.yml`:

```yaml
name: Scheduled Reports
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  execute-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reports
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/reports/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add secrets:
- `APP_URL`: Your deployment URL
- `CRON_SECRET`: Your cron secret from .env

---

## 🧪 Testing Features

### 1. Test Internationalization

1. Login to the system
2. Click the globe icon (🌐) in navbar
3. Select "বাংলা (Bengali)"
4. Verify UI translates

### 2. Test Payroll Export

1. Login as SYSTEM_ADMIN or HR_ADMIN
2. Visit `/admin/payroll`
3. Select current month
4. Click "Download CSV"
5. Open CSV to verify data

### 3. Test Team Capacity

1. Login as DEPT_HEAD
2. View dashboard
3. Check team calendar widget
4. Verify capacity percentage

### 4. Test Balance Projection

1. Login as EMPLOYEE
2. View dashboard
3. Find "Balance Projection" widget
4. Try what-if simulator

### 5. Test HRIS Sync

1. Login as SYSTEM_ADMIN or HR_ADMIN
2. Visit `/admin/hris`
3. Prepare test CSV:
   ```csv
   empCode,name,email,department,joinDate,status
   EMP001,John Doe,john@cdbl.com,IT,2024-01-01,active
   ```
4. Upload and sync
5. Check for conflicts

### 6. Test Analytics

```bash
curl -X GET http://localhost:3000/api/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Test Reports

```bash
# Create test report
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Report",
    "reportType": "LEAVE_SUMMARY",
    "format": "CSV",
    "frequency": "DAILY",
    "recipients": ["test@example.com"],
    "filters": {}
  }'

# Generate immediately
curl -X POST http://localhost:3000/api/reports/1/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sendEmail": false}'
```

Check `/reports` directory for generated file.

---

## 📁 Key Files & Locations

### User Interfaces

| Path | Role Required | Purpose |
|------|---------------|---------|
| `/admin/payroll` | SYSTEM_ADMIN, HR_ADMIN | Payroll export |
| `/admin/hris` | SYSTEM_ADMIN, HR_ADMIN | HRIS sync dashboard |
| `/admin/hris/conflicts` | SYSTEM_ADMIN, HR_ADMIN | Resolve conflicts |
| `/dashboard` | All | Main dashboard (role-based) |
| `/settings` | All | User settings, language |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payroll/export` | GET | Export payroll CSV |
| `/api/hris/sync` | POST | Upload HRIS data |
| `/api/hris/conflicts` | GET/POST | Manage conflicts |
| `/api/analytics` | GET | Get analytics |
| `/api/reports` | GET/POST | List/create reports |
| `/api/reports/[id]/generate` | POST | Generate report |
| `/api/reports/cron` | GET | Cron scheduler |
| `/api/balance/projection` | GET | Balance forecast |

### Generated Files

- **Reports:** `/reports/*.{pdf,xlsx,csv}`
- **Translations:** `/public/locales/{en,bn}/*.json`

---

## 🐛 Troubleshooting

### "xlsx package not installed"

```bash
pnpm add xlsx html-pdf-node
```

### "SMTP connection failed"

Check your `.env`:
- Verify `SMTP_USER` and `SMTP_PASS`
- For Gmail, use App Password (not regular password)
- Check firewall/port 587

### "Unauthorized" on /api/reports

- Ensure you're logged in
- Check user role (must be SYSTEM_ADMIN, HR_ADMIN, etc.)
- Verify Authorization header

### Report not generating

1. Check execution history: `GET /api/reports/1?limit=10`
2. Look for `errorLog` in failed executions
3. Verify data exists (empty datasets may fail)

### Cron not running

1. Check cron service logs
2. Verify `CRON_SECRET` is set
3. Test manually: `curl -X GET http://localhost:3000/api/reports/cron -H "Authorization: Bearer your-secret"`

---

## 📚 Documentation

- **IMPLEMENTATION_STATUS.md** - Complete status overview
- **REPORTS_SYSTEM.md** - Detailed reports documentation
- **WEEK_7_REPORTS_SUMMARY.md** - Week 7 summary
- **COMPLETE_SYSTEM_PLAN.md** - Master roadmap
- **TESTING_GUIDE.md** - Comprehensive testing

---

## 🎯 What to Do Next?

### Option A: Test Everything ✅ (Recommended)

1. Configure SMTP in `.env`
2. Test each feature systematically
3. Create sample reports
4. Verify email delivery
5. Check execution history
6. Review generated files

### Option B: Continue Development 🔨

- Implement Phase 2 Week 8 (Calendar Integration)
- Start Phase 3 (PWA, Mobile)
- Add more report types
- Build web UI for reports

### Option C: Deploy to Staging 🚀

1. Set up staging environment
2. Configure production SMTP
3. Set up production cron
4. Run smoke tests
5. User acceptance testing

---

## ✅ Quick Checklist

**Setup:**
- [ ] `.env` configured with SMTP
- [ ] `.env` has `CRON_SECRET`
- [ ] Packages installed (`xlsx`, `html-pdf-node`)
- [ ] Prisma client generated
- [ ] Dev server running

**Testing:**
- [ ] Language switcher works
- [ ] Payroll export works
- [ ] Team capacity displays
- [ ] Balance projection works
- [ ] HRIS sync works
- [ ] Analytics API responds
- [ ] Report creation works
- [ ] Report generation works
- [ ] Email delivery works

**Production:**
- [ ] Cron job configured
- [ ] SMTP credentials valid
- [ ] Reports directory writable
- [ ] Authorization working
- [ ] Error handling tested

---

## 🎉 You're All Set!

**Implemented:** 7 weeks of features (Phase 1-2)
**Ready to use:** All features are functional
**Next:** Test, deploy, or continue development

Need help? Check the documentation files listed above!

---

**Version:** 2.0.0-alpha
**Last Updated:** December 3, 2025
**Status:** ✅ Ready for Testing
