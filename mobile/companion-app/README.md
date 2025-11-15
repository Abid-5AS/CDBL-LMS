# CDBL Leave Companion App

**Standalone, Offline-First React Native Mobile App for Employees**

## Overview

A fully offline React Native companion app that helps employees manage their leave without requiring company server access. Features an intelligent offline rule engine and optional Google Gemini AI integration for enhanced insights.

## Key Features

### 🎯 Core Features (100% Offline)

- **Leave Management**: View history, draft requests, track balances
- **Offline Rule Engine**: Validates leaves, suggests alternatives, explains policies
- **Balance Tracking**: Real-time balance calculations with projections
- **Holiday Calendar**: Cached company holidays with visualization
- **Policy Library**: Searchable, contextual policy guidance
- **Analytics Dashboard**: Personal leave trends and insights

### 🤖 AI-Enhanced Features (Optional, Online Only)

- **Natural Language Policy Q&A**: Ask questions about leave policies
- **Smart Suggestions**: AI-powered leave planning recommendations
- **Trend Analysis**: Pattern recognition and predictive insights
- **Conversational Interface**: Chat with policies in plain language

### 🎨 Platform-Specific Design

- **iOS**: Liquid Glass Design (iOS 26) with frosted glass effects, dynamic islands
- **Android**: Material 3 Expressive (Android 16) with dynamic colors, fluid animations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Native App (Expo)                │
├─────────────────────────────────────────────────────────┤
│  UI Layer                                               │
│  ├─ iOS: Liquid Glass Components                       │
│  └─ Android: Material 3 Expressive Components          │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  ├─ Offline Rule Engine (Core)                         │
│  │  ├─ Leave Validator                                 │
│  │  ├─ Policy Suggester                                │
│  │  ├─ Balance Calculator                              │
│  │  └─ Explanation Engine                              │
│  │                                                      │
│  └─ AI Layer (Optional, Online)                        │
│     ├─ Google Gemini API Client                        │
│     ├─ Insight Generator                               │
│     └─ Natural Language Processor                      │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  ├─ SQLite (Leave History, Balances)                   │
│  ├─ MMKV (Settings, Cache)                             │
│  └─ File System (Documents, Certificates)              │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Core

- **Framework**: React Native (Expo SDK 52+)
- **Language**: TypeScript 5.6+
- **State Management**: Zustand
- **Navigation**: React Navigation 7
- **Forms**: React Hook Form + Zod

### Storage

- **Database**: SQLite (expo-sqlite)
- **Key-Value**: MMKV (react-native-mmkv)
- **File System**: expo-file-system

### UI Libraries

- **iOS**: Custom Liquid Glass components (SwiftUI bridge)
- **Android**: Material 3 Expressive components
- **Icons**: Lucide React Native
- **Animations**: Reanimated 3, Skia

### AI Integration

- **API**: Google Gemini 2.0 Flash
- **Context**: User's local data only (with consent)
- **Privacy**: Zero server data sharing

## Project Structure

```
mobile/companion-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── leaves.tsx            # Leave history
│   │   ├── balance.tsx           # Balance overview
│   │   ├── calendar.tsx          # Holiday calendar
│   │   └── more.tsx              # Settings & more
│   ├── apply/                    # Apply for leave flow
│   ├── policy/                   # Policy viewer
│   └── ai-advisor/               # AI chat interface
├── src/
│   ├── components/               # UI components
│   │   ├── ios/                  # iOS Liquid Glass
│   │   ├── android/              # Material 3 Expressive
│   │   └── shared/               # Cross-platform
│   ├── engine/                   # Offline Rule Engine
│   │   ├── validator.ts          # Leave validation
│   │   ├── suggester.ts          # Leave suggestions
│   │   ├── calculator.ts         # Balance calculations
│   │   ├── explainer.ts          # Policy explanations
│   │   └── rules/                # Rule definitions
│   ├── ai/                       # AI Layer
│   │   ├── gemini-client.ts      # Gemini API wrapper
│   │   ├── insights.ts           # Insight generation
│   │   └── chat.ts               # Conversational interface
│   ├── database/                 # Data layer
│   │   ├── schema.ts             # SQLite schema
│   │   ├── queries.ts            # Database queries
│   │   └── migrations/           # DB migrations
│   ├── store/                    # Zustand stores
│   ├── utils/                    # Utilities
│   └── types/                    # TypeScript types
├── assets/                       # Images, fonts
└── docs/                         # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
cd mobile/companion-app
pnpm install
```

### Development

```bash
# Start Expo dev server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

## Offline Rule Engine

The heart of the app - a pure JavaScript rule engine that runs entirely offline.

### Leave Validation Rules

- ✅ CL max 3 consecutive days
- ✅ CL holiday adjacency (no side-touching)
- ✅ EL 15-day advance notice
- ✅ ML >14 days → excess converts to EL
- ✅ EL overflow handling
- ✅ Gender-specific leaves (Maternity/Paternity)
- ✅ Combination restrictions
- ✅ Balance sufficiency checks

### Suggestion Engine

Based on user input, the engine suggests:

- Best leave type for the situation
- Whether to split or break leave
- Automatic conversions (CL→EL, ML→EL)
- Alternative date ranges

### Explanation Engine

Provides offline explanations for:

- Why a leave request is invalid
- What policy rule applies
- What conversions happened
- How balance was calculated

## AI Integration (Optional)

### User Consent Required

- Explicit opt-in during onboarding
- Clear data usage disclosure
- Can be disabled anytime

### Gemini Capabilities

**Natural Language Q&A**

```
User: "Can I take 5 days casual leave in December?"
AI: "Yes, but you'll need to split it into two requests
     (max 3 consecutive days for CL). Consider using
     EL if you want continuous time off."
```

**Smart Suggestions**

- Predicts best months to take leave
- Suggests leave combinations
- Warns about balance exhaustion

**Insight Generation**

- Monthly summaries
- Pattern analysis
- Trend predictions

### Privacy Guarantee

- Only user's local offline data shared
- No CDBL server or corporate data
- No PII sent to Gemini
- Data anonymized before API calls

## Data Sync Strategy

### No Constant Server Connection

- App works 100% offline
- Data synced via QR code pairing (future feature)
- Manual export/import supported

### Staleness Indicators

- "Last synced: X days ago" badge
- Prompt to sync before critical operations
- Offline-first, sync-optional approach

## Platform-Specific Features

### iOS (Liquid Glass Design)

- Frosted glass navigation bars
- Dynamic Island integration (iOS 26+)
- Live Activities for leave countdowns
- Haptic feedback patterns
- Widgets (Home Screen, Lock Screen)

### Android (Material 3 Expressive)

- Dynamic color theming
- Predictive back animations
- Morphing FABs
- Material You adaptive icons
- Widgets (Home Screen, Glance)

## Security

- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Encrypted local storage
- Auto-logout after inactivity
- Secure file storage for certificates
- No analytics tracking

## Performance

- App size: <15MB
- Startup time: <500ms
- Offline-first: Zero network dependency
- Battery efficient: Minimal background processing

## Future Enhancements

- QR code sync with web app
- Calendar integration (add approved leaves)
- Push notifications (via local notifications)
- Siri/Google Assistant shortcuts
- Apple Watch / Wear OS companion
- Multi-language support

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

Proprietary - CDBL Internal Use Only
