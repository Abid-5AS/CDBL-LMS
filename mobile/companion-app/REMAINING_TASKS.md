# CDBL Leave Companion - Remaining Implementation Tasks

**Project Directory**: `/Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management/mobile/companion-app`

## Completed Features ✅

### Core Screens & Navigation

- ✅ Tab navigation with 5 tabs (Home, Apply Leave, History, Balance, More)
- ✅ Home screen with balance overview
- ✅ Leave application form with date picker and leave type selection
- ✅ Leave history screen with filters and search
- ✅ Leave balance detail screen with progress bars and accrual history

### Data Layer

- ✅ SQLite database schema with 7 tables (user_profile, leave_balances, leave_applications, sync_queue, accrual_history, holidays, app_settings)
- ✅ Database initialization and encryption key management
- ✅ CRUD operations for all entities
- ✅ Offline-first architecture foundation

### UI Components

- ✅ ThemedCard component (iOS LiquidGlass + Android Material3)
- ✅ ThemedButton component with variants (primary, secondary, outline)
- ✅ Theme provider with light/dark/system modes
- ✅ Material 3 theming for Android
- ✅ iOS glass effects with expo-blur

---

## Remaining Tasks (Priority Order)

### 1. Biometric Authentication 🔐

**Directory**: `src/auth/`

**Tasks**:

- [ ] Create `BiometricAuth.ts` service using `expo-local-authentication`

  - Check device biometric support (Face ID/Touch ID)
  - Authenticate user with biometrics
  - Store authentication state securely
  - Handle authentication failures and fallback to PIN

- [ ] Create login screen at `app/login.tsx`

  - Biometric authentication button
  - Fallback to email/password
  - "Remember me" toggle
  - Smooth navigation to home after auth

- [ ] Add authentication state management

  - Create `src/store/authStore.ts` using Zustand
  - Track authenticated user
  - Auto-logout after timeout
  - Persist auth state

- [ ] Protect screens with auth guard
  - Add auth check in `app/_layout.tsx`
  - Redirect to login if not authenticated
  - Handle deep links after auth

**Files to create**:

- `src/auth/BiometricAuth.ts`
- `src/auth/types.ts`
- `src/store/authStore.ts`
- `app/login.tsx`

---

### 2. Connect SQLite to Screens 🔌

**Directory**: `src/hooks/` and update existing screens

**Tasks**:

- [ ] Create React hooks for database operations

  - `useLeaveApplications()` - fetch/create/update leave applications
  - `useLeaveBalances()` - fetch and display balances
  - `useUserProfile()` - fetch/update user data
  - `useSyncQueue()` - manage sync operations

- [ ] Update `app/(tabs)/apply.tsx`

  - Save leave application to SQLite on submit
  - Validate against available balance from database
  - Add to sync queue for server upload
  - Show success/error messages

- [ ] Update `app/(tabs)/history.tsx`

  - Fetch leave applications from SQLite
  - Real-time filter and search from database
  - Pull-to-refresh to sync with server
  - Display sync status indicators

- [ ] Update `app/(tabs)/balance.tsx`

  - Fetch balances from SQLite
  - Display real-time available days
  - Show sync timestamp
  - Calculate usage statistics

- [ ] Update `app/(tabs)/index.tsx` (Home)
  - Fetch real balances from database
  - Display user name from profile
  - Show pending applications count
  - Quick actions with real data

**Files to create**:

- `src/hooks/useLeaveApplications.ts`
- `src/hooks/useLeaveBalances.ts`
- `src/hooks/useUserProfile.ts`
- `src/hooks/useSyncQueue.ts`

**Files to update**:

- `app/(tabs)/apply.tsx`
- `app/(tabs)/history.tsx`
- `app/(tabs)/balance.tsx`
- `app/(tabs)/index.tsx`

---

### 3. Offline Sync Mechanism 🔄

**Directory**: `src/sync/`

**Tasks**:

- [ ] Create sync service at `src/sync/SyncService.ts`

  - Queue management for offline operations
  - Conflict resolution strategies
  - Retry logic with exponential backoff
  - Network status detection

- [ ] Implement API client at `src/api/client.ts`

  - REST API calls to backend server
  - Token-based authentication
  - Request/response interceptors
  - Error handling and logging

