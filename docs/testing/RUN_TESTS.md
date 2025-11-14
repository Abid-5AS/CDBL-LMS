# How to Run All Tests

**Quick start guide to execute backend and frontend tests**

---

## Prerequisites

```bash
# Check all requirements
npm --version        # v18+
node --version       # v18+
mysql --version      # 8.0+
git --version        # any recent version

# Install dependencies
npm install

# Setup database
npx prisma migrate reset --force
```

---

## Running Tests

### Option 1: Run All Tests (Recommended)

```bash
# Run entire test suite
npm test

# Expected output: All 177+ tests pass
```

### Option 2: Run Specific Test Suite

```bash
# Backend API tests only
npm test -- backend-api.test.ts

# Frontend component tests only
npm test -- frontend-components.test.tsx

# Integration tests only
npm test -- integration.test.ts
```

### Option 3: Run with Different Options

```bash
# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Verbose output
npm test -- --reporter=verbose

# Run single test
npm test -- -t "Test name"
```

---

## Test Files Location

```
tests/
├── backend-api.test.ts          (39 tests)
├── frontend-components.test.tsx (50 tests)
└── integration.test.ts          (28 tests)
```

---

## Expected Output

### Successful Test Run

```
✓ Backend API Tests (39)
  ✓ Authentication (4)
  ✓ Leave Requests (6)
  ✓ Balance (3)
  ✓ Approvals (5)
  ✓ Holidays (4)
  ✓ Employees (4)
  ✓ Dashboard (3)
  ✓ Policies (2)
  ✓ Notifications (3)
  ✓ Audit Logs (3)
  ✓ Admin (2)

✓ Frontend Components (50)
  ✓ Common UI (9)
  ✓ Forms (7)
  ✓ Inputs (5)
  ✓ Tables (7)
  ✓ Modals (5)
  ✓ Navigation (5)
  ✓ Dashboard (5)
  ✓ File Upload (7)
  ✓ Search & Filter (5)

✓ Integration Tests (28)
  ✓ Leave Application Workflow (10)
  ✓ Rejection Workflow (4)
  ✓ Cancellation Workflow (4)
  ✓ Multiple Simultaneous (1)
  ✓ Policy Enforcement (3)
  ✓ RBAC (4)
  ✓ Data Consistency (2)

Test Files  3 passed (3)
Tests:    177 passed (177)
Start:    10:00:00
End:      10:05:32
Duration: 5m 32s
```

---

## Troubleshooting Test Failures

### If Tests Fail

1. **Database Issue**
   ```bash
   # Reset database
   npx prisma migrate reset --force

   # Verify connection
   mysql -u user -p -e "SELECT 1;"
   ```

2. **Missing Dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **Port Conflict**
   ```bash
   # Kill process on port 3000
   lsof -ti :3000 | xargs kill -9

   # Start fresh
   npm run dev
   ```

4. **Vitest Issues**
   ```bash
   # Clear cache
   npm test -- --clearCache

   # Run again
   npm test
   ```

---

## Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/tests.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: cdbl_leave_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'

    - run: npm install
    - run: npx prisma migrate deploy
    - run: npm test
```

---

## Test Coverage Report

```bash
# Generate coverage
npm test -- --coverage

# View HTML report
open coverage/index.html
```

Expected coverage:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## Checking Test Results

### View JSON Report

```bash
# After tests complete
cat test-results.json

# Pretty print
cat test-results.json | jq
```

### View Failed Tests

```bash
# Show only failures
npm test -- --reporter=verbose 2>&1 | grep "FAIL"
```

---

## Manual Testing Checklist

After running automated tests, use [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for:
- Role-based testing
- UI/UX testing
- Accessibility testing
- Performance testing
- Security testing

---

## Performance Benchmarks

Expected performance:
- **Backend API**: < 200ms response time
- **Frontend Render**: < 1s page load
- **Form Submission**: < 2s
- **Database Query**: < 100ms

---

## Next Steps

1. **Run tests**: `npm test`
2. **Check checklist**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
3. **Fix any issues**: See test output
4. **Manual testing**: Follow QA guide
5. **Sign off**: Complete checklist

---

**Status**: ✓ All test scripts ready to run
**Date**: November 14, 2025
