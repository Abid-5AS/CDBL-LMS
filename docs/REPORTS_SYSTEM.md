# 📊 Scheduled Reports System

## Overview

The Scheduled Reports System provides automated report generation and delivery capabilities for the CDBL Leave Management System. Reports can be generated on-demand or scheduled to run automatically at specified intervals.

---

## Features

### ✅ Core Capabilities

1. **Multiple Report Types**
   - Leave Summary Report
   - Leave Balance Report
   - Approval Times Analysis
   - And more (extensible architecture)

2. **Multiple Output Formats**
   - PDF (styled, professional)
   - Excel (`.xlsx` with multiple sheets)
   - CSV (simple, data-focused)
   - JSON (for API consumers)

3. **Flexible Scheduling**
   - Daily
   - Weekly (specific day)
   - Bi-weekly
   - Monthly (specific date)
   - Quarterly
   - Yearly
   - Custom

4. **Email Delivery**
   - Automatic email delivery to multiple recipients
   - Professional HTML email templates
   - Report attached to email

5. **Execution History**
   - Track all report executions
   - View success/failure status
   - Access generated files
   - Monitor performance metrics

---

## Installation

### 1. Install Required Packages

```bash
# Required for Excel generation
npm install xlsx

# Required for PDF generation (optional - choose one)
npm install html-pdf-node
# OR
npm install puppeteer
# OR
npm install jspdf

# Nodemailer is already installed
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_scheduled_reports
npx prisma generate
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# SMTP Configuration for Email Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=CDBL LMS <noreply@cdbl.com>

# Cron Security
CRON_SECRET=your-secret-key-here
```

### 4. Set Up Cron Job

Option A: **External Cron Service** (Recommended for production)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

- URL: `https://your-domain.com/api/reports/cron`
- Method: `GET` or `POST`
- Headers: `Authorization: Bearer your-cron-secret`
- Frequency: Every 15 minutes (or as needed)

Option B: **GitHub Actions** (For GitHub-hosted projects)

Create `.github/workflows/reports-cron.yml`:

```yaml
name: Scheduled Reports

on:
  schedule:
    # Run every 15 minutes
    - cron: '*/15 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  execute-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Report Cron
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/reports/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Option C: **Node.js Cron** (For self-hosted)

Create `scripts/report-scheduler.ts`:

```typescript
import cron from 'node-cron';
import fetch from 'node-fetch';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('[Scheduler] Checking for due reports...');

  try {
    const response = await fetch('http://localhost:3000/api/reports/cron', {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const result = await response.json();
    console.log('[Scheduler] Result:', result);
  } catch (error) {
    console.error('[Scheduler] Error:', error);
  }
});

console.log('[Scheduler] Report scheduler started');
```

Run with: `npm install node-cron && tsx scripts/report-scheduler.ts`

---

## Usage

### API Endpoints

#### 1. Create Scheduled Report

```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Monthly Leave Summary",
  "reportType": "LEAVE_SUMMARY",
  "format": "PDF",
  "frequency": "MONTHLY",
  "scheduleTime": "09:00",
  "scheduleDay": 1,
  "recipients": ["hr@cdbl.com", "manager@cdbl.com"],
  "filters": {
    "department": "IT"
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "reportId": 1,
  "message": "Report scheduled successfully"
}
```

#### 2. Get All Scheduled Reports

```http
GET /api/reports?isActive=true&reportType=LEAVE_SUMMARY
Authorization: Bearer <token>
```

**Response:**
```json
{
  "reports": [
    {
      "id": 1,
      "name": "Monthly Leave Summary",
      "reportType": "LEAVE_SUMMARY",
      "format": "PDF",
      "frequency": "MONTHLY",
      "isActive": true,
      "lastRunAt": "2025-12-01T09:00:00Z",
      "nextRunAt": "2026-01-01T09:00:00Z",
      "createdBy": {
        "id": 1,
        "name": "Admin User"
      },
      "lastExecution": {
        "status": "COMPLETED",
        "completedAt": "2025-12-01T09:05:23Z",
        "recordCount": 45
      }
    }
  ]
}
```

#### 3. Generate Report Now

```http
POST /api/reports/1/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "execution": {
    "id": 42,
    "filePath": "/reports/monthly_leave_summary_2025-12-03T10-30-00.pdf",
    "fileSize": 245678,
    "recordCount": 45,
    "duration": 3421
  },
  "email": {
    "sent": true,
    "sentTo": ["hr@cdbl.com", "manager@cdbl.com"],
    "failedTo": [],
    "errors": []
  }
}
```

#### 4. Get Execution History

```http
GET /api/reports/1?limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "history": [
    {
      "id": 42,
      "reportId": 1,
      "reportName": "Monthly Leave Summary",
      "status": "COMPLETED",
      "startedAt": "2025-12-03T10:30:00Z",
      "completedAt": "2025-12-03T10:30:03Z",
      "fileUrl": "/reports/monthly_leave_summary_2025-12-03T10-30-00.pdf",
      "fileSize": 245678,
      "recordCount": 45,
      "duration": 3421
    }
  ]
}
```

#### 5. Update Scheduled Report

```http
PATCH /api/reports/1
Content-Type: application/json
Authorization: Bearer <token>

