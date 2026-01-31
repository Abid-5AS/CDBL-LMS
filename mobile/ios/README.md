# CDBL Leave Manager - iOS App

The iOS companion app for CDBL Leave Management System, built with SwiftUI for iOS 17+.

---

## Prerequisites

- **Xcode**: 16.0 or higher
- **iOS Deployment Target**: iOS 17.0+
- **macOS**: 14.0 (Sonoma) or higher
- **Apple Developer Account**: For device testing

---

## Setup

### 1. Clone and Open

```bash
cd mobile/ios/CDBLLeaveManager
open CDBLLeaveManager.xcodeproj
```

### 2. Configure API URL

Edit `Core/Networking/APIClient.swift`:

```swift
private static let baseURL = "https://your-api-domain.com/api"
```

For development with local server:
```swift
private static let baseURL = "http://localhost:3000/api"
```

### 3. Build & Run

1. Select target device/simulator (iPhone 15 recommended)
2. Press `Cmd + R` to build and run

---

## Project Architecture

```
CDBLLeaveManager/
├── Core/
│   ├── AppState.swift          # Global state (auth, theme, network)
│   ├── Models/                 # Data models (Codable structs)
│   │   ├── AuthModels.swift
│   │   ├── LeaveModels.swift
│   │   ├── DashboardModels.swift
│   │   └── ...
│   ├── Networking/             # API layer
│   │   ├── APIClient.swift     # HTTP client with auth handling
│   │   ├── AuthService.swift   # Login/logout endpoints
│   │   ├── LeaveService.swift  # Leave CRUD operations
│   │   └── ...
│   └── Security/               # Token & Keychain management
│
├── Features/                   # Feature modules
│   ├── Auth/                   # Login, OTP verification
│   ├── Dashboard/              # Role-based dashboards
│   ├── Leaves/                 # Leave application, history
│   ├── Approvals/              # Approval queue (managers)
│   ├── Team/                   # Team member views
│   ├── Holidays/               # Holiday calendar
│   ├── Profile/                # User profile
│   └── Settings/               # App settings
│
├── Components/                 # Reusable UI components
├── DesignSystem/              # Theme, colors, typography
└── MainTabView.swift          # Tab navigation controller
```

---

## Key Files

| File | Purpose |
|------|---------|
| `AppState.swift` | Centralized state management, auth status |
| `APIClient.swift` | API networking with token refresh |
| `TokenManager.swift` | Keychain storage for JWT tokens |
| `MainTabView.swift` | Role-based tab navigation |

---

## User Roles

The app adapts navigation based on user role:

| Role | Available Tabs |
|------|---------------|
| EMPLOYEE | Dashboard, Leaves, Holidays, More |
| DEPT_HEAD | Dashboard, Approvals, Team, More |
| HR_ADMIN | Dashboard, Approvals, Team, More |
| HR_HEAD | Dashboard, Approvals, Team, Reports, More |
| CEO | Dashboard, Approvals, Reports, More |

---

## Development Status

> ⚠️ **Status: IN DEVELOPMENT** - Not production ready

### Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth | ✅ Working | JWT authentication |
| Employee Dashboard | ⚠️ Partial | Basic stats, API issues |
| Leave Application | ⚠️ Partial | Form works, submission unstable |
| Leave History | ⚠️ Partial | Displays, pagination issues |
| Approvals | ❌ Not Working | API integration incomplete |
| Push Notifications | ❌ Not Working | APNs not configured |
| Offline Mode | ❌ Not Working | Not implemented |

### Known Issues

1. **Dashboard "Oops" Error**: API timeout causes widget failures
2. **API Response Format**: Some endpoints return unexpected formats
3. **Network Flakiness**: Connection drops on slow networks
4. **Liquid Glass Rendering**: iOS 26+ styling may need verification
5. **File Upload**: Medical document upload incomplete

### Before Production

- [ ] Fix API integration issues
- [ ] Add proper error handling and retry logic
- [ ] Configure APNs for push notifications
- [ ] Test on physical devices
- [ ] Performance optimization

---

## Build for Production

1. Update signing in Xcode:
   - Select your Development Team
   - Set Bundle Identifier

2. Archive:
   ```
   Product → Archive
   ```

3. Distribute via App Store Connect or Ad-Hoc

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection failed | Check API URL, ensure server is running |
| Login not working | Verify API credentials, check console logs |
| Build errors | Clean build folder (`Cmd + Shift + K`) |
| "Oops" on dashboard | API timeout - check network/server |
| Simulator crash | Use physical device with iOS 17+ |

---

## Related Documentation

- [Master Handover](../../HANDOVER.md) - Complete handover documentation
- [iOS Architecture Guide](../../docs/mobile/ARCHITECTURE.md)
- [API Contracts](../../docs/mobile/API_CONTRACTS.md)
- [Security Model](../../docs/mobile/SECURITY.md)

---

**Last Updated**: January 2026  
**Xcode Version**: 16.0  
**iOS Target**: 17.0+  
**Status**: In Development
