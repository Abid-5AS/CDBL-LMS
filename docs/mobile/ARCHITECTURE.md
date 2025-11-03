# Architecture & Coding Standards — CDBL iOS App

**Version**: 1.0  
**Last Updated**: 2025-01-30  
**Framework**: SwiftUI, CoreData, async/await

---

## 🏗️ Proposed Clean Architecture

### Directory Structure

```
mobile/ios/CDBLLeaveCompanion/CDBLLeaveCompanion/
├── App/
│   ├── CDBLLeaveCompanionApp.swift
│   ├── RootView.swift
│   └── ContentView.swift
│
├── Core/
│   ├── Storage/
│   │   ├── Persistence.swift
│   │   ├── CoreDataStore.swift
│   │   └── KeychainStore.swift
│   │
│   ├── Config/
│   │   ├── AppConfig.swift
│   │   └── Environment.swift
│   │
│   └── Utilities/
│       ├── DateExtensions.swift
│       ├── ColorExtensions.swift
│       └── Logger.swift
│
├── Networking/
│   ├── APIClient.swift
│   ├── APIEndpoints.swift
│   ├── RequestBuilder.swift
│   ├── ResponseDecoder.swift
│   ├── ErrorMapper.swift
│   ├── RetryHandler.swift
│   └── NetworkMonitor.swift
│
├── PolicyRules/
│   ├── LeavePolicyEngine.swift
│   ├── WorkingDayCalculator.swift
│   ├── ValidationRules.swift
│   ├── BalanceCalculator.swift
│   └── PolicyConstants.swift
│
├── Models/
│   ├── Leave/
│   │   ├── LeaveRequest.swift
│   │   ├── LeaveEntity.swift
│   │   ├── LeaveBalance.swift
│   │   └── LeaveStatus.swift
│   │
│   ├── Auth/
│   │   ├── AuthToken.swift
│   │   ├── DeviceInfo.swift
│   │   └── PairingSession.swift
│   │
│   └── Common/
│       ├── Holiday.swift
│       ├── Employee.swift
│       └── Error.swift
│
├── Services/
│   ├── Balance/
│   │   ├── BalanceService.swift
│   │   └── BalanceRepository.swift
│   │
│   ├── Leave/
│   │   ├── LeaveService.swift
│   │   ├── LeaveRepository.swift
│   │   └── LeaveExporter.swift
│   │
│   ├── Sync/
│   │   ├── SyncService.swift
│   │   ├── ConflictResolver.swift
│   │   └── OfflineQueue.swift
│   │
│   ├── Pairing/
│   │   ├── PairingService.swift
│   │   └── QRCodePairing.swift
│   │
│   └── Security/
│       ├── LeaveSigner.swift
│       ├── CryptoService.swift
│       └── KeychainService.swift
│
├── ViewModels/
│   ├── DashboardViewModel.swift
│   ├── ApplyLeaveViewModel.swift
│   ├── HistoryViewModel.swift
│   └── BalanceViewModel.swift
│
├── Views/
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── BalanceCardView.swift
│   │   └── AnalyticsView.swift
│   │
│   ├── Apply/
│   │   ├── ApplyLeaveView.swift
│   │   ├── DateRangePicker.swift
│   │   ├── ReasonInputView.swift
│   │   └── CertificateUploadView.swift
│   │
│   ├── MyRequests/
│   │   ├── MyRequestsView.swift
│   │   ├── RequestDetailView.swift
│   │   └── TimelineView.swift
│   │
│   ├── Pairing/
│   │   ├── PairingView.swift
│   │   └── QRScannerView.swift
│   │
│   └── Settings/
│       ├── SettingsView.swift
│       └── AboutView.swift
│
├── UI/
│   ├── Components/
│   │   ├── GlassCard.swift
│   │   ├── GlassButton.swift
│   │   ├── PolicyChip.swift
│   │   └── BadgeView.swift
│   │
│   ├── DesignSystem/
│   │   ├── StyleGuide.swift
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   └── Spacing.swift
│   │
│   └── Utilities/
│       ├── HapticFeedback.swift
│       └── ParallaxBackground.swift
│
└── Tests/
    ├── Unit/
    │   ├── PolicyRulesTests.swift
    │   ├── ValidationTests.swift
    │   └── DateCalculatorTests.swift
    │
    ├── Integration/
    │   ├── BalanceServiceTests.swift
    │   └── LeaveServiceTests.swift
    │
    └── UI/
        ├── ApplyLeaveViewTests.swift
        └── DashboardViewTests.swift
```

