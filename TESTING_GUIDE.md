# Testing Guide - CDBL Leave Management System
**Version**: 2.0.0-alpha
**Date**: December 3, 2025

---

## 🎯 TESTING OVERVIEW

This guide covers testing for all implemented features in Phase 1-2.

---

## 📋 PRE-TESTING SETUP

### 1. Database Migrations
```bash
# Run Prisma migrations to create new tables
npx prisma migrate dev --name add_hris_integration

# Generate Prisma client
npx prisma generate

# (Optional) Seed test data
npx prisma db seed
```

### 2. Install Dependencies
```bash
# Install any missing packages
pnpm install

# Or
npm install
```

### 3. Environment Variables
Ensure these are set in `.env`:
```env
DATABASE_URL="mysql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🧪 FEATURE TESTING CHECKLIST

### Phase 1: Core Features

#### 1. i18n (Internationalization)
**Location**: Throughout application

**Test Cases**:
- [ ] Click language switcher in navbar
- [ ] Switch to Bengali (বাংলা)
- [ ] Verify all UI text changes to Bengali
- [ ] Navigate to different pages (Dashboard, Leaves, Balance)
- [ ] Verify translation consistency
- [ ] Switch back to English
- [ ] Verify no missing translation warnings in console
- [ ] Check date formatting in both languages
- [ ] Test form validation messages in Bengali

**Expected Results**:
✅ All text translates correctly
✅ No layout breaks
✅ Date formats adjust appropriately
✅ Forms work in both languages

**Potential Issues**:
⚠️ Long Bengali text might overflow containers
⚠️ Some technical terms might not have direct translations

---

#### 2. Payroll Integration
**Location**: `/admin/payroll`

**Test Cases**:
- [ ] Login as SYSTEM_ADMIN or HR_ADMIN
- [ ] Navigate to `/admin/payroll`
- [ ] Select current month and year
- [ ] Click "Download CSV"
- [ ] Open downloaded CSV file
- [ ] Verify columns: Employee ID, Total Working Days, Present Days, Paid Leave Days, Unpaid Leave Days, LWP Deduction Days
- [ ] Verify calculations are correct
- [ ] Test with different months
- [ ] Test with department filter (if implemented)

**Expected Results**:
✅ CSV downloads successfully
✅ Calculations match expected values
✅ All employees included
✅ Leave breakdown is accurate

**Sample Data to Verify**:
- Employee with 2 days EL taken → should show in "Paid Leave Days"
- Employee with 1 day LWP → should show in "LWP Deduction Days"
- Total Working Days = Days in month - Weekends - Holidays

---

#### 3. Team Capacity Planning
**Location**: Department Head dashboard, `/api/team/capacity`

**Test Cases**:
- [ ] Login as DEPT_HEAD
- [ ] View team capacity calendar
- [ ] Verify today's capacity percentage is correct
- [ ] Hover over a day with leaves → see employee names
- [ ] Check for days with <50% capacity (should show as critical)
- [ ] Approve a leave request → verify capacity updates
- [ ] Check conflict detection:
  - [ ] Try approving leave that would cause >20% absence
  - [ ] Verify warning message appears
- [ ] Test with different date ranges
- [ ] Test department filtering

**Expected Results**:
✅ Capacity calculations are accurate
✅ Visual indicators match actual staffing
✅ Conflict warnings appear appropriately
✅ Calendar updates in real-time

**Formula Verification**:
```
Capacity % = (Total Team - On Leave) / Total Team * 100

Example:
Team Size: 10
On Leave: 2
Capacity: (10-2)/10 * 100 = 80%
```

---

#### 4. Balance Projection
**Location**: Employee dashboard, `/api/balance/projection`

**Test Cases**:
- [ ] Login as EMPLOYEE
- [ ] Navigate to dashboard or balance page
- [ ] Locate Balance Projection widget
- [ ] Verify current balance displays correctly
- [ ] Check 12-month projection timeline
- [ ] Verify accruals (EL: 2 days/month)
- [ ] Test What-If Simulator:
  - [ ] Input future leave dates (e.g., 5 days next month)
  - [ ] Verify projected balance updates
  - [ ] Check warnings appear if balance goes negative
- [ ] Switch leave types (Casual, Medical)
- [ ] Verify recommendations appear for:
  - [ ] Balance expiry warnings
  - [ ] Underutilization alerts
  - [ ] Deficit warnings

**Expected Results**:
✅ Projections are mathematically correct
✅ Warnings appear at appropriate thresholds
✅ What-if simulator shows instant updates
✅ Recommendations are relevant

**Calculation Verification**:
```
Month 1:
Opening: 10 days
Accrued: +2 days
Used: 0 days
Projected: 12 days

