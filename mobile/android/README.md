# CDBL Leave Manager - Android App

The Android companion app for CDBL Leave Management System, built with Kotlin and Jetpack Compose.

---

## Prerequisites

- **Android Studio**: Ladybug (2024.2.1) or higher
- **JDK**: 17
- **Android SDK**: API 34 (target), API 26 (min)
- **Gradle**: 8.x (via wrapper)

---

## Setup

### 1. Clone and Open

Open the `mobile/android` directory in Android Studio.

### 2. Configure API URL

Edit `local.properties` in the project root:

```properties
API_URL=https://your-api-domain.com/api/
```

For local development with emulator:
```properties
API_URL=http://10.0.2.2:3000/api/
```

### 3. Firebase Setup (Optional)

For push notifications:
1. Download `google-services.json` from Firebase Console
2. Place in `app/` directory

### 4. Build & Run

```bash
./gradlew assembleDebug
```

Or use Android Studio: `Run → Run 'app'`

---

## Project Architecture

```
com.cdbl.leavemanager/
├── MainActivity.kt           # Entry point
├── LeaveManagerApp.kt        # Hilt Application class
│
├── core/                     # Core utilities
│   └── Constants.kt
│
├── data/                     # Data layer
│   ├── api/                  # Retrofit services
│   │   ├── AuthService.kt
│   │   ├── LeaveService.kt
│   │   ├── DashboardService.kt
│   │   └── ...
│   ├── local/                # Room database
│   │   ├── AppDatabase.kt
│   │   ├── TokenManager.kt
│   │   └── dao/
│   ├── model/                # Data models
│   └── repository/           # Repository pattern
│
├── di/                       # Hilt dependency injection
│   └── AppModule.kt          # Singleton providers
│
├── ui/                       # UI layer (Compose)
│   ├── CDBLApp.kt           # Root composable
│   ├── CDBLAppState.kt      # App state management
│   ├── navigation/          # Navigation setup
│   ├── theme/               # Material 3 theming
│   ├── components/          # Reusable composables
│   ├── auth/                # Login screens
│   ├── dashboard/           # Role-based dashboards
│   ├── leaves/              # Leave application & history
│   ├── approvals/           # Approval queue
│   └── ...
│
├── util/                    # Utility classes
│   └── NetworkMonitor.kt
│
└── workers/                 # WorkManager jobs
```

---

## Key Technologies

| Technology | Purpose |
|------------|---------|
| Jetpack Compose | Declarative UI |
| Hilt | Dependency Injection |
| Retrofit | REST API calls |
| Room | Local database/caching |
| DataStore | Preferences storage |
| WorkManager | Background tasks |
| Coil | Image loading |

---

## Key Files

| File | Purpose |
|------|---------|
| `CDBLAppState.kt` | Global app state, auth, navigation |
| `TokenManager.kt` | JWT token storage (EncryptedSharedPreferences) |
| `AppModule.kt` | Room database provider |
| `LeaveService.kt` | Leave CRUD API endpoints |

---

## User Roles

The app adapts navigation based on user role:

| Role | Available Screens |
|------|------------------|
| EMPLOYEE | Dashboard, Leaves, Holidays, Balance, Profile |
| DEPT_HEAD | Dashboard, Approvals, Team, Profile |
| HR_ADMIN | Dashboard, Approvals, Team, Profile |
| HR_HEAD | Dashboard, Approvals, Team, Reports, Profile |
| CEO | Dashboard, Approvals, Reports, Profile |

---

## Build Variants

| Variant | Purpose |
|---------|---------|
| debug | Development with logging |
| release | Production build (minified) |

---

## Development Status

> ⚠️ **Status: IN DEVELOPMENT** - Not production ready

### Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth | ✅ Working | JWT authentication |
| Employee Dashboard | ⚠️ Partial | Basic implementation |
| Leave Application | ⚠️ Partial | Form works, needs polish |
| Leave History | ⚠️ Partial | Basic list view |
| Role-Based Dashboards | ❌ Incomplete | Manager/HR/Admin screens needed |
| Push Notifications | ⚠️ Partial | Firebase setup done |
| Offline Mode | ❌ Not Working | Room DB for caching only |

### Known Issues

1. **Role-Based Routing**: Dashboard routing by role incomplete
2. **API Model Mismatch**: Some responses don't match expected format
3. **Firebase Required**: App won't build without google-services.json
4. **Approval Flow**: Manager/HR approval screens not complete
5. **Error Handling**: Network errors need better UX

### Before Production

- [ ] Complete role-based dashboard screens
- [ ] Fix API response parsing
- [ ] Add proper error handling
- [ ] Complete approval workflow screens
- [ ] Performance optimization
- [ ] Test on various devices

---

## Build for Release

1. Create signing keystore (if not exists)
2. Configure `app/build.gradle.kts`:
   ```kotlin
   signingConfigs {
       create("release") {
           storeFile = file("path/to/keystore.jks")
           storePassword = "password"
           keyAlias = "alias"
           keyPassword = "password"
       }
   }
   ```

3. Build:
   ```bash
   ./gradlew assembleRelease
   ```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection failed | Check API_URL in local.properties |
| Emulator can't reach localhost | Use `10.0.2.2` instead of `localhost` |
| Hilt errors | Clean project: `./gradlew clean` |
| Room migration error | Increment database version |
| Missing google-services.json | Download from Firebase Console |

---

## Related Documentation

- [Master Handover](../../HANDOVER.md) - Complete handover documentation
- [Web API Contracts](../../docs/api/API_Contracts.md)
- [Mobile Architecture](../../docs/mobile/ARCHITECTURE.md)

---

**Last Updated**: January 2026  
**Kotlin Version**: 1.9.x  
**Compose BOM**: 2024.x  
**Target SDK**: 34  
**Status**: In Development

