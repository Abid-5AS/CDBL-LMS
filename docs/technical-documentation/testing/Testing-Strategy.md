# CDBL Leave Management System - Testing Strategy

**Version:** 2.0
**Last Updated:** January 2025
**QA Status:** Continuous

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Manual Testing](#manual-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Test Data Management](#test-data-management)
11. [CI/CD Integration](#cicd-integration)

---

## Overview

This document outlines the comprehensive testing strategy for the CDBL Leave Management System, ensuring quality, reliability, and security across all features.

### Testing Objectives

- **Functional Correctness**: All features work as specified
- **Regression Prevention**: New changes don't break existing functionality
- **Performance**: System meets performance requirements
- **Security**: No vulnerabilities or security gaps
- **Accessibility**: System usable by all users
- **User Experience**: Interfaces are intuitive and error-free

### Quality Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Code Coverage | ≥80% | 75% | 🟡 In Progress |
| Test Pass Rate | 100% | 98% | 🟢 Good |
| Critical Bugs | 0 | 0 | 🟢 Good |
| Performance | <500ms | 350ms | 🟢 Good |
| Accessibility | WCAG AA | AA | 🟢 Good |

---

## Testing Pyramid

```
        /\
       /  \  E2E Tests (5%)
      /    \  - Critical user flows
     /------\  - Cross-browser testing
    /        \
   / Integration\ (20%)
  /   Tests     \ - API endpoints
 /               \ - Database operations
/------------------\
/   Unit Tests     \ (75%)
/  Components, Utils\ - Pure functions
/___________________\ - Component logic
```

### Distribution Rationale

- **75% Unit Tests**: Fast, isolated, catch bugs early
- **20% Integration Tests**: Verify modules work together
- **5% E2E Tests**: Validate critical user journeys

---

## Unit Testing

### Framework

- **Test Runner**: Jest 29.x
- **Component Testing**: React Testing Library
- **Assertions**: Jest + expect
- **Mocking**: Jest mocks + MSW (Mock Service Worker)

### What to Test

#### Utility Functions

```typescript
// Example: lib/dateUtils.test.ts
describe('calculateWorkingDays', () => {
  it('should calculate working days between dates excluding weekends', () => {
    const start = new Date('2024-01-01'); // Monday
    const end = new Date('2024-01-05');   // Friday
    expect(calculateWorkingDays(start, end)).toBe(5);
  });

  it('should exclude holidays from working days count', () => {
    const start = new Date('2024-12-23');
    const end = new Date('2024-12-27');
    const holidays = [new Date('2024-12-25')]; // Christmas
    expect(calculateWorkingDays(start, end, holidays)).toBe(4);
  });

  it('should return 0 for invalid date range', () => {
    const start = new Date('2024-01-05');
    const end = new Date('2024-01-01');
    expect(calculateWorkingDays(start, end)).toBe(0);
  });
});
```

#### React Components

```typescript
// Example: components/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render approved status with correct styling', () => {
    render(<StatusBadge status="APPROVED" />);
    const badge = screen.getByText(/approved/i);
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });

  it('should render pending status with clock icon', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('should be accessible to screen readers', () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText(/approved/i)).toHaveAttribute('role', 'status');
  });
});
```

#### Policy Validation Logic

```typescript
// Example: lib/policy.test.ts
describe('validateLeaveRequest', () => {
  it('should reject EL without 15 days notice', () => {
    const request = {
      type: 'EARNED',
      startDate: addDays(new Date(), 10), // Only 10 days notice
      endDate: addDays(new Date(), 12),
    };

    const result = validateLeaveRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('el_insufficient_notice');
  });

  it('should accept EL with sufficient notice', () => {
    const request = {
      type: 'EARNED',
      startDate: addDays(new Date(), 20), // 20 days notice
      endDate: addDays(new Date(), 25),
    };

    const result = validateLeaveRequest(request);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should enforce CL consecutive days limit', () => {
    const request = {
      type: 'CASUAL',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'), // 5 days > 3 limit
    };

    const result = validateLeaveRequest(request);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('cl_exceeds_consecutive_limit');
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- lib/policy.test.ts
```

### Coverage Requirements

- **Target**: 80% overall coverage
- **Minimum**: 100% for critical logic (policy validation, balance calculations)
- **Reports**: Generated in `coverage/` directory

---

## Integration Testing

### Scope

Integration tests verify that different modules work correctly together:

- API routes + database
- Authentication + authorization
- Policy validation + database queries
- Email service + OTP generation

### API Endpoint Testing

```typescript
// Example: tests/api/leaves.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/leaves/route';
import { GET as AuthGet } from '@/app/api/auth/me/route';

describe('POST /api/leaves', () => {
  beforeEach(async () => {
    // Setup test database
    await prisma.leaveRequest.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@cdbl.com',
        password: await hashPassword('password'),
        role: 'EMPLOYEE'
      }
    });
  });

  it('should create leave request with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        cookie: `jwt=${generateTestJWT(testUser.id)}`
      },
      body: {
        type: 'EARNED',
        startDate: '2024-11-20T00:00:00.000Z',
        endDate: '2024-11-25T00:00:00.000Z',
        workingDays: 6,
        reason: 'Family vacation'
      }
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.ok).toBe(true);
    expect(data.id).toBeDefined();

    // Verify database
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: data.id }
    });
    expect(leave).toBeDefined();
    expect(leave.type).toBe('EARNED');
  });

  it('should reject leave request without sufficient notice', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        cookie: `jwt=${generateTestJWT(testUser.id)}`
      },
      body: {
        type: 'EARNED',
        startDate: addDays(new Date(), 5), // Only 5 days notice
        endDate: addDays(new Date(), 10),
        workingDays: 6,
        reason: 'Family vacation'
      }
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('el_insufficient_notice');
  });
});
```

### Database Integration Tests

```typescript
// Example: tests/integration/balance.test.ts
describe('Balance Calculations', () => {
  it('should calculate correct remaining balance', async () => {
    // Create user with balance
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@cdbl.com',
        role: 'EMPLOYEE',
        balances: {
          create: [
            {
              type: 'EARNED',
              year: 2024,
              opening: 10,
              accrued: 10,
              used: 5,
              closing: 15
            }
          ]
        }
      }
    });

    const balance = await getBalance(user.id, 'EARNED', 2024);

    expect(balance.total).toBe(20); // opening + accrued
    expect(balance.remaining).toBe(15); // total - used
  });

  it('should deduct balance after leave approval', async () => {
    // Test balance deduction logic
    // (when implemented)
  });
});
```

### Running Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run with test database
DATABASE_URL="mysql://test:test@localhost:3306/cdbl_test" npm run test:integration
```

---

## End-to-End Testing

### Framework

- **E2E Framework**: Playwright
- **Browser Coverage**: Chrome, Firefox, Safari
- **Device Coverage**: Desktop, Tablet, Mobile

### Critical User Flows

#### 1. Complete Leave Application Flow

```typescript
// tests/e2e/leave-application.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Leave Application Flow', () => {
  test('employee can submit leave request successfully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'employee@cdbl.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to apply leave
    await page.click('text=Apply Leave');
    await expect(page).toHaveURL(/.*\/leaves\/apply/);

    // Fill form
    await page.selectOption('select[name="type"]', 'EARNED');
    await page.fill('input[name="startDate"]', '2024-11-20');
    await page.fill('input[name="endDate"]', '2024-11-25');
    await page.fill('textarea[name="reason"]', 'Family vacation to Cox\'s Bazar');

    // Submit
    await page.click('button:has-text("Submit Request")');

    // Verify success
    await expect(page.locator('text=Leave request submitted')).toBeVisible();
    await expect(page).toHaveURL(/.*\/leaves/);

    // Verify in list
    await expect(page.locator('text=PENDING')).toBeVisible();
  });
});
```

#### 2. Approval Workflow

```typescript
test.describe('Approval Workflow', () => {
  test('full approval chain', async ({ page }) => {
    // Create leave request (via API or UI)
    const leaveId = await createTestLeaveRequest();

    // HR Admin forwards
    await loginAs(page, 'hradmin@cdbl.com');
    await page.goto(`/approvals`);
    await page.click(`[data-leave-id="${leaveId}"] button:has-text("Forward")`);
    await expect(page.locator('text=Forwarded successfully')).toBeVisible();

    // Dept Head forwards
    await loginAs(page, 'depthead@cdbl.com');
    await page.goto(`/approvals`);
    await page.click(`[data-leave-id="${leaveId}"] button:has-text("Forward")`);

    // HR Head approves
    await loginAs(page, 'hrhead@cdbl.com');
    await page.goto(`/approvals`);
    await page.click(`[data-leave-id="${leaveId}"] button:has-text("Approve")`);
    await page.fill('textarea[name="comment"]', 'Approved');
    await page.click('button:has-text("Confirm Approval")');

    // Verify status changed
    await expect(page.locator('text=APPROVED')).toBeVisible();

    // Verify employee sees approval
    await loginAs(page, 'employee@cdbl.com');
    await page.goto('/leaves');
    await expect(page.locator(`[data-leave-id="${leaveId}"] text=APPROVED`)).toBeVisible();
  });
});
```

#### 3. 2FA Authentication Flow

```typescript
test.describe('2FA Authentication', () => {
  test('successful login with OTP', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@cdbl.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to OTP page
    await expect(page).toHaveURL(/.*\/verify-otp/);
    await expect(page.locator('text=Verification code sent')).toBeVisible();

    // Get OTP from test email or database
    const otp = await getLatestOTP('test@cdbl.com');

    // Enter OTP
    await page.fill('input[name="code"]', otp);
    await page.click('button:has-text("Verify Code")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('handle expired OTP', async ({ page }) => {
    // Login and get to OTP page
    // ... (similar to above)

    // Wait for OTP to expire (or manipulate system time)
    await page.waitForTimeout(600000); // 10 minutes

    // Try to submit expired OTP
    await page.fill('input[name="code"]', '123456');
    await page.click('button:has-text("Verify Code")');

    // Should show error
    await expect(page.locator('text=expired')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox

# Run specific test file
npm run test:e2e -- tests/e2e/leave-application.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

---

## Manual Testing

### Test Scenarios

#### Leave Application

- [ ] **Scenario 1: Valid EL with sufficient notice**
  - Login as EMPLOYEE
  - Navigate to Apply Leave
  - Select EARNED leave type
  - Select dates 20 days in future
  - Enter valid reason (min 10 chars)
  - Submit
  - **Expected**: Success message, status = PENDING

- [ ] **Scenario 2: EL without sufficient notice**
  - Same as above but select dates only 5 days in future
  - **Expected**: Error "Earned leave requires 15 days advance notice"

- [ ] **Scenario 3: CL exceeding consecutive limit**
  - Select CASUAL leave
  - Select 5 consecutive days
  - **Expected**: Error "Casual leave limited to 3 consecutive days"

- [ ] **Scenario 4: Medical leave >3 days with certificate**
  - Select MEDICAL leave
  - Select 5 days
  - Upload medical certificate (PDF)
  - **Expected**: Success

- [ ] **Scenario 5: Medical leave >3 days without certificate**
  - Select MEDICAL leave
  - Select 5 days
  - Don't upload certificate
  - **Expected**: Error "Medical certificate required for >3 days"

#### Approval Workflow

- [ ] **Scenario 6: HR Admin forwards to Dept Head**
  - Login as HR_ADMIN
  - View pending approvals
  - Click Forward on leave request
  - **Expected**: Status remains PENDING, forwarded to DEPT_HEAD

- [ ] **Scenario 7: HR Head approves request**
  - Login as HR_HEAD
  - View pending approvals
  - Click Approve
  - Enter comment
  - Confirm
  - **Expected**: Status changes to APPROVED

- [ ] **Scenario 8: Prevent self-approval**
  - Login as HR_HEAD (who created leave request)
  - Try to approve own request
  - **Expected**: Error "Cannot approve own request"

#### 2FA Authentication

- [ ] **Scenario 9: Successful 2FA login**
  - Enter email and password
  - Receive OTP email
  - Enter correct OTP
  - **Expected**: Login successful, redirect to dashboard

- [ ] **Scenario 10: Invalid OTP**
  - Enter wrong OTP code
  - **Expected**: Error "Invalid code. 2 attempts remaining"

- [ ] **Scenario 11: OTP resend**
  - Wait 60 seconds
  - Click Resend Code
  - **Expected**: New OTP email received

### Exploratory Testing Checklist

- [ ] Test all pages without JavaScript enabled
- [ ] Test with browser zoom at 200%
- [ ] Test with screen reader (NVDA, JAWS)
- [ ] Test on slow 3G connection
- [ ] Test with ad blockers enabled
- [ ] Test back button navigation
- [ ] Test browser refresh mid-flow
- [ ] Test with cookies disabled
- [ ] Test concurrent sessions (multiple tabs)

---

## Performance Testing

### Tools

- **Load Testing**: Apache Bench (ab), K6
- **Profiling**: Chrome DevTools, Lighthouse
- **Monitoring**: Web Vitals

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load (LCP) | <2.5s | <4.0s |
| Time to Interactive (TTI) | <3.5s | <5.0s |
| First Input Delay (FID) | <100ms | <300ms |
| API Response Time | <500ms | <1000ms |
| Database Query Time | <100ms | <500ms |

### Load Testing

```bash
# Test API endpoint
ab -n 1000 -c 10 https://lms.cdbl.com/api/leaves

# Expected:
# - Requests per second: >100
# - Mean response time: <500ms
# - 99th percentile: <1000ms
# - 0% failed requests
```

### Performance Test Scenarios

```javascript
// K6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Login
  let loginRes = http.post('https://lms.cdbl.com/api/login', {
    email: 'test@cdbl.com',
    password: 'password123'
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login under 500ms': (r) => r.timings.duration < 500,
  });

  // Get balances
  let balanceRes = http.get('https://lms.cdbl.com/api/balance/mine', {
    headers: { cookie: loginRes.headers['Set-Cookie'] }
  });

  check(balanceRes, {
    'balance retrieved': (r) => r.status === 200,
    'balance under 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

---

## Security Testing

### Vulnerability Scanning

```bash
# NPM audit
npm audit

# Fix vulnerabilities
npm audit fix

# OWASP Dependency Check
npx dependency-check --project CDBL-LMS --scan .
```

### Security Test Cases

- [ ] **SQL Injection**: Try `' OR '1'='1` in inputs
- [ ] **XSS**: Try `<script>alert('XSS')</script>` in text fields
- [ ] **CSRF**: Test API calls without valid JWT
- [ ] **Session Hijacking**: Test JWT expiration
- [ ] **Brute Force**: Test rate limiting on login
- [ ] **Authorization Bypass**: Try accessing admin APIs as employee
- [ ] **File Upload**: Try uploading executable files (.exe, .sh)
- [ ] **Path Traversal**: Try `../../../etc/passwd` in file paths

### Authentication Security

```typescript
// Security test examples
test('should reject requests without JWT', async () => {
  const res = await fetch('/api/leaves', { method: 'GET' });
  expect(res.status).toBe(401);
});

test('should reject expired JWT', async () => {
  const expiredJWT = generateJWT({ userId: 1 }, { expiresIn: '-1h' });
  const res = await fetch('/api/leaves', {
    headers: { cookie: `jwt=${expiredJWT}` }
  });
  expect(res.status).toBe(401);
});

test('should enforce rate limiting on login', async () => {
  for (let i = 0; i < 6; i++) {
    await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@cdbl.com', password: 'wrong' })
    });
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@cdbl.com', password: 'password' })
  });

  expect(res.status).toBe(429); // Too many requests
});
```

---

## Accessibility Testing

### Tools

- **Automated**: axe DevTools, Lighthouse
- **Manual**: NVDA, JAWS, VoiceOver screen readers
- **Checklist**: WCAG 2.1 AA compliance

### Automated Tests

```typescript
// Using jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('LoginPage should have no accessibility violations', async () => {
  const { container } = render(<LoginPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

- [ ] All interactive elements keyboard accessible
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Form inputs have labels
- [ ] Error messages associated with inputs
- [ ] Focus indicators visible
- [ ] Skip navigation links work
- [ ] Screen reader announces dynamic content
- [ ] No keyboard traps
- [ ] Headings in logical order

---

## Test Data Management

### Test Database

```bash
# Create test database
mysql -u root -p
CREATE DATABASE cdbl_test;

# Run migrations
DATABASE_URL="mysql://root:password@localhost:3306/cdbl_test" npx prisma migrate deploy

# Seed test data
DATABASE_URL="mysql://root:password@localhost:3306/cdbl_test" npx prisma db seed
```

### Test Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| employee@cdbl.com | password123 | EMPLOYEE | Basic leave requests |
| depthead@cdbl.com | password123 | DEPT_HEAD | Approval testing |
| hradmin@cdbl.com | password123 | HR_ADMIN | Admin operations |
| hrhead@cdbl.com | password123 | HR_HEAD | Final approvals |
| ceo@cdbl.com | password123 | CEO | Executive access |

### Cleanup Strategy

```typescript
// beforeEach hook in tests
beforeEach(async () => {
  await prisma.leaveRequest.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.otpCode.deleteMany();
  // Keep users and balances for faster tests
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpassword
          MYSQL_DATABASE: cdbl_test
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage
        env:
          DATABASE_URL: mysql://root:testpassword@localhost:3306/cdbl_test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: mysql://root:testpassword@localhost:3306/cdbl_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: mysql://root:testpassword@localhost:3306/cdbl_test

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: test-results/
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Test Reports

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### E2E Test Reports

```bash
# Generate Playwright report
npx playwright show-report

# HTML report automatically opens
```

---

## Related Documentation

- **API Testing**: [API Documentation](../api/API-Documentation.md)
- **2FA Testing**: [2FA Setup Guide](../deployment/2FA-Setup-Guide.md)
- **Performance Monitoring**: [Deployment Guide](../deployment/Deployment-Guide.md)

---

**Document Version:** 2.0
**Last Updated:** January 2025
**QA Team:** CDBL Development Team
**Test Framework:** Jest + Playwright + React Testing Library
**Coverage Target:** 80%
