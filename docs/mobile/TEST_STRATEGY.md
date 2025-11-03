# Test Strategy — CDBL iOS App

**Version**: 1.0  
**Last Updated**: 2025-01-30  
**Current Coverage**: 0%

---

## 🎯 Test Objectives

- **Verify policy logic correctness**: Date calculations, validation rules
- **Ensure API compatibility**: Request/response formats match web app
- **Validate offline behavior**: Queue, cache, conflict handling
- **Regression prevention**: Catch breaking changes early
- **Documentation as tests**: Tests serve as usage examples

---

## 📊 Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲     ← 10% (Critical user flows)
                 ╱────────╲
                ╱          ╲
               ╱ Integration ╲  ← 20% (Services, API)
              ╱──────────────╲
             ╱                ╲
            ╱   Unit Tests     ╲ ← 70% (Pure functions, policy logic)
           ╱────────────────────╲
```

### Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 80% | 0% |
| Integration Tests | 60% | 0% |
| UI Tests | 50% | 0% |
| **Overall** | **70%** | **0%** |

---

## 🧪 Unit Tests

### Policy Rules (`Tests/Unit/PolicyRulesTests.swift`)

**Target**: Pure functions, date calculations, validation logic

```swift
import XCTest
@testable import CDBLLeaveCompanion

class WorkingDayCalculatorTests: XCTestCase {
    var calculator: WorkingDayCalculator!
    
    override func setUp() {
        calculator = WorkingDayCalculator()
    }
    
    // Working days calculation
    func testCalculateWorkingDays_ExcludesFridayAndSaturday() {
        // Monday to Thursday
        let start = Date(from: "2025-01-13") // Monday
        let end = Date(from: "2025-01-16")   // Thursday
        
        let result = calculator.countWorkingDays(from: start, to: end)
        XCTAssertEqual(result, 4)
    }
    
    func testCalculateWorkingDays_ExcludesWeekendSpan() {
        let start = Date(from: "2025-01-10") // Friday
        let end = Date(from: "2025-01-13")   // Monday
        
        let result = calculator.countWorkingDays(from: start, to: end)
        XCTAssertEqual(result, 1) // Only Monday
    }
    
    func testCalculateWorkingDays_ExcludesHolidays() {
        let holidays = [
            Holiday(date: "2025-01-15", name: "Test Holiday")
        ]
        
        let start = Date(from: "2025-01-13") // Monday
        let end = Date(from: "2025-01-17")   // Friday
        
        let result = calculator.countWorkingDays(from: start, to: end, excluding: holidays)
        XCTAssertEqual(result, 4) // 5 days - 1 holiday
    }
    
    func testCalculateWorkingDays_EmptyRange() {
        let start = Date(from: "2025-01-13")
        let end = Date(from: "2025-01-13")
        
        let result = calculator.countWorkingDays(from: start, to: end)
        XCTAssertEqual(result, 1) // Same day counts as 1
    }
    
    func testCalculateWorkingDays_InvalidRange() {
        let start = Date(from: "2025-01-17")
        let end = Date(from: "2025-01-13")
        
        let result = calculator.countWorkingDays(from: start, to: end)
        XCTAssertEqual(result, 0) // Invalid range
    }
}
```

**Test Cases to Cover**:

- [x] Working days excluding Fri/Sat
- [ ] Working days excluding holidays
- [ ] Empty range handling
- [ ] Invalid range handling
- [ ] Leap year handling

---

### Validation Rules (`Tests/Unit/ValidationTests.swift`)

```swift
class LeaveRequestValidationTests: XCTestCase {
    func testCasualLeave_MaxConsecutiveDays_Valid() {
        let request = LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-03"),
            reason: "Valid reason for casual leave"
        )
        
