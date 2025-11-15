# Architecture Documentation

## System Architecture

### Layered Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌────────────────────┐  ┌──────────────────────────┐   │
│  │  iOS Components    │  │  Android Components      │   │
│  │  (Liquid Glass)    │  │  (Material 3 Expressive) │   │
│  └────────────────────┘  └──────────────────────────┘   │
│             │                      │                      │
│             └──────────┬───────────┘                      │
│                        ▼                                  │
│            ┌───────────────────────┐                     │
│            │  Shared UI Components │                     │
│            └───────────────────────┘                     │
└──────────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────┐
│                    Business Logic Layer                  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Offline Rule Engine (Core)              │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │ Leave Validator  │  │ Policy Suggester │    │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │Balance Calculator│  │ Explanation Eng. │    │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │       AI Layer (Optional, Online)               │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │  Gemini Client   │  │ Insight Generator│    │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │    Natural Language Processor            │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────┐
│                       Data Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │    SQLite    │  │     MMKV     │  │ File System │   │
│  │  (Structured)│  │  (Key-Value) │  │ (Documents) │   │
│  └──────────────┘  └──────────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Offline Rule Engine Design

### Core Principles

1. **Pure Functions**: All rule logic is deterministic
2. **Composable**: Rules can be combined and chained
3. **Testable**: Each rule can be tested independently
4. **Explainable**: Every decision includes reasoning

### Rule Engine Components

#### 1. Leave Validator

**Purpose**: Validates leave requests against policy rules

**Input**:

```typescript
{
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  currentBalance: Balance;
  gender: 'MALE' | 'FEMALE';
  previousLeaves: LeaveRequest[];
}
```

**Output**:

```typescript
{
  isValid: boolean;
  violations: Violation[];
  warnings: Warning[];
  suggestions: Suggestion[];
}
```

**Rules**:

- `validateCasualLeaveMaxDays`: CL ≤ 3 consecutive days
- `validateCasualLeaveAdjacency`: CL cannot touch holidays
- `validateEarnedLeaveNotice`: EL requires 15 days advance notice
- `validateMedicalLeaveOverflow`: ML >14 days → excess to EL
- `validateBalanceSufficiency`: Check if user has enough balance
- `validateGenderSpecificLeaves`: Maternity (F), Paternity (M)
- `validateCombinationRestrictions`: CL + ML same day not allowed

#### 2. Policy Suggester

**Purpose**: Suggests alternative leave types or date ranges

**Input**:

```typescript
{
  reason: string;
  desiredStartDate: Date;
  desiredEndDate: Date;
  currentBalance: Balance;
  holidays: Holiday[];
}
```

**Output**:

```typescript
{
  suggestedLeaveType: LeaveType;
  reasoning: string;
  alternatives: Alternative[];
  optimizations: Optimization[];
}
```

**Suggestion Logic**:

- **By Reason Keywords**:

  - "sick", "doctor", "hospital" → ML
  - "vacation", "travel", "holiday" → EL
  - "urgent", "emergency", "family" → CL
  - "wedding", "funeral" → SPECIAL

- **By Duration**:

  - 1-3 days + not medical → CL (if balance available)
  - 4+ days → EL
  - > 14 days → EL (ML converts)

- **By Balance**:

  - If CL exhausted → Suggest EL
  - If EL low → Suggest splitting request

- **By Calendar**:
  - If request touches holidays → Suggest EL or extend to include
  - If weekends in middle → Suggest bridging

#### 3. Balance Calculator

**Purpose**: Calculates current and projected balances

**Calculations**:

```typescript
// Opening Balance (carry-forward from previous year)
openingBalance = min(prevYear.closing, carryLimit);

// Accrued Balance
accruedBalance = monthsElapsed * accrualRate;

// Current Balance
currentBalance = openingBalance + accruedBalance - usedBalance;

// Projected Balance (after request)
projectedBalance = currentBalance - requestedDays;
```

**Special Cases**:

- EL: 2 days/month accrual, 60-day carry limit
- CL: No carry-forward, resets every year
- ML: No carry-forward, resets every year

#### 4. Explanation Engine

**Purpose**: Generates human-readable explanations

**Templates**:

```typescript
const explanations = {
  CL_MAX_DAYS: (days) =>
    `Casual Leave cannot exceed 3 consecutive days. Your request is for ${days} days. Consider using Earned Leave instead.`,

  CL_HOLIDAY_ADJACENT: (date) =>
    `Casual Leave cannot be adjacent to holidays. ${date} is next to a holiday. Consider using Earned Leave or changing dates.`,

  EL_NOTICE_REQUIRED: (days, required) =>
    `Earned Leave requires ${required} days advance notice. Your request is only ${days} days in advance. Submit earlier or use emergency leave if urgent.`,

  ML_OVERFLOW_CONVERSION: (total, mlDays, elDays) =>
    `Medical Leave is limited to 14 days. Your ${total}-day request will be split: ${mlDays} days ML + ${elDays} days EL.`,

  INSUFFICIENT_BALANCE: (type, available, requested) =>
    `Insufficient ${type} balance. Available: ${available} days, Requested: ${requested} days. Consider using a different leave type.`,
};
```