Month 2:
Opening: 12 days
Accrued: +2 days
Used: 3 days (planned leave)
Projected: 11 days
```

---

### Phase 2: Advanced Features

#### 5. HRIS Integration
**Location**: `/admin/hris`

**Prerequisites**:
- Prepare a sample CSV file with employee data:
  ```csv
  empCode,name,email,department,joinDate,status
  EMP001,John Doe,john@example.com,IT,2023-01-15,active
  EMP002,Jane Smith,jane@example.com,HR,2022-06-20,active
  ```

**Test Cases**:
- [ ] Login as SYSTEM_ADMIN or HR_ADMIN
- [ ] Navigate to `/admin/hris`
- [ ] Upload sample CSV file
- [ ] Click "Start Sync"
- [ ] Wait for sync to complete
- [ ] Verify sync results:
  - [ ] Records Total
  - [ ] Records Synced
  - [ ] Records Failed
  - [ ] Conflicts Detected
- [ ] Check sync history table
- [ ] Test conflict resolution:
  - [ ] Navigate to `/admin/hris/conflicts`
  - [ ] View conflicting records
  - [ ] Click "Use HRIS Data"
  - [ ] Verify system data updates
- [ ] Test with duplicate employee (same empCode)
- [ ] Test with invalid email format
- [ ] Test with Excel file (.xlsx)

**Expected Results**:
✅ Valid records sync successfully
✅ Conflicts are detected correctly
✅ Duplicate prevention works
✅ Email validation catches errors
✅ Excel import works

**Edge Cases to Test**:
- Empty CSV file → Should handle gracefully
- CSV with missing required columns → Should show error
- Very large file (1000+ employees) → Should process in batches
- Special characters in names → Should handle correctly

---

#### 6. Advanced Analytics
**Location**: `/api/analytics`, Admin dashboards

**Test Cases**:

**A. Forecasting**
- [ ] Make API request: `GET /api/analytics/forecast?months=3`
- [ ] Verify 3-month forecast returned
- [ ] Check forecast values are reasonable
- [ ] Verify confidence intervals included
- [ ] Test seasonal factors (expect higher in Dec, lower in Jan)

**B. Pattern Detection**
- [ ] Create test scenario:
  - [ ] Employee takes 5 Mondays/Fridays as casual leave
- [ ] Run pattern detection
- [ ] Verify Monday/Friday pattern detected
- [ ] Check confidence score is high (>60%)
- [ ] Test long weekend pattern:
  - [ ] Take leave adjacent to holiday
- [ ] Verify pattern appears in results

**C. Burnout Risk**
- [ ] Create test scenarios:
  - [ ] Employee A: No leave in 6 months → High risk
  - [ ] Employee B: 80% leave used → Low risk
  - [ ] Employee C: Only 1-day leaves → Medium risk
- [ ] Check burnout scores calculated correctly
- [ ] Verify recommendations are relevant
- [ ] Test department-wide analysis

**D. Cost Analysis**
- [ ] Check cost calculations for a month
- [ ] Verify total leave cost
- [ ] Check encashment liability
- [ ] Verify LWP savings
- [ ] Test department breakdown

**Expected Results**:
✅ Forecasts are within reasonable range
✅ Patterns detect suspicious behavior
✅ Burnout scores reflect actual risk
✅ Cost calculations are accurate

---

## 🔍 API TESTING

### Using cURL

**1. Get Analytics Metrics**
```bash
curl -X GET http://localhost:3000/api/analytics \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json"
```

**2. Trigger HRIS Sync**
```bash
curl -X POST http://localhost:3000/api/hris/sync \
  -H "Cookie: your-auth-cookie" \
  -F "file=@employees.csv" \
  -F "provider=csv"
