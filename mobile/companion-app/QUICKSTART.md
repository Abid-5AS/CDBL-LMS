# Quick Start Guide

## CDBL Leave Companion App - Development Setup

### Prerequisites Check

```bash
# Check Node.js version (should be 20+)
node --version

# Check pnpm (should be 9+)
pnpm --version

# Check Expo CLI
npx expo --version
```

### Installation

```bash
# Navigate to the app directory
cd mobile/companion-app

# Install dependencies
pnpm install

# Start Expo dev server
pnpm start
```

### Running the App

#### iOS (requires macOS)

```bash
# Press 'i' in the Expo terminal, or:
pnpm ios
```

#### Android

```bash
# Press 'a' in the Expo terminal, or:
pnpm android
```

### Project Status

**✅ Completed**:

- Project structure and configuration
- TypeScript type system
- Offline Rule Engine core
- Casual Leave rules (4 validators)
- Documentation (README, ARCHITECTURE)

**🚧 In Progress**:

- Earned Leave rules
- Medical Leave rules
- Balance calculation engine
- UI components (iOS Liquid Glass + Android Material 3)
- Database layer (SQLite + MMKV)

**📋 Upcoming**:

- Gemini AI integration
- QR code sync
- Biometric authentication
- Analytics dashboard
- Policy library

### Key Features

#### Offline Rule Engine

The app includes a pure JavaScript rule engine that validates leaves completely offline:

```typescript
import { leaveValidator } from "@/engine/validator";

const result = leaveValidator.validate({
  leaveRequest: {
    type: "CASUAL",
    startDate: new Date("2025-12-25"),
    endDate: new Date("2025-12-27"),
    workingDays: 3,
  },
  currentBalance: { CASUAL: { used: 5, opening: 0, accrued: 10 } },
  previousLeaves: [],
  holidays: [
    { date: new Date("2025-12-26"), name: "Holiday", isOptional: false },
  ],
  gender: "MALE",
  policies: [],
  currentDate: new Date(),
});

// result.isValid → false (CL cannot be adjacent to holidays)
// result.violations → Array of policy violations
// result.suggestions → Array of alternative suggestions
```

#### Validation Rules Implemented

**Casual Leave**:

- ✅ Max 3 consecutive days
- ✅ Cannot be adjacent to holidays
- ✅ 5 days advance notice (soft warning)
- ✅ Start/end cannot be weekends or holidays

**Coming Soon**:

- Earned Leave (15-day notice, carry-forward, overflow)
- Medical Leave (certificate requirements, ML→EL conversion)
- Balance sufficiency checks
- Gender-specific leaves

### File Structure

```
mobile/companion-app/
├── README.md                    # Project overview
├── ARCHITECTURE.md              # Technical architecture
├── QUICKSTART.md               # This file
├── package.json                 # Dependencies
├── app.json                     # Expo configuration
├── tsconfig.json               # TypeScript config
│
├── src/
│   ├── types/
│   │   └── index.ts            # ✅ Type definitions
│   │
│   ├── engine/                 # Offline Rule Engine
│   │   ├── validator.ts        # ✅ Core validator
│   │   ├── suggester.ts        # 🚧 Leave suggester
│   │   ├── calculator.ts       # 🚧 Balance calculator
│   │   ├── explainer.ts        # 🚧 Explanation engine
│   │   └── rules/
│   │       ├── casual-leave.ts # ✅ CL rules
│   │       ├── earned-leave.ts # 🚧 EL rules
│   │       ├── medical-leave.ts# 🚧 ML rules
│   │       ├── balance.ts      # 🚧 Balance rules
│   │       └── date-validation.ts # 🚧 Date rules
│   │
│   ├── ai/                     # AI Layer
│   │   ├── gemini-client.ts    # 🚧 Gemini API
│   │   ├── insights.ts         # 🚧 Insight generation
│   │   └── chat.ts             # 🚧 Chat interface
│   │
│   ├── database/               # Data Layer
│   │   ├── schema.ts           # 🚧 SQLite schema
│   │   ├── queries.ts          # 🚧 Database queries
│   │   └── migrations/         # 🚧 Migrations
│   │
│   ├── store/                  # State Management
│   │   ├── leave-store.ts      # 🚧 Leave state
│   │   ├── balance-store.ts    # 🚧 Balance state
│   │   └── ui-store.ts         # 🚧 UI state
│   │
│   ├── components/             # UI Components
│   │   ├── ios/                # 🚧 Liquid Glass
│   │   ├── android/            # 🚧 Material 3
│   │   └── shared/             # 🚧 Cross-platform
│   │
│   └── utils/                  # Utilities
│       ├── date-utils.ts       # 🚧 Date helpers
│       ├── validation-utils.ts # 🚧 Validation helpers
│       └── format-utils.ts     # 🚧 Formatters
│
└── app/                        # Expo Router Screens
    ├── (tabs)/                 # 🚧 Tab navigation
    ├── apply/                  # 🚧 Apply leave flow
    ├── policy/                 # 🚧 Policy viewer
    └── ai-advisor/             # 🚧 AI chat
```