---

## 📐 Architecture Principles

### 1. **Separation of Concerns**

- **Views**: SwiftUI presentation only, no business logic
- **ViewModels**: State management and user interaction
- **Services**: Business logic and API calls
- **Repositories**: Data access abstraction
- **Models**: Data structures and validation

### 2. **Dependency Injection**

```swift
// Bad: Hard dependency
class LeaveService {
    func fetchLeaves() async throws -> [Leave] {
        // Direct API call
    }
}

// Good: Dependency injection
class LeaveService {
    let repository: LeaveRepository
    
    init(repository: LeaveRepository) {
        self.repository = repository
    }
    
    func fetchLeaves() async throws -> [Leave] {
        try await repository.getAll()
    }
}
```

### 3. **Protocol-Based Design**

```swift
protocol BalanceRepository {
    func getBalances() async throws -> LeaveBalance
    func cache(_ balances: LeaveBalance)
}

class APIBalanceRepository: BalanceRepository {
    let apiClient: APIClient
    
    func getBalances() async throws -> LeaveBalance {
        // Fetch from API
    }
}

class MockBalanceRepository: BalanceRepository {
    func getBalances() async throws -> LeaveBalance {
        // Return mock data
    }
}
```

---

## 🔌 Error Model Contract

### Standardized Error Response

```swift
struct APIError: Codable, Error {
    let error: String           // Error code (e.g., "el_insufficient_notice")
    let message: String?        // User-friendly message
    let traceId: String         // For server-side debugging
    let timestamp: String       // ISO8601
    let additionalFields: [String: Any]? // Capability extensions
}

struct ErrorResponse: Codable {
    let error: String
    let message: String?
    let traceId: String
    let timestamp: String
}
```

### Error Mapping

```swift
// Networking/ErrorMapper.swift

enum ServerErrorCode: String {
    // Authentication
    case unauthorized = "unauthorized"
    case forbidden = "forbidden"
    
    // Validation
    case invalidDates = "invalid_dates"
    case invalidInput = "invalid_input"
    
    // Earned Leave
    case elInsufficientNotice = "el_insufficient_notice"
    case elCarryCapExceeded = "el_carry_cap_exceeded"
    
    // Casual Leave
    case clExceedsConsecutiveLimit = "cl_exceeds_consecutive_limit"
    case clAnnualCapExceeded = "cl_annual_cap_exceeded"
    case clCannotTouchHoliday = "cl_cannot_touch_holiday"
    
    // Medical Leave
    case medicalCertificateRequired = "medical_certificate_required"
    case mlAnnualCapExceeded = "ml_annual_cap_exceeded"
    case fitnessCertificateRequired = "fitness_certificate_required"
    
    // Balance
    case insufficientBalance = "insufficient_balance"
}

class ErrorMapper {
    static func mapErrorCode(_ code: String) -> ServerErrorCode? {
        return ServerErrorCode(rawValue: code)
    }
    
    static func getUserFriendlyMessage(for code: ServerErrorCode) -> String {
        switch code {
        case .elInsufficientNotice:
            return "Earned Leave requires at least 5 working days advance notice"
        case .clExceedsConsecutiveLimit:
            return "Casual Leave cannot exceed 3 consecutive days per spell"
        // ... map all error codes
        default:
            return "An error occurred. Please try again."
        }
    }
}
```

---

## 🔄 Concurrency Rules

### 1. **Async/Await Priority**

Use Swift concurrency (`async/await`) for all asynchronous operations:

```swift
// Good: Swift concurrency
func fetchBalances() async throws -> LeaveBalance {
    let response = try await apiClient.get("/api/balance/mine")
    return try response.decode(LeaveBalance.self)
}

// Avoid: Completion handlers (only if legacy code)
func fetchBalances(completion: @escaping (Result<LeaveBalance, Error>) -> Void) {
    // Only for interoperability
}
```

### 2. **Task Cancellation**

Always support task cancellation:

```swift
class BalanceService {
    private var currentTask: Task<LeaveBalance, Error>?
    
    func fetchBalances() async throws -> LeaveBalance {
        // Cancel previous task
        currentTask?.cancel()
        
        currentTask = Task {
            try await repository.getBalances()
        }
        
        return try await currentTask!.value
    }
}
```

### 3. **Actor Isolation**

Use actors for shared mutable state:

```swift
actor BalanceCache {
    private var cachedBalances: LeaveBalance?
    private var lastUpdate: Date?
    
    func getCachedBalances() -> LeaveBalance? {
        cachedBalances
    }
    
    func update(_ balances: LeaveBalance) {
        cachedBalances = balances
        lastUpdate = Date()
    }
}
```

---

## 🔁 Retry & Backoff Strategy

### Exponential Backoff

```swift
// Networking/RetryHandler.swift

struct RetryHandler {
    private let maxRetries: Int
    private let baseDelay: TimeInterval
    
    init(maxRetries: Int = 3, baseDelay: TimeInterval = 1.0) {
        self.maxRetries = maxRetries
        self.baseDelay = baseDelay
    }
    
    func execute<T>(
        maxAttempts: Int? = nil,
        shouldRetry: @escaping (Error) -> Bool
    ) -> AsyncThrowingStream<T, Error> {
        AsyncThrowingStream { continuation in
            let attempts = maxAttempts ?? maxRetries
            Task {
                var attempt = 0
                while attempt < attempts {
                    do {
                        let result = try await performOperation()
                        continuation.yield(result)
                        continuation.finish()
                        return
                    } catch {
                        if !shouldRetry(error) || attempt == attempts - 1 {
                            continuation.finish(throwing: error)
                            return
                        }
                        let delay = baseDelay * pow(2.0, Double(attempt))
                        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        attempt += 1
                    }
                }
            }
        }
    }
}
```

### Circuit Breaker (Future)

```swift
class CircuitBreaker {
    private var failureCount = 0
    private var lastFailureTime: Date?
    private var isOpen = false
    
    let failureThreshold = 5
    let timeout: TimeInterval = 60
    
    func execute<T>(_ operation: @escaping () async throws -> T) async throws -> T {
        if isOpen {
            if let lastFailure = lastFailureTime, Date().timeIntervalSince(lastFailure) > timeout {
                isOpen = false // Half-open state
            } else {
                throw CircuitBreakerError.open
            }
        }
        
        do {
            let result = try await operation()
            failureCount = 0 // Success, reset count
            return result
        } catch {
            failureCount += 1
            lastFailureTime = Date()
            
            if failureCount >= failureThreshold {
                isOpen = true
            }
            throw error
        }
    }
}
```

---

## 💾 State Management Rules

### 1. **ViewModels (ObservableObject)**

- **Responsibility**: Own application state, coordinate services
- **Lifecycle**: Per-view, destroyed when view unmounts
- **Pattern**: `@Published` properties, `@MainActor` for UI updates

```swift
@MainActor
class ApplyLeaveViewModel: ObservableObject {
    @Published var selectedType: LeaveType = .CASUAL
    @Published var startDate = Date()
    @Published var endDate = Date()
    @Published var reason = ""
    @Published var errors: [ValidationError] = []
    @Published var isSubmitting = false
    
    private let leaveService: LeaveService
    private let policyEngine: LeavePolicyEngine
    
    func validateAndSubmit() async {
        isSubmitting = true
        defer { isSubmitting = false }
        
        // Validate using policy engine
        let validation = await policyEngine.validate(
            type: selectedType,
            startDate: startDate,
            endDate: endDate,
            reason: reason
        )
        
        if !validation.isValid {
            errors = validation.errors
            return
        }
        
        // Submit
        do {
            try await leaveService.create(request)
        } catch {
            // Handle error
        }
    }
}
```

### 2. **Immutable Models**

Models should be value types (structs) and immutable where possible:

```swift
struct LeaveRequest: Codable, Identifiable {
    let id: UUID
    let type: LeaveType
    let startDate: Date
    let endDate: Date
    let workingDays: Int
    let reason: String
    let needsCertificate: Bool
    let status: LeaveStatus
    
    // Computed properties only, no mutating methods
    var isApproved: Bool { status == .APPROVED }
}
```

### 3. **Dependency Injection**

Use environment and initializer injection:

```swift
// App level
@main
struct CDBLLeaveCompanionApp: App {
    let container = PersistenceController.shared
    let apiClient = APIClient(baseURL: AppConfig.shared.apiURL)
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.managedObjectContext, container.viewContext)
                .environmentObject(apiClient)
        }
    }
}

// View level
struct ApplyLeaveView: View {
    @EnvironmentObject var apiClient: APIClient
    @StateObject var viewModel: ApplyLeaveViewModel
    
    init(viewModel: ApplyLeaveViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
}
```

---

## 📝 Logging & Redaction Policy

### 1. **Unified Logger**

