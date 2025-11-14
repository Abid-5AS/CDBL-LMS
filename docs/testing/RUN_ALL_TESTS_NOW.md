# Run All Tests Now! 🚀

**Complete automated testing in one command**

---

## Quick Start (30 seconds)

Open Terminal and run:

```bash
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management
./run-all-tests.sh
```

That's it! The script will:

✅ Verify all prerequisites (Node, npm, MySQL)
✅ Install dependencies
✅ Reset the database
✅ Run all 117 automated tests
✅ Generate a comprehensive report

---

## What Happens

```
Step 1: Verify Prerequisites (5 sec)
   ├─ Node.js ✓
   ├─ npm ✓
   ├─ MySQL ✓
   └─ Project directory ✓

Step 2: Install Dependencies (30-60 sec)
   └─ npm install ✓

Step 3: Reset Database (10 sec)
   └─ Database reset & seeded ✓

Step 4-7: Run All Tests (5-10 min)
   ├─ Backend API Tests (39 tests) ✓
   ├─ Frontend Component Tests (50 tests) ✓
   └─ Integration Tests (28 tests) ✓

Step 8: Generate Report (5 sec)
   └─ Report saved to TEST_EXECUTION_REPORT.md ✓

TOTAL TIME: ~15 minutes
```

---

## Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║  CDBL LEAVE MANAGEMENT - AUTOMATED TEST SUITE                 ║
╚════════════════════════════════════════════════════════════════╝

Date: [Current Date]
Time Started: [Current Time]
Project: /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management
Log File: test-results.log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Verifying Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Node.js found: v18.x.x
✓ npm found: 9.x.x
✓ MySQL found
✓ Project directory found

[... more steps ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: Running Backend API Tests (39 tests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Running: Backend API Tests
ℹ File: backend-api.test.ts
✓ Backend API Tests completed in 120s

[... Frontend & Integration tests ...]

═══════════════════════════════════════════════════════════════
  🎉 TESTING COMPLETE - ALL TESTS PASSED!
═══════════════════════════════════════════════════════════════
```

---

## After Tests Complete

### View Detailed Report

```bash
# View the generated report
cat TEST_EXECUTION_REPORT.md

# View the full log
cat test-results.log

# View last 50 lines of log
tail -50 test-results.log
```

### Expected Results

- **Backend API Tests**: 39/39 ✓
- **Frontend Component Tests**: 50/50 ✓
- **Integration Tests**: 28/28 ✓
- **TOTAL**: 117/117 ✓

### Success Message

```
═══════════════════════════════════════════════════════════════
  🎉 TESTING COMPLETE - ALL TESTS PASSED!
═══════════════════════════════════════════════════════════════
```

---

## If Tests Fail

### View Error Log

```bash
# Full log
cat test-results.log

# Last 100 lines
tail -100 test-results.log

# Search for errors
grep -i "error\|fail" test-results.log
```

### Common Issues & Fixes

#### 1. "MySQL not found" or connection error
```bash
# Start MySQL (Mac with Homebrew)
brew services start mysql-server

# Then run tests again
./run-all-tests.sh
```

#### 2. "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Run tests again
./run-all-tests.sh
```

#### 3. "npm not found"
```bash
# Check if Node is installed
node --version

# If not, install from nodejs.org
# Then run tests again
./run-all-tests.sh
```

#### 4. "Permission denied" error
```bash
# Make script executable
chmod +x run-all-tests.sh

# Run tests again
./run-all-tests.sh
```

---

## What the Script Does

### Verification Phase
- ✓ Checks Node.js is installed
- ✓ Checks npm is available
- ✓ Checks MySQL is running
- ✓ Checks project directory exists

### Setup Phase
- ✓ Installs npm dependencies (if needed)
- ✓ Resets database (clears old data)
- ✓ Seeds test data (7 users, balances, holidays)
- ✓ Verifies all test files exist

### Testing Phase
- ✓ Runs 39 Backend API tests
- ✓ Runs 50 Frontend Component tests
- ✓ Runs 28 Integration tests

### Reporting Phase
- ✓ Generates comprehensive report
- ✓ Shows summary of results
- ✓ Saves detailed log file
- ✓ Creates TEST_EXECUTION_REPORT.md

---

## Files Generated

After running the script, you'll have:

```
test-results.log              ← Complete test output log
TEST_EXECUTION_REPORT.md      ← Formatted report with results
```

---

## Next Steps After Testing

### If All Tests Pass (117/117 ✓)

1. **Review the Report**
   ```bash
   cat TEST_EXECUTION_REPORT.md
   ```

2. **Do Manual Testing**
   - Follow: TESTING_CHECKLIST.md
   - Test all 6 user roles
   - Test all 8 features
   - Verify accessibility & performance

3. **Complete Sign-Off**
   - Fill in sign-off section in TESTING_CHECKLIST.md
   - Document any issues found
   - Get approval

### If Some Tests Fail

1. **Review Errors**
   ```bash
   tail -100 test-results.log
   ```

2. **Check Test Details**
   - Open the failing test file
   - Review the specific test that failed
   - Check logs for error messages

3. **Run Specific Test**
   ```bash
   npm test -- backend-api.test.ts
   npm test -- frontend-components.test.tsx
   npm test -- integration.test.ts
   ```

4. **Get Help**
   - See TROUBLESHOOTING section below
   - Review RUN_TESTS.md
   - Check test file for details

---

## Troubleshooting

### "command not found: ./run-all-tests.sh"

**Solution**:
```bash
# Make sure you're in the right directory
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management

# Make script executable
chmod +x run-all-tests.sh

# Run it
./run-all-tests.sh
```

### "npm ERR! code ELIFECYCLE"

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
./run-all-tests.sh
```

### "Error: connect ECONNREFUSED 127.0.0.1:3306"

**Solution** (MySQL not running):
```bash
# Start MySQL
brew services start mysql-server

# Wait a few seconds, then run
./run-all-tests.sh
```

### Tests hang/don't complete

**Solution**:
```bash
# Stop the script (Ctrl+C)
# Check if MySQL is responsive
mysql -u user -p -e "SELECT 1;"

# If that fails, restart MySQL
brew services restart mysql-server

# Try again
./run-all-tests.sh
```

---

## Script Features

✅ **Automated** - No manual steps needed
✅ **Comprehensive** - Runs all 117 tests
✅ **Error Handling** - Catches and reports issues
✅ **Progress Reporting** - Shows what's happening
✅ **Detailed Logging** - Saves full output to log file
✅ **Report Generation** - Creates professional report
✅ **Color Output** - Easy-to-read terminal colors
✅ **Time Tracking** - Shows how long each step takes

---

## Getting Help

### For Test Execution
See: **RUN_TESTS.md**

### For Manual Testing
See: **TESTING_CHECKLIST.md**

### For Quick Reference
See: **TESTING_QUICK_START.txt**

### For Master Index
See: **TESTING_INDEX.md**

---

## Summary

```
One Command:     ./run-all-tests.sh
Tests Run:       117 automated tests
Time Required:   ~15 minutes
Output:          TEST_EXECUTION_REPORT.md + test-results.log
Success:         When you see "🎉 TESTING COMPLETE - ALL TESTS PASSED!"
```

---

## Ready? Go!

```bash
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management
./run-all-tests.sh
```

**Let the tests run! You'll have results in ~15 minutes.** ✨

---

**Need help?** Check TESTING_INDEX.md for full documentation.