- [ ] Create sync operations

  - Upload pending leave applications
  - Download approved/rejected updates
  - Sync leave balances from server
  - Sync holidays and company calendar
  - Update user profile

- [ ] Add background sync

  - Use `expo-background-fetch` for periodic sync
  - Sync on app foreground
  - Sync on network reconnection
  - Show sync status in UI

- [ ] Create sync status component
  - Display "Syncing...", "Last synced X mins ago"
  - Show pending upload count
  - Manual refresh button
  - Conflict resolution UI

**Files to create**:

- `src/sync/SyncService.ts`
- `src/sync/ConflictResolver.ts`
- `src/sync/NetworkMonitor.ts`
- `src/api/client.ts`
- `src/api/endpoints.ts`
- `src/components/shared/SyncStatusBanner.tsx`

---

### 4. Calendar View 📅

**Directory**: `app/(tabs)/calendar.tsx` and `src/components/calendar/`

**Tasks**:

- [ ] Install calendar library

  - Add `react-native-calendars` package
  - Configure for both iOS and Android

- [ ] Create calendar screen at `app/(tabs)/calendar.tsx`

  - Month view with leave days marked
  - Color-coded by leave type
  - Tap day to see details
  - Legend for leave types

- [ ] Create calendar components

  - `CalendarHeader.tsx` - month/year navigation
  - `DayCell.tsx` - custom day rendering with markers
  - `LeaveLegend.tsx` - color legend for leave types
  - `DayDetailsModal.tsx` - show leaves on selected day

- [ ] Integrate with database

  - Fetch all approved leaves for selected month
  - Fetch holidays from database
  - Mark pending applications differently
  - Show balances in header

- [ ] Add calendar to tab navigation
  - Update `app/(tabs)/_layout.tsx`
  - Add calendar icon
  - Position between History and Balance tabs

**Files to create**:

- `app/(tabs)/calendar.tsx`
- `src/components/calendar/CalendarHeader.tsx`
- `src/components/calendar/DayCell.tsx`
- `src/components/calendar/LeaveLegend.tsx`
- `src/components/calendar/DayDetailsModal.tsx`

**Files to update**:

- `app/(tabs)/_layout.tsx`

---

### 5. Leave Validation Rules Engine 🎯

**Directory**: `src/engine/` (already exists, needs completion)

**Tasks**:

- [ ] Complete `src/engine/validator.ts`

  - Implement all validation rules
  - Check balance availability
  - Validate date ranges
  - Check blackout periods
  - Weekend/holiday handling

- [ ] Implement leave type rules at `src/engine/rules/`

  - `casual-leave.ts` (already exists, needs completion)
  - `earned-leave.ts` - 3-day notice, max 21 consecutive
  - `medical-leave.ts` - medical certificate for 3+ days
  - `maternity-leave.ts` - special rules and documentation

- [ ] Create validation result types

  - Success/error messages
  - Rule violation details
  - Suggested alternatives
  - Available date ranges

- [ ] Integrate validation into apply screen
  - Real-time validation as user types
  - Show errors before submit
  - Suggest valid date ranges
  - Display policy info tooltips

**Files to complete**:

- `src/engine/validator.ts`
- `src/engine/rules/casual-leave.ts`

**Files to create**:

- `src/engine/rules/earned-leave.ts`
- `src/engine/rules/medical-leave.ts`
- `src/engine/rules/maternity-leave.ts`
- `src/engine/rules/types.ts`

---

### 6. Google AI Integration 🤖

**Directory**: `src/ai/`

**Tasks**:

- [ ] Create AI service at `src/ai/GeminiService.ts`

  - Initialize Gemini API (@google/generative-ai already installed)
  - Create chat session
  - Format prompts with context
  - Parse AI responses

- [ ] Implement AI features

  - **Leave suggestions**: "I need leave for a family wedding"
  - **Policy Q&A**: "Can I take 5 days casual leave?"
  - **Smart date selection**: "I want to go on vacation next month"
  - **Reason generation**: Suggest professional leave reasons

- [ ] Create AI chat screen at `app/ai-assistant.tsx`

  - Chat interface with message bubbles
  - Quick action buttons
  - Context-aware suggestions
  - Voice input option

- [ ] Add AI button to apply screen

  - "Get AI suggestions" button
  - Modal with chat interface
  - Fill form with AI suggestions
  - Show policy violations