```swift
// Core/Utilities/Logger.swift

import OSLog

extension Logger {
    private static var subsystem = Bundle.main.bundleIdentifier!
    
    static let api = Logger(subsystem: subsystem, category: "API")
    static let policy = Logger(subsystem: subsystem, category: "Policy")
    static let storage = Logger(subsystem: subsystem, category: "Storage")
    static let security = Logger(subsystem: subsystem, category: "Security")
}

// Usage
Logger.api.info("Fetching balances from \(url.absoluteString, privacy: .public)")
Logger.policy.error("Validation failed: \(error.localizedDescription, privacy: .public)")
Logger.security.fault("Keychain access failed: \(error.localizedDescription, privacy: .private)")
```

### 2. **PII Redaction**

Never log sensitive data:

```swift
// Bad
Logger.api.info("User email: \(user.email)")
Logger.storage.error("Password: \(password)")

// Good
Logger.api.info("User logged in: \(user.email.hashValue, privacy: .private)")
Logger.storage.error("Authentication failed")

// Date redaction
Logger.api.info("Leave dates: \(formatDateRange(start, end), privacy: .private)")
```

### 3. **Log Levels**

- **Debug**: Development only, verbose diagnostic info
- **Info**: Normal operation events (API calls, user actions)
- **Error**: Recoverable errors (validation failures, network timeouts)
- **Fault**: Unrecoverable errors (keychain failures, crashes)

---

## 🧪 Testing Strategy

### Unit Tests

```swift
// Tests/Unit/PolicyRulesTests.swift

import XCTest
@testable import CDBLLeaveCompanion

class WorkingDayCalculatorTests: XCTestCase {
    func testCalculateWorkingDays_ExcludesWeekends() {
        let calculator = WorkingDayCalculator()
        
        // Monday to Friday (5 days)
        let start = Date(from: "2025-01-13") // Monday
        let end = Date(from: "2025-01-17")   // Friday
        
        let result = calculator.countWorkingDays(from: start, to: end)
        XCTAssertEqual(result, 5)
    }
    
    func testCalculateWorkingDays_ExcludesHolidays() {
        let calculator = WorkingDayCalculator()
        let holidays = [Holiday(date: "2025-01-15", name: "Test")]
        
        let start = Date(from: "2025-01-13")
        let end = Date(from: "2025-01-17")
        
        let result = calculator.countWorkingDays(from: start, to: end, excluding: holidays)
        XCTAssertEqual(result, 4) // 5 - 1 holiday
    }
}
```

### Integration Tests

```swift
// Tests/Integration/BalanceServiceTests.swift

class BalanceServiceTests: XCTestCase {
    var service: BalanceService!
    var mockRepository: MockBalanceRepository!
    
    override func setUp() {
        mockRepository = MockBalanceRepository()
        service = BalanceService(repository: mockRepository)
    }
    
    @MainActor
    func testFetchBalances_CachesSuccessfully() async throws {
        let expectedBalance = LeaveBalance(year: 2025, CASUAL: 10, MEDICAL: 14, EARNED: 45)
        mockRepository.stubBalance = expectedBalance
        
        let result = try await service.fetchBalances()
        
        XCTAssertEqual(result, expectedBalance)
        XCTAssertTrue(service.isCached)
    }
}
```

---

## 📖 Naming Conventions

### Files & Directories
- **PascalCase**: `ApplyLeaveView.swift`, `BalanceService.swift`
- **Descriptive**: `LeaveRequestDetailViewController.swift` (not `DetailVC.swift`)

### Classes & Structs
- **PascalCase**: `LeaveRequest`, `BalanceService`, `WorkingDayCalculator`

### Functions & Variables
- **camelCase**: `fetchBalances()`, `isSubmitting`, `selectedDateRange`

### Constants
- **camelCase**: `maxRetries`, `defaultTimeout`
- **UPPER_CASE**: Only for true compile-time constants `MAX_RETRY_ATTEMPTS = 3`

---

## ✅ Code Review Checklist

- [ ] No business logic in Views
- [ ] All async calls use `async/await`, not completion handlers
- [ ] Error handling is comprehensive
- [ ] No force unwraps (`!`) without justification
- [ ] All sensitive data is redacted in logs
- [ ] State is managed via ViewModels
- [ ] Dependencies are injected
- [ ] Unit tests for policy logic
- [ ] UI tests for critical flows

---

**Document Status**: ✅ Complete  
**Review Required**: Yes (tech lead)  
**Last Reviewed**: 2025-01-30

