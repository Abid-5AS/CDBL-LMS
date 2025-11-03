# Security & Compliance — CDBL iOS App

**Version**: 1.0  
**Last Updated**: 2025-01-30  
**Standard**: ISO 27001 alignment

---

## 🎯 Security Objectives

- **Minimize PII exposure**: Collect only necessary employee data
- **Short-lived tokens**: Rapid expiry and rotation
- **Full audit trail**: Every action logged and traceable
- **Device binding**: Prevent unauthorized access
- **Offline-first**: Security without network dependency

---

## 🔐 Authentication & Authorization

### Least-Privilege Scopes

Mobile app sessions have **limited permissions** compared to web app:

| Capability | Web App | iOS App | Rationale |
|------------|---------|---------|-----------|
| View own balance | ✅ | ✅ | Core feature |
| Apply leave | ✅ | ✅ | Core feature |
| View own requests | ✅ | ✅ | Core feature |
| Cancel own pending | ✅ | ✅ | Employee right |
| Approve others | ✅ | ❌ | Manager-only, desktop only |
| Manage holidays | ✅ | ❌ | HR-only, desktop only |
| View all employees | ✅ | ❌ | Privacy, desktop only |
| Export reports | ✅ | ❌ | Audit required, desktop only |

**Implementation**:

```swift
struct SessionScope {
    let userId: Int
    let role: AppRole
    let capabilities: Set<Capability>
    let expiresAt: Date
}

enum Capability: String {
    case viewBalance
    case applyLeave
    case viewOwnRequests
    case cancelPending
    case syncOffline
}

// Authorization check
func canPerform(_ capability: Capability) -> Bool {
    session.capabilities.contains(capability)
}
```

### Token Management

**Token Rotation**:

```swift
class TokenManager {
    private var currentToken: String?
    private var refreshTask: Task<Void, Never>?
    
    func refreshIfNeeded() async {
        guard let token = currentToken,
              let expiry = extractExpiry(token),
              Date().addingTimeInterval(300) > expiry else {
            return
        }
        
        // Refresh 5 minutes before expiry
        do {
            currentToken = try await refreshAccessToken()
        } catch {
            // Refresh failed, invalidate session
            await handleTokenExpiry()
        }
    }
}
```

**Scope Validation**:

```swift
// Verify token on every API call
func makeRequest<T>(_ endpoint: String, expecting: T.Type) async throws -> T {
    guard let token = currentToken,
          !isExpired(token),
          hasRequiredScope(for: endpoint) else {
        throw AuthError.unauthorized
    }
    
    return try await apiClient.request(endpoint, token: token)
}
```

---

## 🔒 Keychain Storage

### Secure Storage Strategy

```swift
// Core/Storage/KeychainStore.swift

class KeychainStore {
    private let service = "com.cdbl.leavecompanion"
    
    // Device signing key (first launch)
    func storeDeviceKey(_ key: SymmetricKey) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "deviceSigningKey",
            kSecValueData as String: key.data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete old key
        SecItemDelete(query as CFDictionary)
        
        // Add new key
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.storeFailed(status)
        }
    }
    
    // Session token
    func storeSession(_ token: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "sessionToken",
            kSecValueData as String: token.data(using: .utf8)!,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.storeFailed(status)
        }
    }
}
```

**Keychain Access Control**:

| Data | Access Control | Reason |
|------|---------------|---------|
| Device Signing Key | `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` | Cannot backup, device-bound |
| Session Token | `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` | Prevents remote extraction |
| Refresh Token | `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` | Sensitive |
| Device ID | `kSecAttrAccessibleAfterFirstUnlock` | Non-sensitive, persistent |

---

## 🛡️ Device Binding

### Device Binding Mechanism

```swift
struct DeviceInfo {
    let deviceId: String        // UUIDv4 (generated on first launch)
    let publicKey: String       // ECDSA P-256 public key
    let fingerprint: String     // Hardware fingerprint
    let registeredAt: Date
    let lastSeen: Date
}

// Generate device info on first launch
func generateDeviceInfo() -> DeviceInfo {
    let keyPair = try P256.Signing.PrivateKey()
    let fingerprint = generateHardwareFingerprint()
    
    return DeviceInfo(
        deviceId: UUID().uuidString,
        publicKey: keyPair.publicKey.rawRepresentation.base64EncodedString(),
        fingerprint: fingerprint,
        registeredAt: Date(),
        lastSeen: Date()
    )
}

func generateHardwareFingerprint() -> String {
    let components = [
        UIDevice.current.identifierForVendor?.uuidString ?? "",
        UIDevice.current.model,
        UIDevice.current.systemVersion
    ].joined()
    
    return SHA256.hash(data: components.data(using: .utf8)!)
        .hexString
}
```