- [ ] Create AI components
  - `AIAssistantModal.tsx` - chat interface
  - `AIMessageBubble.tsx` - message display
  - `AIQuickActions.tsx` - preset questions

**Files to create**:

- `src/ai/GeminiService.ts`
- `src/ai/prompts.ts`
- `src/ai/types.ts`
- `app/ai-assistant.tsx`
- `src/components/ai/AIAssistantModal.tsx`
- `src/components/ai/AIMessageBubble.tsx`
- `src/components/ai/AIQuickActions.tsx`

---

### 7. Push Notifications 🔔

**Directory**: `src/notifications/`

**Tasks**:

- [ ] Setup Expo Notifications

  - Install `expo-notifications` package
  - Configure for iOS and Android
  - Request permissions on first launch
  - Get push token

- [ ] Create notification service at `src/notifications/NotificationService.ts`

  - Register device token with server
  - Schedule local notifications
  - Handle incoming push notifications
  - Navigate to relevant screen on tap

- [ ] Implement notification types

  - Leave application submitted
  - Leave approved/rejected
  - Balance update notifications
  - Reminder: upcoming leave
  - Reminder: low balance

- [ ] Add notification preferences

  - Enable/disable by type
  - Quiet hours setting
  - Sound preferences
  - Badge count management

- [ ] Create notifications screen at `app/notifications.tsx`
  - List all notifications
  - Mark as read
  - Clear all option
  - Settings button

**Files to create**:

- `src/notifications/NotificationService.ts`
- `src/notifications/types.ts`
- `src/notifications/NotificationHandler.ts`
- `app/notifications.tsx`
- `src/components/notifications/NotificationCard.tsx`

---

### 8. Settings & Profile 👤

**Directory**: `app/settings/` and `app/profile/`

**Tasks**:

- [ ] Create settings screen at `app/settings.tsx`

  - Theme selection (Light/Dark/System)
  - Notification preferences
  - Language selection
  - Biometric toggle
  - About section
  - Logout button

- [ ] Create profile screen at `app/profile.tsx`

  - Display user info from database
  - Department and role
  - Leave statistics
  - Change password
  - Profile picture upload

- [ ] Create settings components

  - `SettingCard.tsx` - individual setting item
  - `SettingSwitch.tsx` - toggle setting
  - `SettingSelect.tsx` - dropdown selection

- [ ] Update "More" tab (explore.tsx)
  - Link to Settings
  - Link to Profile
  - Link to AI Assistant
  - Link to Notifications
  - Help & FAQ
  - About app

**Files to create**:

- `app/settings.tsx`
- `app/profile.tsx`
- `src/components/settings/SettingCard.tsx`
- `src/components/settings/SettingSwitch.tsx`
- `src/components/settings/SettingSelect.tsx`

**Files to update**:

- `app/(tabs)/explore.tsx`

---

### 9. Error Handling & Loading States 💫

**Directory**: Throughout app

**Tasks**:

- [ ] Create error boundary at `src/components/errors/ErrorBoundary.tsx`

  - Catch React errors
  - Display user-friendly error screen
  - Retry button
  - Report to error tracking

- [ ] Create loading components

  - `LoadingScreen.tsx` - full screen loader
  - `LoadingCard.tsx` - card skeleton
  - `LoadingButton.tsx` - button with spinner

- [ ] Add error handling to all API calls

  - Network errors
  - Timeout errors
  - Validation errors
  - Server errors

- [ ] Create toast notification system
  - Success toasts
  - Error toasts
  - Info toasts
  - Action toasts with undo

**Files to create**:

- `src/components/errors/ErrorBoundary.tsx`
- `src/components/errors/ErrorScreen.tsx`
- `src/components/loading/LoadingScreen.tsx`
- `src/components/loading/LoadingCard.tsx`
- `src/components/loading/LoadingButton.tsx`
- `src/utils/errorHandler.ts`
- `src/utils/toast.ts`

---

### 10. Testing & Polish ✨

**Directory**: `__tests__/` and throughout

**Tasks**:

- [ ] Add unit tests

  - Database operations
  - Validation rules
  - Sync service
  - API client

- [ ] Add integration tests

  - Leave application flow
  - Authentication flow
  - Sync mechanism

- [ ] Performance optimization

  - Database query optimization
  - Image lazy loading
  - Component memoization
  - List virtualization

