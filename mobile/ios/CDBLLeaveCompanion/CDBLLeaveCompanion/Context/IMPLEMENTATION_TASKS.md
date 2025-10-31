# iOS Leave Companion App - Implementation Tasks Checklist

## All 17 Tasks

### Phase 1: Documentation & Architecture (3 tasks)
- [x] **doc-phase1**: Create DOCS.md with architecture, data flow, security model, and design system documentation
- [x] **readme-build**: Create README.md with build instructions and provisioning guide
- [x] **json-schema**: Generate leave-schema.json matching Prisma LeaveRequest structure

### Phase 2: Liquid Glass UI System (2 tasks)
- [x] **style-guide**: Create StyleGuide.swift with Liquid Glass color palette, fonts, and modifier definitions
- [x] **glass-components**: Implement GlassButton, GlassCard, and GlassFormField reusable components

### Phase 3: Core Functionality (9 tasks)
- [x] **core-data-model**: Update Core Data model: replace Item with LeaveEntity entity, add all required fields
- [x] **leave-model**: Create LeaveRequest.swift Codable model with validation helpers
- [x] **signing-service**: Implement LeaveSigner.swift with CryptoKit HMAC-SHA256 signing and Keychain storage
- [x] **exporter-service**: Create LeaveExporter.swift to convert leave data to signed JSON
- [x] **qr-generator**: Implement QRGenerator.swift using CoreImage CIFilter
- [x] **email-composer**: Create EmailComposer.swift with pre-filled CDBL HR email and attachment support
- [x] **leave-form-view**: Build LeaveFormView with all form fields, validation, and Liquid Glass styling
- [x] **confirmation-view**: Create ConfirmationView with success animation, QR preview, and share actions
- [x] **history-view**: Implement HistoryView to display past leave requests from Core Data

### Phase 4: Integration & Enhancements (3 tasks)
- [x] **root-navigation**: Create RootView with tab navigation replacing default ContentView
- [x] **app-update**: Update CDBLLeaveCompanionApp.swift to use RootView and new persistence context
- [x] **enhancements**: Add haptic feedback, offline indicator, and parallax animations

## Critical Issues to Fix

### iOS 26 Availability Guards (CRITICAL)
1. **RootView.swift**:
   - Line 27: `.backgroundExtensionEffect()` in iPad detail section needs `if #available(iOS 26.0, *)`
   - Line 60: `.backgroundExtensionEffect()` in macOS detail section needs `if #available(iOS 26.0, *)`

2. **SidebarView.swift**:
   - Line 85: `.backgroundExtensionEffect()` needs `if #available(iOS 26.0, *)` guard

### Web App Consistency Checks
1. Verify leave types match: Only CASUAL, MEDICAL, EARNED (not all enum values)
2. Verify validation rules match web app exactly
3. Verify error messages use exact same wording
4. Verify spacing matches web app (24pt = gap-6, etc.)
5. Verify status labels match web app

### Error Checking
1. Ensure ContentView.swift is deleted (replaced by RootView)
2. Verify no references to old "Item" entity remain
3. Check all Core Data saves have proper error handling
4. Verify EmailComposer handles nil/optional cases
5. Check for missing imports (CoreData, Combine, etc.)

## Files ChatGPT Requested to Verify

- [x] CDBLLeaveCompanionApp.swift (uses RootView, ContentView removed)
- [x] DOCS.md
- [x] README.md
- [x] leave-schema.json
- [x] ActivityBadge.swift
- [x] GlassEffectContainer.swift
- [x] LeaveRequest.swift (Codable, validation)
- [x] LeaveSigner.swift (HMAC-SHA256, Keychain)
- [x] LeaveExporter.swift
- [x] ConfirmationView.swift
- [x] PersistenceController.swift

## Security Checks

- [x] Keychain usage for signing key storage
- [x] HMAC-SHA256 correctness (CryptoKit)
- [x] No sensitive data logged

## Style and Best Practices

- [ ] All iOS 26 APIs wrapped with availability checks
- [ ] No force unwraps that could crash
- [ ] Proper error handling throughout
- [ ] MARK comments for organization
- [ ] No deprecated APIs