**Unlink & Remote Revoke**:

```swift
class DeviceBinding {
    func unlinkLocal() async {
        // Clear local state
        try keychainStore.deleteDeviceKey()
        try keychainStore.deleteSession()
        try coreData.deleteDeviceRecord()
        
        // Notify server (if online)
        try? await apiClient.unlinkDevice(deviceInfo.deviceId)
    }
    
    func handleRemoteRevocation() {
        // Server revoked this device
        unlinkLocal()
        
        // Show security alert
        await showAlert(
            title: "Device Unlinked",
            message: "This device has been remotely unlinked for security reasons."
        )
    }
}
```

---

## 📊 Data Retention & PII Handling

### Data Retention Policy

| Data Type | Retention Period | Disposal Method |
|-----------|------------------|-----------------|
| Leave Requests | 7 years | Hard delete |
| Audit Logs | 3 years | Hard delete |
| Session Tokens | 7 days | Auto-expire |
| Device Records | Until unlink | On unlink |
| Cached Balances | 24 hours | Invalidate |
| Holiday Cache | 1 year | Refresh on next fetch |
| Crash Reports | 90 days | Auto-delete |

### PII Redaction

**Personal Information Categories**:

```swift
enum PIILevel {
    case public      // OK to log in plain text
    case internal    // Mask in logs
    case sensitive   // Never log, encrypt
    case restricted  // Delete after use
}

extension LeaveRequest {
    var sanitized: LeaveRequestSanitized {
        LeaveRequestSanitized(
            id: id.uuidString.prefix(8) + "...",
            type: type,
            startDate: startDate,
            endDate: endDate,
            reason: "[REDACTED]",  // Sensitive PII
            status: status
        )
    }
}
```

**Logger Integration**:

```swift
Logger.api.info("Leave request created: \(request.sanitized, privacy: .private)")
// Logged: "Leave request created: abc12345... [REDACTED]"
```

---

## 🔍 Logging & Audit Schema

### Log Categories

```swift
import OSLog

extension Logger {
    static let security = Logger(subsystem: "com.cdbl.leavecompanion", category: "Security")
    static let auth = Logger(subsystem: "com.cdbl.leavecompanion", category: "Auth")
    static let data = Logger(subsystem: "com.cdbl.leavecompanion", category: "DataAccess")
    static let sync = Logger(subsystem: "com.cdbl.leavecompanion", category: "Sync")
}
```

### Audit Log Schema

```swift
struct AuditLog {
    let event: String           // "LEAVE_CREATED", "BALANCE_VIEWED"
    let actorId: Int            // User ID
    let actorRole: String       // Role
    let targetId: Int?          // Leave ID, etc.
    let timestamp: Date
    let ipAddress: String?      // Optional, if available
    let userAgent: String       // "iOS-App/1.0"
    let severity: AuditSeverity
    let metadata: [String: Any]
}

enum AuditSeverity {
    case informational  // Balance viewed, leave submitted
    case warning        // Failed validation, rate limit hit
    case security       // Unauthorized access, token revoked
}
```

**Implementation**:

```swift
class AuditLogger {
    func log(_ event: AuditEvent, metadata: [String: Any] = [:]) {
        let log = AuditLog(
            event: event.rawValue,
            actorId: session.userId,
            actorRole: session.role.rawValue,
            targetId: metadata["targetId"] as? Int,
            timestamp: Date(),
            ipAddress: nil,  // iOS doesn't expose IP
            userAgent: "iOS-App/1.0",
            severity: .informational,
            metadata: metadata
        )
        
        Logger.security.info("Audit: \(event.rawValue) by \(session.userId, privacy: .private)")
        
        // Send to server (async, non-blocking)
        Task.detached {
            try? await apiClient.logAudit(log)
        }
    }
}
```

---

## 🚨 Integrity Checks

### Jailbreak Detection

