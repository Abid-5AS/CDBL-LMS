# Files Checklist for GPT Verification

This file lists all files ChatGPT should verify for completion and correctness.

## Documentation Files
- [x] `/mobile/ios/DOCS.md` - Technical documentation
- [x] `/mobile/ios/README.md` - Build instructions
- [x] `/mobile/ios/schema/leave-schema.json` - JSON schema

## UI System Files
- [x] `UI/StyleGuide.swift` - Design tokens
- [x] `UI/Components/GlassButton.swift` - Glass button component
- [x] `UI/Components/GlassCard.swift` - Glass card component
- [x] `UI/Components/GlassFormField.swift` - Glass form field component
- [x] `UI/Components/ActivityBadge.swift` - Activity badge with Liquid Glass
- [x] `UI/Components/GlassEffectContainer.swift` - Container for animations
- [x] `UI/HapticFeedback.swift` - Haptic feedback utilities
- [x] `UI/NetworkMonitor.swift` - Network connectivity monitor
- [x] `UI/ParallaxBackground.swift` - Parallax background animation

## Model Files
- [x] `Models/LeaveRequest.swift` - Codable model with validation

## Service Files
- [x] `Services/LeaveSigner.swift` - HMAC-SHA256 signing with Keychain
- [x] `Services/LeaveExporter.swift` - JSON export service
- [x] `Services/QRGenerator.swift` - QR code generation
- [x] `Services/EmailComposer.swift` - Email composition (with Combine import)

## View Files
- [x] `Views/RootView.swift` - Main navigation (with iOS 26 availability guards needed)
- [x] `Views/LeaveFormView.swift` - Leave application form
- [x] `Views/ConfirmationView.swift` - Export confirmation screen
- [x] `Views/HistoryView.swift` - Leave history list
- [x] `Views/LeaveRequestDetailView.swift` - Detailed leave request view

## App Configuration
- [x] `CDBLLeaveCompanionApp.swift` - App entry point (uses RootView, ContentView removed)
- [x] `Persistence.swift` - Core Data controller (uses LeaveEntity)

## Core Data Model
- [x] `CDBLLeaveCompanion.xcdatamodeld/.../contents` - Updated to LeaveEntity (no Item entity)

## Files That Should NOT Exist
- [ ] `ContentView.swift` - Should be deleted (replaced by RootView)

## Critical Files to Check

### RootView.swift
**Issues to fix:**
- Line 27: `.backgroundExtensionEffect()` needs `if #available(iOS 26.0, *)` guard
- Line 60: `.backgroundExtensionEffect()` needs `if #available(iOS 26.0, *)` guard
- Line 85 (SidebarView): `.backgroundExtensionEffect()` needs `if #available(iOS 26.0, *)` guard

### LeaveFormView.swift
**Check:**
- Validation rules match web app exactly
- Error messages use exact wording from web app
- Leave types: Only CASUAL, MEDICAL, EARNED
- Reason minimum: 10 characters
- Certificate required: MEDICAL > 3 days

### All View Files
**Check:**
- All iOS 26 APIs properly guarded
- `.toolbarBackground(.ultraThinMaterial)` used on navigation bars
- `.glassEffect()` properly used where applicable

### EmailComposer.swift
**Check:**
- `import Combine` is present (for @Published)
- Nil handling for mail composer
- Proper error handling

### Core Data Files
**Check:**
- No references to "Item" entity
- LeaveEntity has all required fields
- Preview data uses LeaveEntity correctly

## Import Verification

All files should have proper imports:
- `import SwiftUI` (all views)
- `import CoreData` (where needed)
- `import CoreImage` (QRGenerator)
- `import CryptoKit` (LeaveSigner)
- `import MessageUI` (EmailComposer)
- `import Network` (NetworkMonitor)
- `import Combine` (NetworkMonitor, EmailComposer)

## Web App Consistency Check

Verify against:
- `Context/WEB_APP_REFERENCE.md` - Web app features and patterns
- `Context/web-form-reference.tsx` - Web form implementation
- `Context/web-form-validation-rules.md` - Validation rules
- `Context/web-app-design-tokens.md` - Design tokens
- `Context/prisma-schema.prisma` - Data model schema

