#!/bin/bash

##############################################################################
#                                                                            #
#  CDBL Leave Management System - Complete Automated Test Suite             #
#  Runs all 117 automated tests and generates report                        #
#                                                                            #
##############################################################################

set -e  # Exit on first error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management"
LOG_FILE="$PROJECT_DIR/test-results.log"
REPORT_FILE="$PROJECT_DIR/TEST_EXECUTION_REPORT.md"
START_TIME=$(date +%s)

# Functions
print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Main execution
main() {
    print_header "CDBL LEAVE MANAGEMENT - AUTOMATED TEST SUITE"

    echo "Date: $(date)"
    echo "Time Started: $(date '+%H:%M:%S')"
    echo "Project: $PROJECT_DIR"
    echo "Log File: $LOG_FILE"

    # Initialize log file
    > "$LOG_FILE"

    # Step 1: Verify prerequisites
    print_section "STEP 1: Verifying Prerequisites"

    verify_node
    verify_npm
    verify_mysql
    verify_directory

    # Step 2: Install dependencies
    print_section "STEP 2: Installing Dependencies"

    cd "$PROJECT_DIR"

    if [ -d "node_modules" ]; then
        print_info "node_modules found, skipping npm install"
    else
        print_info "Installing npm dependencies..."
        npm install >> "$LOG_FILE" 2>&1 || {
            print_error "npm install failed"
            print_warning "Check $LOG_FILE for details"
            return 1
        }
        print_success "Dependencies installed"
    fi

    # Step 3: Reset database
    print_section "STEP 3: Resetting Database"

    print_info "Resetting database..."
    npx prisma migrate reset --force >> "$LOG_FILE" 2>&1 || {
        print_error "Database reset failed"
        print_warning "Check $LOG_FILE for details"
        return 1
    }
    print_success "Database reset successfully"

    # Step 4: Verify test files exist
    print_section "STEP 4: Verifying Test Files"

    verify_test_files

    # Step 5: Run Backend API Tests
    print_section "STEP 5: Running Backend API Tests (39 tests)"

    run_test "backend-api.test.ts" "Backend API Tests"
    BACKEND_RESULT=$?

    # Step 6: Run Frontend Component Tests
    print_section "STEP 6: Running Frontend Component Tests (50 tests)"

    run_test "frontend-components.test.tsx" "Frontend Component Tests"
    FRONTEND_RESULT=$?

    # Step 7: Run Integration Tests
    print_section "STEP 7: Running Integration Tests (28 tests)"

    run_test "integration.test.ts" "Integration Tests"
    INTEGRATION_RESULT=$?

    # Step 8: Generate Report
    print_section "STEP 8: Generating Report"

    generate_report

    # Step 9: Summary
    print_section "TEST EXECUTION SUMMARY"

    print_summary

    # Final status
    TOTAL_TESTS=117
    if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
        print_success "ALL $TOTAL_TESTS TESTS PASSED! ✓"
        echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 TESTING COMPLETE - ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
        return 0
    else
        print_error "SOME TESTS FAILED - Review report for details"
        echo -e "\n${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ✗ TESTING FAILED - See $REPORT_FILE for details${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}\n"
        return 1
    fi
}

verify_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js v18+"
        return 1
    fi
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
}

verify_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        return 1
    fi
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
}

verify_mysql() {
    if ! command -v mysql &> /dev/null; then
        print_warning "MySQL not found in PATH (might still be running)"
        return 0
    fi
    print_success "MySQL found"
}

verify_directory() {
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory not found: $PROJECT_DIR"
        return 1
    fi
    print_success "Project directory found"
}

verify_test_files() {
    TEST_DIR="$PROJECT_DIR/tests"

    if [ ! -f "$TEST_DIR/backend-api.test.ts" ]; then
        print_error "backend-api.test.ts not found"
        return 1
    fi
    print_success "backend-api.test.ts found"

    if [ ! -f "$TEST_DIR/frontend-components.test.tsx" ]; then
        print_error "frontend-components.test.tsx not found"
        return 1
    fi
    print_success "frontend-components.test.tsx found"

    if [ ! -f "$TEST_DIR/integration.test.ts" ]; then
        print_error "integration.test.ts not found"
        return 1
    fi
    print_success "integration.test.ts found"
}

run_test() {
    local test_file=$1
    local test_name=$2

    print_info "Running: $test_name"
    print_info "File: $test_file"

    START=$(date +%s)

    if npm test -- "$test_file" >> "$LOG_FILE" 2>&1; then
        END=$(date +%s)
        DURATION=$((END - START))
        print_success "$test_name completed in ${DURATION}s"
        return 0
    else
        END=$(date +%s)
        DURATION=$((END - START))
        print_error "$test_name failed after ${DURATION}s"
        return 1
    fi
}

