# Prompt for Xcode AI Assistant (GPT-5)

Copy this prompt into Xcode's AI assistant to verify and fix the iOS app:

---

Please review and fix the CDBL Leave Companion iOS app with the following priorities:

**CRITICAL FIXES NEEDED:**
1. iOS 26 Availability Guards (MUST FIX):
   - RootView.swift: Lines 27 and 60 - Wrap `.backgroundExtensionEffect()` in `if #available(iOS 26.0, *)`
   - SidebarView.swift: Line 85 - Wrap `.backgroundExtensionEffect()` in `if #available(iOS 26.0, *)`
   - All other iOS 26 APIs (.glassEffect, .toolbarBackground) should also be properly guarded

2. Web App Consistency:
   - Match the web app's leave form implementation (see Context/web-form-reference.tsx)
   - Use exact same validation rules and error messages (see Context/web-form-validation-rules.md)
   - Match color scheme and spacing (see Context/web-app-design-tokens.md)
   - Ensure leave types: Only CASUAL, MEDICAL, EARNED (matching web form)
   - Field labels and error messages should be consistent with web app

**COMPLETION VERIFICATION:**
Verify all 17 tasks are implemented (see Context/IMPLEMENTATION_TASKS.md):
1. Documentation (DOCS.md, README.md, leave-schema.json)
2. StyleGuide.swift
3. GlassButton, GlassCard, GlassFormField, ActivityBadge, GlassEffectContainer
4. Core Data model updated (LeaveEntity)
5. LeaveRequest.swift with validation
6. LeaveSigner.swift (HMAC-SHA256 + Keychain)
7. LeaveExporter.swift
8. QRGenerator.swift
9. EmailComposer.swift
10. LeaveFormView.swift
11. ConfirmationView.swift
12. HistoryView.swift
13. LeaveRequestDetailView.swift
14. RootView.swift
15. CDBLLeaveCompanionApp.swift uses RootView
16. HapticFeedback.swift
17. NetworkMonitor.swift + ParallaxBackground.swift

**ERROR CHECKING:**
1. Compilation errors, type mismatches, missing imports
2. Core Data: No "Item" entity references, LeaveEntity correctly configured
3. All frameworks imported: SwiftUI, CoreData, CoreImage, CryptoKit, MessageUI, Network, Combine
4. EmailComposer: Proper nil handling and error cases
5. Core Data saves: Proper error handling (no fatalError in production paths)

**WEB APP CONSISTENCY CHECKS:**
1. Color scheme: Match web app's design tokens where possible, use system adaptive colors
2. Typography: Ensure font weights and sizes align with web app
3. Spacing: Match web app spacing scale (24pt = gap-6, 16pt = gap-4, etc.)
4. Leave types: Only CASUAL, MEDICAL, EARNED (matching web form - see Context/WEB_APP_REFERENCE.md)
5. Validation: Same rules as web (10 char minimum reason, certificate required for MEDICAL >3 days)
6. Status flow: DRAFT → SUBMITTED → PENDING → APPROVED/REJECTED (match web workflow)
7. Error messages: Use exact wording from web app (see Context/web-form-validation-rules.md)

**CODE STYLE:**
1. All iOS 26 APIs wrapped with `@available(iOS 26.0, *)` or `if #available(iOS 26.0, *)`
2. No force unwraps (!) that could crash
3. Proper error handling throughout
4. MARK comments for organization
5. No deprecated APIs

**SECURITY:**
1. Keychain properly used for signing key
2. No sensitive data logged
3. HMAC-SHA256 correctly implemented

**OUTPUT:**
1. Apply all iOS 26 availability guards immediately (CRITICAL)
2. Report any missing implementations
3. Report compilation/build errors
4. Suggest web app consistency improvements
5. Confirm "All tasks complete and errors fixed" when done

**REFERENCES:**
All context files are in the `Context/` directory:
- **Context/WEB_APP_REFERENCE.md** - Web app form implementation details and consistency requirements
- **Context/prisma-schema.prisma** - Database schema for data model alignment
- **Context/web-form-reference.tsx** - Complete web form component reference
- **Context/web-form-validation-rules.md** - Exact validation rules and error messages
- **Context/web-app-design-tokens.md** - Color, spacing, typography reference
- **Context/IMPLEMENTATION_TASKS.md** - Complete task checklist
- **Context/FILES_CHECKLIST.md** - List of all files to verify
- **Context/README.md** - Overview of context directory

Priority: Fix availability guards first, then verify web app consistency, then complete error check.

**NOTE**: Review all Context/ files before making changes to understand the full requirements and design system.

---