```swift
class JailbreakChecker {
    static func isJailbroken() -> Bool {
        // Check for jailbreak indicators
        if FileManager.default.fileExists(atPath: "/Applications/Cydia.app") {
            return true
        }
        
        if FileManager.default.fileExists(atPath: "/usr/sbin/frida-server") {
            return true
        }
        
        // Check if process can open suspicious file
        if FileManager.default.isWritableFile(atPath: "/private/var/mobile") {
            return true
        }
        
        // Check for hooking frameworks
        let suspicious = ["MobileSubstrate", "CydiaSubstrate", "FridaGadget"]
        for framework in suspicious {
            if dlopen(framework, RTLD_NOW) != nil {
                return true
            }
        }
        
        return false
    }
}

// Usage on app launch
func checkDeviceIntegrity() {
    if JailbreakChecker.isJailbroken() {
        Logger.security.error("Jailbroken device detected")
        await showSecurityAlert()
        // Optionally: Exit app or disable features
    }
}
```

**⚠️ Note**: Jailbreak detection can be bypassed. Treat as **deterrent only**, not security.

### Code Tampering Detection

```swift
class IntegrityChecker {
    static func verifyAppIntegrity() throws {
        // Check app hash
        guard let bundleHash = Bundle.main.infoDictionary?["AppHash"] as? String else {
            throw IntegrityError.missingBundleHash
        }
        
        let computed = SHA256.hash(data: bundleHash.data(using: .utf8)!).hexString
        
        // Compare with expected hash from server
        let expected = try await apiClient.getExpectedBundleHash()
        
        guard computed == expected else {
            throw IntegrityError.bundleTampered
        }
    }
}
```

---

## 🔔 Kill Switch & Forced Upgrade

### Kill Switch Mechanism

```swift
class AppKillSwitch {
    static func checkKillSwitch() async throws {
        let response = try await apiClient.checkAppStatus()
        
        guard response.isEnabled else {
            throw KillSwitchError.appDisabled
        }
        
        if let minVersion = response.minVersion,
           Bundle.main.version < minVersion {
            throw KillSwitchError.forcedUpgrade(
                minVersion: minVersion,
                message: response.upgradeMessage
            )
        }
        
        // Update app config
        await AppConfig.shared.update(response.config)
    }
}

// App launch check
func handleKillSwitch() async {
    do {
        try await AppKillSwitch.checkKillSwitch()
    } catch KillSwitchError.appDisabled {
        await showAlert(
            title: "App Unavailable",
            message: "This app has been temporarily disabled. Please contact HR."
        )
    } catch KillSwitchError.forcedUpgrade(let version, let message) {
        await showAlert(
            title: "Update Required",
            message: message
        ) {
            // Open App Store
            if let url = URL(string: "itms-apps://apps.apple.com/app/id...") {
                UIApplication.shared.open(url)
            }
        }
    }
}
```

---

## 🔄 Privacy & Compliance

### Privacy Policy Compliance

**Data Collection Transparency**:

```swift
// On first launch
func showPrivacyNotice() {
    Alert(
        title: "Privacy Notice",
        message: """
        CDBL Leave Companion collects:
        - Leave request data (required)
        - Device ID (for security)
        - Usage analytics (optional, anonymized)
        
        Data is stored:
        - Locally on your device (encrypted)
        - On CDBL servers (Asia/Dhaka)
        
        We do not share data with third parties.
        """
    )
}
```

### GDPR/Data Protection

- **Right to Access**: Export all stored data on request
- **Right to Delete**: Unlink device removes all local data
- **Data Portability**: Export leave requests as JSON
- **Audit Trail**: All actions logged and requestable

---

## ✅ Security Checklist

- [ ] Keychain used for all sensitive data
- [ ] Tokens rotate before expiry
- [ ] Least-privilege scopes enforced
- [ ] Device binding active
- [ ] Audit logging on all actions
- [ ] PII redaction in logs
- [ ] Jailbreak detection (deterrent)
- [ ] Kill switch tested
- [ ] Forced upgrade tested
- [ ] Privacy notice displayed
- [ ] Data retention policy enforced

---

**Document Status**: ✅ Complete  
**Implementation Status**: ⚠️ Partial (Keychain done, others pending)  
**Last Reviewed**: 2025-01-30