### Rule Definition Structure

Each rule is defined as:

```typescript
interface Rule {
  id: string;
  name: string;
  description: string;
  leaveTypes: LeaveType[]; // Which leave types this rule applies to
  validate: (context: ValidationContext) => RuleResult;
  explain: (context: ValidationContext) => string;
}

interface RuleResult {
  passed: boolean;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  code: string;
  suggestions?: Suggestion[];
}
```

### Rule Execution Flow

```
1. User inputs leave request
         ↓
2. Load applicable rules for leave type
         ↓
3. Execute rules in priority order
         ↓
4. Collect violations and warnings
         ↓
5. Generate suggestions if rules fail
         ↓
6. Return validation result with explanations
```

### Rule Priority

```
HIGH (Blocking)
├─ Insufficient balance
├─ Invalid date range
└─ Gender-specific violations

MEDIUM (Policy Violations)
├─ CL max days exceeded
├─ CL holiday adjacency
├─ EL notice requirement
└─ ML overflow

LOW (Warnings)
├─ Balance running low
├─ Holiday bridging opportunity
└─ Better leave type available
```

## AI Layer Design

### Architecture

```
┌─────────────────────────────────────────────────┐
│              User Interface                     │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         AI Service Manager                      │
│  ├─ Connection Check                            │
│  ├─ Consent Verification                        │
│  └─ Fallback to Offline Engine                  │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         Gemini API Client                       │
│  ├─ Request Queue                               │
│  ├─ Rate Limiting                               │
│  ├─ Error Handling                              │
│  └─ Response Caching                            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         Context Builder                         │
│  ├─ Anonymize User Data                         │
│  ├─ Build Prompt Context                        │
│  └─ Include Policy Snippets                     │
└─────────────────────────────────────────────────┘
                     ↓
              Google Gemini API
```

### Gemini Integration

**Model**: Gemini 2.0 Flash (fast, cost-effective)

**Use Cases**:

1. **Natural Language Policy Q&A**

   ```typescript
   prompt = `
     Context: User has ${balance.EL} days EL, ${balance.CL} days CL.
     Policies: [relevant policy snippets]
     
     Question: ${userQuestion}
     
     Provide a clear, concise answer based on the policies.
   `;
   ```

2. **Leave Request Analysis**

   ```typescript
   prompt = `
     User wants to take leave from ${start} to ${end}.
     Reason: "${reason}"
     Current Balance: ${balance}
     
     Suggest the best leave type and explain why.
   `;
   ```

3. **Trend Insights**
   ```typescript
   prompt = `
     User's leave history: ${JSON.stringify(leaves)}
     
     Analyze patterns and provide insights:
     - Most used leave types
     - Peak leave months
     - Suggestions for future planning
   `;
   ```

**Safety Controls**:

- No PII sent (names, IDs, emails stripped)
- Only aggregated data shared
- Responses validated against offline rules
- Fallback to offline engine if API fails

### Data Privacy

**What Gets Sent to Gemini** (with consent):
✅ Leave counts and types (anonymized)
✅ Date ranges (no specific events)
✅ Balance numbers
✅ Generic policy text

**What NEVER Gets Sent**:
❌ User name, ID, email
❌ Company name or server data
❌ Approver information
❌ Sensitive documents (certificates)
❌ Corporate policy documents

## Data Layer Design

### SQLite Schema

```sql
-- Leave Requests
CREATE TABLE leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  working_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  certificate_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT,
  server_id INTEGER
);

-- Balances
CREATE TABLE balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  opening INTEGER DEFAULT 0,
  accrued INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Holidays
CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_optional INTEGER DEFAULT 0
);

-- Policy Rules (cached for offline)
CREATE TABLE policy_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leave_type TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  description TEXT,
  UNIQUE(leave_type, rule_key)
);

-- Sync Queue (pending uploads)
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  operation TEXT NOT NULL, -- CREATE, UPDATE, DELETE
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0
);
```

### MMKV Storage

Used for fast key-value storage:

```typescript
// User preferences
mmkv.set("theme", "dark");
mmkv.set("biometric_enabled", true);
mmkv.set("ai_consent", false);

// Cache
mmkv.set("last_sync", Date.now());
mmkv.set("cached_policies", JSON.stringify(policies));

// Session
mmkv.set("session_token", token);
mmkv.set("user_id", userId);
```

## State Management

### Zustand Stores