```

**3. Get Balance Projection**
```bash
curl -X GET "http://localhost:3000/api/balance/projection?leaveType=EARNED&monthsAhead=12" \
  -H "Cookie: your-auth-cookie"
```

**4. Get Team Capacity**
```bash
curl -X GET "http://localhost:3000/api/team/capacity?department=IT&daysAhead=30" \
  -H "Cookie: your-auth-cookie"
```

### Using Postman

Import the following collection (create file `CDBL-API-Tests.json`):
```json
{
  "info": {
    "name": "CDBL LMS API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Analytics - Get Metrics",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/analytics"
      }
    },
    {
      "name": "HRIS - Get Sync History",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/hris/sync"
      }
    }
  ]
}
```

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue 1: Next.js 16 Build Error
**Symptom**: Build fails with "Duplicate identifier 'LayoutProps'"
**Workaround**:
```bash
# Use dev mode for now
npm run dev

# OR downgrade to Next.js 15
npm install next@15
```

### Issue 2: HRIS Sync Slow with Large Files
**Symptom**: Sync takes >2 minutes for 1000+ employees
**Workaround**: Will be optimized in Phase 4
**Temporary**: Process files in chunks of 100

### Issue 3: Analytics Calculations on Large Datasets
**Symptom**: Slow response (>5 seconds) with 10,000+ leave records
**Workaround**: Redis caching will be added in Phase 4
**Temporary**: Use date range filters to limit data

---

## ✅ SUCCESS CRITERIA

### Phase 1 Features
- ✅ Language switching works without errors
- ✅ Payroll export generates valid CSV
- ✅ Team capacity shows accurate percentages
- ✅ Balance projections calculate correctly
- ✅ No console errors during normal usage

### Phase 2 Features
- ✅ HRIS sync completes without data loss
- ✅ Conflicts are detected and resolvable
- ✅ Analytics provide actionable insights
- ✅ Forecasts are within 20% of actual
- ✅ Pattern detection identifies known cases

---

## 📊 PERFORMANCE BENCHMARKS

### Target Response Times
| Endpoint | Target | Acceptable |
|----------|--------|------------|
| /api/analytics | <2s | <5s |
| /api/hris/sync | <30s (1000 records) | <60s |
| /api/team/capacity | <1s | <3s |
| /api/balance/projection | <1s | <2s |

### Browser Performance
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >80

---

## 🧪 AUTOMATED TESTING (TODO)

### Unit Tests Needed
```typescript
// Example test structure
describe('AnalyticsCalculator', () => {
  it('calculates leave utilization correctly', async () => {
    // Test implementation
  });

  it('detects Monday/Friday patterns', async () => {
    // Test implementation
  });
});
```

### E2E Tests Needed (Playwright)
```typescript
test('HRIS sync flow', async ({ page }) => {
  await page.goto('/admin/hris');
  await page.setInputFiles('input[type="file"]', 'test-data.csv');
  await page.click('text=Start Sync');
  await expect(page.locator('text=Sync completed')).toBeVisible();
});
```

---

## 📝 TEST RESULTS TEMPLATE

```markdown
## Test Session Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Development/Staging/Production
**Browser**: Chrome/Firefox/Safari version

### Features Tested
- [ ] i18n
- [ ] Payroll
- [ ] Team Capacity
- [ ] Balance Projection
- [ ] HRIS Integration
- [ ] Analytics

### Issues Found
1. **Issue Title**
   - Severity: Critical/High/Medium/Low
   - Steps to Reproduce:
   - Expected:
   - Actual:
   - Screenshot/Video:

### Overall Assessment
- Pass Rate: X/Y tests passed
- Recommendation: Ready for Production / Needs Fixes / More Testing Required
```

---

## 🚀 NEXT STEPS AFTER TESTING

1. ✅ Document all found issues
2. ✅ Prioritize fixes (Critical → High → Medium → Low)
3. ✅ Fix critical and high-priority issues
4. ✅ Re-test fixed issues
5. ✅ Get sign-off from stakeholders
6. ✅ Deploy to staging
7. ✅ User Acceptance Testing (UAT)
8. ✅ Deploy to production

---

**Happy Testing! 🎉**