{
  "isActive": false,
  "scheduleTime": "08:00"
}
```

#### 6. Delete Scheduled Report

```http
DELETE /api/reports/1
Authorization: Bearer <token>
```

---

## Report Types

### 1. Leave Summary Report

Provides comprehensive leave statistics for a given period.

**Sections:**
- Key Metrics (total leaves, days, average duration)
- Leaves by Type
- Leaves by Department
- Monthly Trends

**Filters:**
- `startDate`: Period start
- `endDate`: Period end
- `department`: Filter by department
- `leaveType`: Filter by leave type

### 2. Leave Balance Report

Shows current leave balance status for all employees.

**Sections:**
- Overall Statistics
- Employee Leave Balances (detailed table)
- Low Balance Alerts (< 5 days)
- High Balance Alerts (> 20 days - encashment risk)

**Filters:**
- `department`: Filter by department
- `leaveType`: Filter by leave type

### 3. Approval Times Report

Analyzes leave approval efficiency and response times.

**Sections:**
- Overall Performance (average, median, fastest, slowest)
- Approval Time by Department
- Approval Time by Approver
- Time Distribution (0-24h, 24-48h, etc.)

**Filters:**
- `startDate`: Period start
- `endDate`: Period end
- `department`: Filter by department

---

## Adding New Report Types

### Step 1: Create Generator

Create `/lib/reports/generators/your-report.ts`:

```typescript
import { BaseReportGenerator } from './base';
import type { ReportFilters, ReportContext, ReportData } from '../types';

export class YourReportGenerator extends BaseReportGenerator {
  readonly reportType = 'YOUR_REPORT' as const;

  async generate(
    filters: ReportFilters,
    context: ReportContext
  ): Promise<ReportData> {
    // Fetch data
    const data = await fetchYourData(filters);

    // Create report sections
    const sections = [
      {
        title: 'Section Title',
        type: 'table',
        data: {
          headers: ['Col1', 'Col2', 'Col3'],
          rows: [
            ['Value1', 'Value2', 'Value3'],
          ],
        },
      },
    ];

    return {
      title: 'Your Report Title',
      subtitle: 'Report subtitle',
      generatedAt: new Date(),
      filters,
      sections,
      summary: {
        // Summary data
      },
    };
  }
}
```

### Step 2: Register Generator

Add to `/lib/reports/generators/index.ts`:

```typescript
import { YourReportGenerator } from './your-report';

generators.set('YOUR_REPORT', new YourReportGenerator());

export { YourReportGenerator };
```

### Step 3: Add to Prisma Enum

Add to `prisma/schema.prisma`:

```prisma
enum ReportType {
  // ... existing types ...
  YOUR_REPORT // Add your type
}
```

### Step 4: Run Migration

```bash
npx prisma migrate dev --name add_your_report_type
npx prisma generate
```

---

## Testing

### 1. Test Email Configuration

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your-email@example.com"}'
```

### 2. Create Test Report

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Report",
    "reportType": "LEAVE_SUMMARY",
    "format": "CSV",
    "frequency": "DAILY",
    "scheduleTime": "09:00",
    "recipients": ["test@example.com"],
    "filters": {}
  }'
```

### 3. Generate Test Report

```bash
curl -X POST http://localhost:3000/api/reports/1/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sendEmail": false}'
```

### 4. Test Cron Endpoint

```bash
curl -X GET http://localhost:3000/api/reports/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Troubleshooting

### PDF Generation Issues

**Error:** `xlsx package not installed`
```bash
npm install xlsx
```

**Error:** `html-pdf-node package not installed`
```bash
npm install html-pdf-node
```

### Email Delivery Issues