        let result = request.validate()
        XCTAssertTrue(result.isValid)
        XCTAssertTrue(result.errors.isEmpty)
    }
    
    func testCasualLeave_MaxConsecutiveDays_Invalid() {
        let request = LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-05"), // 5 days (max 3)
            reason: "This exceeds the limit"
        )
        
        let result = request.validate()
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.contains { $0.contains("3 consecutive days") })
    }
    
    func testEarnedLeave_InsufficientNotice_Valid() {
        let request = LeaveRequest(
            type: .EARNED,
            startDate: Date().addingTimeInterval(10 * 24 * 60 * 60), // 10 days from now
            endDate: Date().addingTimeInterval(15 * 24 * 60 * 60),
            reason: "Valid earned leave request"
        )
        
        // Mock: 10 days = 7 working days (excludes weekends)
        let result = request.validate()
        XCTAssertTrue(result.isValid)
    }
    
    func testEarnedLeave_InsufficientNotice_Invalid() {
        let request = LeaveRequest(
            type: .EARNED,
            startDate: Date().addingTimeInterval(3 * 24 * 60 * 60), // Only 3 days
            endDate: Date().addingTimeInterval(8 * 24 * 60 * 60),
            reason: "Too short notice"
        )
        
        let result = request.validate()
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.contains { $0.contains("5 working days") })
    }
    
    func testMedicalLeave_CertificateRequired_LongDuration() {
        let request = LeaveRequest(
            type: .MEDICAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-05"), // 5 days (>3)
            reason: "Medical treatment",
            needsCertificate: true
        )
        
        let result = request.validate()
        XCTAssertTrue(result.isValid)
    }
    
    func testMedicalLeave_CertificateRequired_Missing() {
        let request = LeaveRequest(
            type: .MEDICAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-05"), // 5 days
            reason: "Medical treatment",
            needsCertificate: false // Missing!
        )
        
        let result = request.validate()
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.contains { $0.contains("certificate") })
    }
    
    func testReason_TooShort() {
        let request = LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-03"),
            reason: "Short" // <10 chars
        )
        
        let result = request.validate()
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.contains { $0.contains("10 characters") })
    }
    
    func testStartEnd_WeekendViolation() {
        let request = LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-01-10"), // Friday
            endDate: Date(from: "2025-01-13"),
            reason: "Weekend violation"
        )
        
        let result = request.validate()
        XCTAssertFalse(result.isValid)
        XCTAssertTrue(result.errors.contains { $0.contains("weekend") })
    }
}
```

**Test Coverage Requirements**:

- [x] CL max 3 consecutive days
- [ ] CL cannot touch Fri/Sat
- [x] EL 5 working days notice
- [x] ML certificate >3 days
- [ ] ML fitness cert >7 days
- [ ] Reason min 10 chars
- [ ] Start/end cannot be Fri/Sat
- [ ] Start/end cannot be holiday
- [ ] Invalid date range
- [ ] Balance checks

---

### Date Calculations (`Tests/Unit/DateCalculatorTests.swift`)

```swift
class DateCalculatorTests: XCTestCase {
    func testNormalizeToDhakaMidnight() {
        let date = Date(from: "2025-01-30T14:30:00Z") // UTC
        let normalized = normalizeToDhakaMidnight(date)
        
        // Should be 00:00:00 in Asia/Dhaka
        XCTAssertEqual(normalized.hour, 0)
        XCTAssertEqual(normalized.minute, 0)
        XCTAssertEqual(normalized.second, 0)
    }
    
    func testDaysInclusive() {
        let start = Date(from: "2025-02-01")
        let end = Date(from: "2025-02-05")
        
        let result = daysInclusive(from: start, to: end)
        XCTAssertEqual(result, 5)
    }
    
    func testDaysInclusive_SameDay() {
        let date = Date(from: "2025-02-01")
        let result = daysInclusive(from: date, to: date)
        XCTAssertEqual(result, 1)
    }
}
```

---

## 🔗 Integration Tests

### Balance Service (`Tests/Integration/BalanceServiceTests.swift`)

```swift
@MainActor
class BalanceServiceTests: XCTestCase {
    var service: BalanceService!
    var mockRepository: MockBalanceRepository!
    
    override func setUp() {
        mockRepository = MockBalanceRepository()
        service = BalanceService(repository: mockRepository)
    }
    
    func testFetchBalances_Success() async throws {
        let expected = LeaveBalance(year: 2025, CASUAL: 10, MEDICAL: 14, EARNED: 45)
        mockRepository.stubBalances = expected
        
        let result = try await service.fetchBalances()
        
        XCTAssertEqual(result, expected)
        XCTAssertTrue(service.isCached)
    }
    