- [ ] Accessibility improvements

  - Screen reader support
  - Keyboard navigation
  - High contrast mode
  - Font scaling

- [ ] Final polish
  - Animations and transitions
  - Haptic feedback
  - Sound effects
  - Loading states
  - Error messages
  - Empty states

---

## Configuration Files Needed

### Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=https://your-backend-api.com
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_ENVIRONMENT=development
```

### App Config

Update `app.json`:

```json
{
  "expo": {
    "scheme": "cdbl-leave",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#000000"
    },
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Allow CDBL Leave Companion to use Face ID for secure authentication",
        "NSCameraUsageDescription": "Allow camera access for profile picture upload"
      }
    }
  }
}
```

---

## Dependencies to Install

```bash
# Navigate to project directory
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management/mobile/companion-app

# Install remaining packages
pnpm add react-native-calendars
pnpm add expo-notifications
pnpm add expo-background-fetch
pnpm add @react-native-async-storage/async-storage
pnpm add react-native-toast-message
```

---

## Backend API Endpoints Needed

The backend should provide these REST API endpoints:

### Authentication

- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/balance` - Get leave balances

### Leave Applications

- `GET /api/leaves` - Get all leave applications
- `POST /api/leaves` - Create leave application
- `GET /api/leaves/:id` - Get specific leave
- `PUT /api/leaves/:id` - Update leave application
- `DELETE /api/leaves/:id` - Delete draft

### Sync

- `POST /api/sync/upload` - Upload pending changes
- `GET /api/sync/download?since=<timestamp>` - Download updates
- `GET /api/sync/status` - Get sync status

### Calendar

- `GET /api/holidays` - Get holidays list
- `GET /api/calendar` - Get team calendar

### Notifications

- `POST /api/notifications/register` - Register device token
- `GET /api/notifications` - Get notification history

---

## Estimated Time per Task

1. **Biometric Authentication**: 4-6 hours
2. **Connect SQLite to Screens**: 6-8 hours
3. **Offline Sync Mechanism**: 8-12 hours
4. **Calendar View**: 4-6 hours
5. **Leave Validation Rules**: 6-8 hours
6. **Google AI Integration**: 6-8 hours
7. **Push Notifications**: 4-6 hours
8. **Settings & Profile**: 4-6 hours
9. **Error Handling & Loading**: 4-6 hours
10. **Testing & Polish**: 8-12 hours

**Total Estimated Time**: 54-78 hours (7-10 working days)

---

## Priority Recommendations

### Phase 1 (Must Have - Week 1)

1. Biometric Authentication
2. Connect SQLite to Screens
3. Leave Validation Rules
4. Error Handling & Loading States

### Phase 2 (Important - Week 2)

5. Offline Sync Mechanism
6. Settings & Profile
7. Calendar View

### Phase 3 (Nice to Have - Week 3)

8. Google AI Integration
9. Push Notifications
10. Testing & Polish

---

## Notes for Implementation

- **All paths are relative to**: `/Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management/mobile/companion-app`
- **Use TypeScript** for all new files
- **Follow existing patterns** in `src/components/` for component structure
- **Database operations** should always go through hooks in `src/hooks/`
- **Theme-aware components** should use `useTheme()` from `src/providers/ThemeProvider`
- **Platform-specific code** should check `Platform.OS === 'ios'` or use `Platform.select()`
- **Test on both iOS and Android** as you implement features

---

## Current Package Versions

```json
{
  "expo": "~54.0.23",
  "expo-sqlite": "^16.0.9",
  "expo-secure-store": "^15.0.7",
  "expo-local-authentication": "^17.0.7",
  "expo-blur": "^15.0.7",
  "@expo/ui": "0.2.0-beta.7",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@google/generative-ai": "^0.24.1",
  "react-native-paper": "^5.14.5",
  "zustand": "^5.0.8"
}
```

---

## Getting Started

```bash
# Clone and navigate
cd /Users/md.abidshahriar/Documents/CDBL/cdbl-leave-management/mobile/companion-app

# Install dependencies (if needed)
pnpm install

# Start development server
pnpm start

# Run on iOS device
pnpm run ios:device

# Run on iOS simulator
pnpm run ios:sim

# Run on Android
pnpm run android
```

Good luck with the implementation! 🚀