**Gmail Authentication:**
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use App Password in `SMTP_PASS`

**Test Connection:**
```typescript
import { EmailService } from '@/lib/reports/email-service';

const isConnected = await EmailService.testConnection();
console.log('Email configured:', isConnected);
```

### Cron Not Running

1. **Check cron service logs**
2. **Verify `CRON_SECRET` is set**
3. **Check authorization header**
4. **Test endpoint manually**

### Report Generation Fails

1. **Check execution logs:**
   ```sql
   SELECT * FROM ReportExecution
   WHERE status = 'FAILED'
   ORDER BY startedAt DESC
   LIMIT 10;
   ```

2. **View error details in `errorLog` field**

3. **Check Prisma connection**

4. **Verify data exists** (empty datasets may cause issues)

---

## Architecture

### File Structure

```
/lib/reports/
├── types.ts                  # TypeScript interfaces
├── service.ts                # Main orchestration service
├── email-service.ts          # Email delivery
├── generators/
│   ├── base.ts              # Base generator class
│   ├── index.ts             # Generator registry
│   ├── leave-summary.ts     # Leave summary generator
│   ├── leave-balance.ts     # Balance generator
│   └── approval-times.ts    # Approval times generator
└── formatters/
    ├── base.ts              # Base formatter class
    ├── index.ts             # Formatter registry
    ├── csv.ts               # CSV formatter
    ├── excel.ts             # Excel formatter
    └── pdf.ts               # PDF formatter

/app/api/reports/
├── route.ts                  # List, create reports
├── [id]/
│   ├── route.ts             # Get, update, delete report
│   └── generate/
│       └── route.ts         # Generate on demand
└── cron/
    └── route.ts             # Cron scheduler endpoint

/prisma/schema.prisma
└── ScheduledReport          # Report configuration model
└── ReportExecution          # Execution history model
```

### Data Flow

```
1. User creates scheduled report via API
   ↓
2. ReportService stores configuration in database
   ↓
3. Cron endpoint called every 15 minutes
   ↓
4. Checks for reports where nextRunAt <= now
   ↓
5. For each due report:
   a. ReportService.generateReport()
   b. Generator fetches data from database
   c. Generator creates ReportData structure
   d. Formatter converts to file (PDF/Excel/CSV)
   e. File saved to /reports directory
   f. EmailService sends email with attachment
   g. Update execution record and nextRunAt
```

---

## Security Considerations

1. **Cron Endpoint Protection**
   - Use strong `CRON_SECRET`
   - Consider IP whitelisting
   - Monitor for abuse

2. **Email Configuration**
   - Use App Passwords (not main password)
   - Store credentials in environment variables
   - Never commit `.env` file

3. **File Access**
   - Generated reports stored in `/reports` directory
   - No public URL access (files served via authenticated API only)
   - Consider implementing file cleanup cron

4. **Authorization**
   - Only admins and managers can create reports
   - Report creators can only see their own reports (except HR_ADMIN+)
   - Email recipients not validated (trust admin input)

---

## Performance Optimization

1. **Large Datasets**
   - Implement pagination in generators
   - Use database indexes on queried fields
   - Consider caching frequently accessed data

2. **Email Delivery**
   - Send emails asynchronously
   - Batch emails if possible
   - Implement retry logic

3. **File Storage**
   - Implement automatic cleanup (delete files older than 30 days)
   - Consider cloud storage (S3, Azure Blob)
   - Compress large files

4. **Cron Frequency**
   - Default: Every 15 minutes
   - Adjust based on report frequency needs
   - Consider separate crons for different frequencies

---

## Future Enhancements

- [ ] Web UI for report management
- [ ] Report templates and customization
- [ ] Dashboard widgets showing recent reports
- [ ] Report scheduling via UI calendar
- [ ] Export to additional formats (DOCX, HTML)
- [ ] Report preview before scheduling
- [ ] Automatic file cleanup cron
- [ ] Cloud storage integration
- [ ] Report sharing via secure links
- [ ] Custom SQL reports (advanced users)
- [ ] Report subscriptions (users subscribe to reports)
- [ ] Slack/Teams integration
- [ ] Multi-language report support

---

## Support

For issues or questions:

1. Check this documentation
2. Review execution logs in database
3. Check application logs
4. Verify environment configuration
5. Test individual components (email, generator, formatter)

---

**Status:** ✅ Phase 2 Week 7 Complete
**Version:** 1.0.0
**Last Updated:** 2025-12-03