### Testing the Rule Engine

You can test the rule engine immediately:

```typescript
// Test 1: Valid CL request
const validCL = leaveValidator.validate({
  leaveRequest: {
    type: "CASUAL",
    startDate: new Date("2025-12-02"), // Monday
    endDate: new Date("2025-12-04"), // Wednesday
    workingDays: 3,
  },
  currentBalance: { CASUAL: { used: 0, accrued: 10 } },
  // ... other context
});
// Expected: isValid = true

// Test 2: CL exceeding 3 days
const invalidCL = leaveValidator.validate({
  leaveRequest: {
    type: "CASUAL",
    workingDays: 5, // Too many!
  },
  // ... context
});
// Expected: isValid = false, violation: CL_MAX_DAYS_EXCEEDED

// Test 3: CL adjacent to holiday
const adjacentCL = leaveValidator.validate({
  leaveRequest: {
    type: "CASUAL",
    startDate: new Date("2025-12-25"),
    endDate: new Date("2025-12-26"),
    workingDays: 2,
  },
  holidays: [{ date: new Date("2025-12-27"), name: "Holiday" }],
  // ... context
});
// Expected: isValid = false, violation: CL_HOLIDAY_ADJACENT
```

### Next Steps for Development

1. **Complete Rule Engine** (Priority: HIGH)

   - [ ] Earned Leave rules
   - [ ] Medical Leave rules
   - [ ] Balance validation rules
   - [ ] Date validation rules

2. **Database Layer** (Priority: HIGH)

   - [ ] SQLite schema setup
   - [ ] MMKV configuration
   - [ ] Database queries
   - [ ] Migration system

3. **UI Components** (Priority: MEDIUM)

   - [ ] iOS Liquid Glass components
   - [ ] Android Material 3 components
   - [ ] Shared components (cards, buttons, etc.)

4. **Core Screens** (Priority: MEDIUM)

   - [ ] Home/Dashboard
   - [ ] Leave application flow
   - [ ] Balance overview
   - [ ] Calendar view

5. **AI Integration** (Priority: LOW)

   - [ ] Gemini API client
   - [ ] Consent flow
   - [ ] Chat interface
   - [ ] Insight generation

6. **Polish** (Priority: LOW)
   - [ ] Biometric authentication
   - [ ] Animations and transitions
   - [ ] Error handling
   - [ ] Offline indicators

### Development Tips

1. **Hot Reload**: Expo supports fast refresh - save files and see changes instantly
2. **Debugging**: Use React Native Debugger or Flipper
3. **Testing**: Run `pnpm test` for unit tests
4. **Type Checking**: Run `pnpm type-check` before commits

### Common Issues

**Issue**: Expo won't start

```bash
# Clear cache
npx expo start --clear
```

**Issue**: SQLite errors

```bash
# Rebuild native modules
npx expo prebuild --clean
```

**Issue**: Type errors

```bash
# Reinstall dependencies
rm -rf node_modules && pnpm install
```

### Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [date-fns Docs](https://date-fns.org/docs/Getting-Started)
- [Gemini API](https://ai.google.dev/docs)

### Contributing

1. Create a feature branch
2. Implement changes
3. Add tests
4. Run type checks
5. Submit for review

### Questions?

Check the documentation or reach out to the team!

---

**Status**: 🟢 Ready for development
**Last Updated**: November 15, 2025