generate_report() {
    END_TIME=$(date +%s)
    TOTAL_DURATION=$((END_TIME - START_TIME))
    MINUTES=$((TOTAL_DURATION / 60))
    SECONDS=$((TOTAL_DURATION % 60))

    cat > "$REPORT_FILE" << EOF
# CDBL Leave Management System - Test Execution Report

**Date**: $(date)
**Duration**: ${MINUTES}m ${SECONDS}s
**Status**: $(if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then echo "✓ PASSED"; else echo "✗ FAILED"; fi)

## Test Execution Summary

### Backend API Tests (39 tests)
- **Status**: $(if [ $BACKEND_RESULT -eq 0 ]; then echo "✓ PASSED"; else echo "✗ FAILED"; fi)
- **Tests**: 39
- **Coverage**:
  - Authentication API (4)
  - Leave Request API (6)
  - Leave Balance API (3)
  - Approval Workflow API (5)
  - Holiday Management API (4)
  - Employee Directory API (4)
  - Dashboard API (3)
  - Policy Validation API (2)
  - Notification API (3)
  - Audit Log API (3)
  - Admin API (2)

### Frontend Component Tests (50 tests)
- **Status**: $(if [ $FRONTEND_RESULT -eq 0 ]; then echo "✓ PASSED"; else echo "✗ FAILED"; fi)
- **Tests**: 50
- **Coverage**:
  - Common UI Components (9)
  - Form Components (7)
  - Data Display Components (9)
  - Navigation Components (5)
  - Dashboard Components (5)
  - File Upload Components (7)
  - Search & Filter Components (5)
  - Accessibility Tests (9)
  - Performance Tests (5)

### Integration Tests (28 tests)
- **Status**: $(if [ $INTEGRATION_RESULT -eq 0 ]; then echo "✓ PASSED"; else echo "✗ FAILED"; fi)
- **Tests**: 28
- **Coverage**:
  - Complete Leave Application Workflow (10)
  - Leave Rejection Workflow (4)
  - Leave Cancellation Workflow (4)
  - Multiple Simultaneous Approvals (1)
  - Policy Enforcement (3)
  - Role-Based Access Control (4)
  - Data Consistency (2)

## Overall Results

| Test Suite | Tests | Status |
|-----------|-------|--------|
| Backend API | 39 | $(if [ $BACKEND_RESULT -eq 0 ]; then echo "✓ PASS"; else echo "✗ FAIL"; fi) |
| Frontend | 50 | $(if [ $FRONTEND_RESULT -eq 0 ]; then echo "✓ PASS"; else echo "✗ FAIL"; fi) |
| Integration | 28 | $(if [ $INTEGRATION_RESULT -eq 0 ]; then echo "✓ PASS"; else echo "✗ FAIL"; fi) |
| **TOTAL** | **117** | **$(if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then echo "✓ ALL PASS"; else echo "✗ SOME FAIL"; fi)** |

## Execution Details

- **Start Time**: $(date)
- **Project Directory**: $PROJECT_DIR
- **Log File**: $LOG_FILE
- **Total Duration**: ${MINUTES}m ${SECONDS}s

## Next Steps

$(if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
echo "✓ All automated tests passed!"
echo ""
echo "### Manual Testing"
echo "Follow **TESTING_CHECKLIST.md** for manual testing of:"
echo "- All 6 user roles"
echo "- All 8 features"
echo "- Performance & accessibility"
echo "- Security validation"
else
echo "✗ Some tests failed. Review the log file:"
echo ""
echo "  \`\`\`"
echo "  tail -100 $LOG_FILE"
echo "  \`\`\`"
echo ""
echo "Or view the full log:"
echo ""
echo "  \`\`\`"
echo "  cat $LOG_FILE"
echo "  \`\`\`"
fi)

---

**Generated**: $(date)
**Report**: $REPORT_FILE
EOF

    print_success "Report generated: $REPORT_FILE"
}

print_summary() {
    echo "Backend API Tests:    $(if [ $BACKEND_RESULT -eq 0 ]; then echo -e "${GREEN}✓ 39 PASS${NC}"; else echo -e "${RED}✗ FAILED${NC}"; fi)"
    echo "Frontend Tests:       $(if [ $FRONTEND_RESULT -eq 0 ]; then echo -e "${GREEN}✓ 50 PASS${NC}"; else echo -e "${RED}✗ FAILED${NC}"; fi)"
    echo "Integration Tests:    $(if [ $INTEGRATION_RESULT -eq 0 ]; then echo -e "${GREEN}✓ 28 PASS${NC}"; else echo -e "${RED}✗ FAILED${NC}"; fi)"
    echo ""
    echo "Total Tests:          $(if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then echo -e "${GREEN}✓ 117 PASS${NC}"; else echo -e "${RED}SOME FAILED${NC}"; fi)"
}

# Run main function
main
EXIT_CODE=$?

echo -e "\nExit Code: $EXIT_CODE"
exit $EXIT_CODE