    func testFetchBalances_NetworkError_ReturnsCached() async throws {
        let cached = LeaveBalance(year: 2025, CASUAL: 10, MEDICAL: 14, EARNED: 45)
        service.cache(cached)
        mockRepository.shouldFail = true
        
        let result = try await service.fetchBalances()
        
        XCTAssertEqual(result, cached)
    }
    
    func testFetchBalances_ExpiredCache() async throws {
        let stale = LeaveBalance(year: 2024, CASUAL: 10, MEDICAL: 14, EARNED: 45)
        service.cache(stale, timestamp: Date().addingTimeInterval(-25 * 60 * 60)) // 25h ago
        
        mockRepository.shouldReturnStale = false
        mockRepository.stubBalances = LeaveBalance(year: 2025, CASUAL: 8, MEDICAL: 12, EARNED: 43)
        
        let result = try await service.fetchBalances()
        
        XCTAssertEqual(result.year, 2025)
    }
}
```

---

### API Client (`Tests/Integration/APIClientTests.swift`)

```swift
class APIClientTests: XCTestCase {
    var client: APIClient!
    var mockSession: MockURLSession!
    
    override func setUp() {
        mockSession = MockURLSession()
        client = APIClient(session: mockSession, baseURL: "https://test.cdbl.com")
    }
    
    func testCreateLeave_Success() async throws {
        let request = LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-03"),
            reason: "Valid reason"
        )
        
        mockSession.stubResponse = HTTPURLResponse(
            statusCode: 201,
            headers: ["Content-Type": "application/json"]
        )!
        mockSession.stubData = try JSONEncoder().encode(request)
        
        let result = try await client.createLeave(request)
        