```typescript
// Leave Store
useLeaveStore = create((set) => ({
  leaves: [],
  drafts: [],
  addLeave: (leave) =>
    set((state) => ({
      leaves: [...state.leaves, leave],
    })),
  updateDraft: (id, updates) => {
    /* ... */
  },
}));

// Balance Store
useBalanceStore = create((set) => ({
  balances: {},
  updateBalance: (type, balance) => {
    /* ... */
  },
  calculateProjected: (type, days) => {
    /* ... */
  },
}));

// UI Store
useUIStore = create((set) => ({
  theme: "light",
  language: "en",
  setTheme: (theme) => set({ theme }),
}));

// AI Store
useAIStore = create((set) => ({
  isEnabled: false,
  hasConsent: false,
  insights: [],
  setConsent: (consent) => set({ hasConsent: consent }),
}));
```

## Platform-Specific Design

### iOS Liquid Glass Components

**Visual Characteristics**:

- Frosted glass blur effects
- Subtle gradients with depth
- Smooth morphing transitions
- Dynamic Island integration
- Haptic feedback patterns

**Implementation**:

```typescript
// Liquid Glass Card
<LiquidGlassCard
  blur="medium"
  gradient={['#F5F5F7', '#E8E8ED']}
  shadow="soft"
>
  <Content />
</LiquidGlassCard>

// Morphing Button
<LiquidButton
  variant="primary"
  haptic="medium"
  morphDuration={300}
>
  Apply Leave
</LiquidButton>
```

### Android Material 3 Expressive Components

**Visual Characteristics**:

- Dynamic color theming
- Bold, expressive shapes
- Fluid motion design
- Predictive animations
- Material You integration

**Implementation**:

```typescript
// Expressive Card
<M3Card
  variant="elevated"
  colorScheme="dynamic"
  motion="fluid"
>
  <Content />
</M3Card>

// Morphing FAB
<M3FAB
  variant="extended"
  icon={<Plus />}
  predictiveBack={true}
>
  New Leave
</M3FAB>
```

## Performance Optimization

### Strategies

1. **Lazy Loading**: Load screens on demand
2. **Memoization**: Cache computed values (React.memo, useMemo)
3. **Virtual Lists**: Use FlashList for long lists
4. **Image Optimization**: Compress and cache images
5. **Database Indexing**: Index frequently queried columns
6. **Reanimated Worklets**: Run animations on UI thread

### Performance Targets

- **App Launch**: <500ms cold start
- **Screen Transition**: <16ms (60fps)
- **Rule Validation**: <50ms for typical request
- **Database Query**: <10ms for common queries
- **AI Response**: <2s for Gemini API calls

## Security Architecture

### Authentication Flow

```
1. App Launch
    ↓
2. Check biometric availability
    ↓
3. Prompt for Face ID / Fingerprint
    ↓
4. Decrypt local session token
    ↓
5. Validate session (offline check)
    ↓
6. Grant access to app
```

### Data Encryption

- **SQLite**: Encrypted with SQLCipher
- **MMKV**: Built-in encryption
- **Files**: iOS Data Protection / Android Keystore
- **Session Tokens**: Stored in Secure Enclave / Keystore

### Security Best Practices

- Auto-logout after 15 minutes inactivity
- Screen capture prevention for sensitive screens
- Certificate pinning for API calls
- No sensitive data in logs
- Secure random for all crypto operations

## Testing Strategy

### Unit Tests

- Rule engine functions
- Balance calculations
- Date utilities
- Validation logic

### Integration Tests

- Database operations
- State management
- Navigation flows
- AI integration

### E2E Tests

- Leave application flow
- Balance tracking
- Policy search
- AI chat interface

### Testing Tools

- Jest for unit tests
- React Native Testing Library
- Detox for E2E tests
- Maestro for UI tests

## Deployment

### Build Configuration

```typescript
// app.json
{
  "expo": {
    "name": "CDBL Leave Companion",
    "slug": "cdbl-leave-companion",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.cdbl.leave.companion",
      "buildNumber": "1",
      "supportsTablet": true
    },
    "android": {
      "package": "com.cdbl.leave.companion",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### Release Process

1. Update version numbers
2. Run full test suite
3. Build production bundles
4. Test on physical devices
5. Submit to App Store / Play Store
6. Monitor crash reports and analytics

## Future Enhancements

### Planned Features

- QR code sync with web app
- Calendar integration
- Siri/Google Assistant shortcuts
- Apple Watch / Wear OS app
- Multi-language support
- Accessibility improvements

### Technical Debt

- Migrate to Expo Router (from React Navigation)
- Add Redux DevTools for debugging
- Implement automated screenshots
- Set up CI/CD pipeline
- Add performance monitoring

## References

- [Expo Documentation](https://docs.expo.dev)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Google Gemini API](https://ai.google.dev/docs)
- [iOS Liquid Glass Design](https://developer.apple.com/design/)
- [Material 3 Expressive](https://m3.material.io/)