        XCTAssertEqual(result.type, .CASUAL)
        XCTAssertEqual(mockSession.lastRequest?.httpMethod, "POST")
    }
    
    func testCreateLeave_ValidationError() async throws {
        let request = LeaveRequest(...)
        
        mockSession.stubResponse = HTTPURLResponse(statusCode: 400)!
        mockSession.stubData = """
        {
            "error": "cl_exceeds_consecutive_limit",
            "message": "Casual Leave cannot exceed 3 consecutive days"
        }
        """.data(using: .utf8)!
        
        do {
            _ = try await client.createLeave(request)
            XCTFail("Should throw error")
        } catch APIError.validation(let code, _) {
            XCTAssertEqual(code, .clExceedsConsecutiveLimit)
        }
    }
    
    func testCreateLeave_RetryOnFailure() async throws {
        mockSession.requestCount = 0
        mockSession.shouldFail = true
        
        // First 2 attempts fail, 3rd succeeds
        mockSession.onRequest = { _ in
            mockSession.requestCount += 1
            if mockSession.requestCount < 3 {
                throw URLError(.networkConnectionLost)
            }
        }
        
        let request = LeaveRequest(...)
        let result = try await client.createLeave(request)
        
        XCTAssertNotNil(result)
        XCTAssertEqual(mockSession.requestCount, 3)
    }
}
```

---

## 🎨 UI Tests

### Apply Leave Flow (`Tests/UI/ApplyLeaveViewTests.swift`)

```swift
class ApplyLeaveViewTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        app = XCUIApplication()
        app.launch()
    }
    
    func testApplyCasualLeave_Success() {
        // Navigate to Apply
        app.tabBars.buttons["Apply"].tap()
        
        // Select Casual Leave
        app.pickers["Leave Type"].tap()
        app.pickerWheels["CASUAL"].tap()
        
        // Pick dates
        app.datePickers["Start Date"].tap()
        // ... pick 2025-02-01
        app.datePickers["End Date"].tap()
        // ... pick 2025-02-03
        
        // Enter reason
        app.textViews["Reason"].tap()
        app.textViews["Reason"].typeText("Family event requires my presence")
        
        // Check balance summary
        XCTAssertTrue(app.staticTexts["Remaining: 7 day(s)"].exists)
        
        // Submit
        app.buttons["Submit Application"].tap()
        
        // Verify success
        XCTAssertTrue(app.alerts["Success"].waitForExistence(timeout: 2))
    }
    
    func testApplyCasualLeave_TooLongDuration() {
        app.tabBars.buttons["Apply"].tap()
        app.pickers["Leave Type"].tap()
        app.pickerWheels["CASUAL"].tap()
        
        // Pick 5-day range (max is 3)
        app.datePickers["Start Date"].tap()
        // ... pick 2025-02-01
        app.datePickers["End Date"].tap()
        // ... pick 2025-02-05
        
        // Enter reason
        app.textViews["Reason"].typeText("Valid reason text")
        
        // Check error
        XCTAssertTrue(app.staticTexts["Casual Leave cannot exceed 3 consecutive day(s)"].exists)
        
        // Submit button disabled
        XCTAssertFalse(app.buttons["Submit Application"].isEnabled)
    }
    
    func testApplyMedicalLeave_CertificateRequired() {
        app.tabBars.buttons["Apply"].tap()
        app.pickers["Leave Type"].tap()
        app.pickerWheels["MEDICAL"].tap()
        
        // Pick >3 day range
        app.datePickers["Start Date"].tap()
        // ... pick 2025-02-01
        app.datePickers["End Date"].tap()
        // ... pick 2025-02-05
        
        // Enter reason
        app.textViews["Reason"].typeText("Medical treatment required")
        
        // Warning appears
        XCTAssertTrue(app.staticTexts["Attach medical certificate for Sick Leave over 3 days"].exists)
        
        // Attach certificate
        app.buttons["Attach File"].tap()
        // ... select PDF file
        
        // Submit enabled
        XCTAssertTrue(app.buttons["Submit Application"].isEnabled)
    }
}
```

---

## 🎭 Test Fixtures

### Sample Data (`Tests/Fixtures/TestData.swift`)

```swift
extension LeaveRequest {
    static var validCasualRequest: LeaveRequest {
        LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-03"),
            reason: "Family event requires my presence",
            needsCertificate: false
        )
    }
    
    static var invalidCasualRequest_TooLong: LeaveRequest {
        LeaveRequest(
            type: .CASUAL,
            startDate: Date(from: "2025-02-01"),
            endDate: Date(from: "2025-02-05"), // 5 days
            reason: "Valid reason",
            needsCertificate: false
        )
    }
}

extension LeaveBalance {
    static var fresh: LeaveBalance {
        LeaveBalance(year: 2025, CASUAL: 10, MEDICAL: 14, EARNED: 45)
    }
}
```

---

## 📋 Test Coverage Targets

### Phase 1: Policy Logic (Week 1)

- [x] WorkingDayCalculator: 80%
- [ ] LeaveRequest.validate(): 80%
- [ ] Date utilities: 90%

### Phase 2: Services (Week 2)

- [ ] BalanceService: 70%
- [ ] LeaveService: 70%
- [ ] APIClient: 60%

### Phase 3: Integration (Week 3)

- [ ] API integration tests: 60%
- [ ] Sync tests: 50%
- [ ] Conflict resolution: 70%

### Phase 4: UI (Week 4)

- [ ] Apply Leave flow: 50%
- [ ] History view: 40%
- [ ] Dashboard: 30%

---

## 🚀 Running Tests

### Command Line

```bash
# Run all tests
xcodebuild test -scheme CDBLLeaveCompanion -destination 'platform=iOS Simulator,name=iPhone 15'

# Run specific test
xcodebuild test -only-testing:CDBLLeaveCompanionTests/WorkingDayCalculatorTests

# Coverage report
xcodebuild test -enableCodeCoverage YES
xcrun xcov --report --only-targets CDBLLeaveCompanion
```

### CI/CD Integration

```yaml
# .github/workflows/tests.yml
name: iOS Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Test
        run: |
          xcodebuild test \
            -scheme CDBLLeaveCompanion \
            -destination 'platform=iOS Simulator,name=iPhone 15' \
            -enableCodeCoverage YES
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

**Document Status**: ✅ Complete  
**Implementation Status**: ❌ Not Started  
**Last Reviewed**: 2025-01-30

