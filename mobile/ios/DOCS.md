# CDBL Leave Companion iOS App - Technical Documentation

## 📱 App Purpose

The **CDBL Leave Companion** is a SwiftUI-based iOS companion app for the internal CDBL Leave Management System. It enables employees to:

- Apply for leave (Earned, Casual, Sick/Medical) offline
- Attach supporting files (especially for Medical Leave > 3 days)
- Generate secure handoff packages (JSON + QR code)
- Email packages directly to CDBL HR from their company email

The app operates **offline-first** with **zero-login** requirement and prioritizes **data privacy**. It integrates visually and logically with the existing Next.js 16 + Prisma web application.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    iOS App Layer                         │
├─────────────────────────────────────────────────────────┤
│  SwiftUI Views                                          │
│  ├── RootView (NavigationSplitView/TabView)             │
│  ├── LeaveFormView                                      │
│  ├── ConfirmationView                                   │
│  └── HistoryView                                        │
├─────────────────────────────────────────────────────────┤
│  Services Layer                                         │
│  ├── LeaveExporter (JSON generation)                    │
│  ├── QRGenerator (CoreImage)                            │
│  ├── EmailComposer (MessageUI)                         │
│  └── LeaveSigner (CryptoKit HMAC-SHA256)                │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  ├── Models (Codable structs matching Prisma)           │
│  └── Core Data (Local persistence: LeaveEntity)        │
├─────────────────────────────────────────────────────────┤
│  iOS 26 Liquid Glass UI System                          │
│  ├── NavigationSplitView with background extension      │
│  ├── System-provided glass effects                     │
│  └── Custom activity badges                            │
└─────────────────────────────────────────────────────────┘
         │
         │ Email (JSON + QR)
         ▼
┌─────────────────────────────────────────────────────────┐
│           CDBL Web App (Next.js 16 + Prisma)           │
│              Desktop Import & Validation                │
└─────────────────────────────────────────────────────────┘
```

### View Hierarchy

```
CDBLLeaveCompanionApp
└── RootView
    ├── NavigationSplitView (iPad/Mac) or TabView (iPhone)
    │   ├── Sidebar/List
    │   │   ├── LeaveFormView
    │   │   └── HistoryView
    │   └── Detail
    │       └── ConfirmationView
    └── Settings (optional)
```

---

## 🔄 Data Flow

### Leave Request Creation Flow

```
1. User Input (LeaveFormView)
   ├── Type selection (CASUAL | MEDICAL | EARNED)
   ├── Date range (startDate, endDate)
   ├── Reason (text)
   └── Optional: Medical certificate (if MEDICAL > 3 days)

2. Local Validation
   ├── Required fields check
   ├── Date range validation
   ├── File size/type validation (if attachment)
   └── Save draft to Core Data (LeaveEntity)

3. Export Generation
   ├── Convert LeaveEntity → LeaveRequest (Codable)
   ├── Sign with HMAC-SHA256 (LeaveSigner)
   │   └── Add timestamp, expiry (24h), signature
   ├── Serialize to JSON (LeaveExporter)
   └── Generate QR code from JSON (QRGenerator)

4. Handoff Options
   ├── Email to CDBL HR (EmailComposer)
   │   ├── Pre-filled recipient: hr@cdbl.com.bd (configurable)
   │   ├── Subject: "Leave Request - [Type] - [Date Range]"
   │   └── Attachments: JSON file + QR PNG
   ├── Save to Files app
   └── System Share Sheet

5. Desktop Import (Future)
   └── Web app validates signature, expiry, imports to Prisma
```

### Security Flow

```
LeaveRequest Data
    │
    ├── Serialize to JSON
    │
    ├── Generate HMAC-SHA256 signature
    │   └── Key: Device-specific (stored in Keychain)
    │
    ├── Create SignedLeavePackage:
    │   {
    │     "data": { ...LeaveRequest },
    │     "signature": "hex-encoded-hmac",
    │     "timestamp": "ISO8601",
    │     "expiry": "ISO8601 (+24h)"
    │   }
    │
    └── Final JSON payload for export
```

---

## 🔒 Security Model

### Signature Generation

- **Algorithm**: HMAC-SHA256
- **Key Management**: 
  - Per-device unique key generated on first launch
  - Stored securely in iOS Keychain
  - Never transmitted or exposed
- **Expiry**: 24 hours from creation timestamp
- **Validation** (web app side): Recompute HMAC, verify signature, check expiry

### Data Privacy

- **Zero-login**: No authentication required
- **Offline-first**: All data stored locally in Core Data
- **No API calls**: Email is only external communication
- **Certificate handling**: Medical certificates stored as `Data` in Core Data, never uploaded automatically

### Signature Structure

```swift
struct SignedLeavePackage: Codable {
    let data: LeaveRequest
    let signature: String      // Hex-encoded HMAC-SHA256
    let timestamp: Date        // ISO8601 format
    let expiry: Date           // timestamp + 24h
}
```

---

## 📁 File Structure

```
/mobile/ios/
├── DOCS.md                          # This file
├── README.md                        # Build & run instructions
├── schema/
│   └── leave-schema.json           # JSON schema matching Prisma
└── CDBLLeaveCompanion/
    ├── CDBLLeaveCompanionApp.swift  # App entry point
    ├── Persistence.swift            # Core Data controller
    │
    ├── Models/
    │   └── LeaveRequest.swift       # Codable model + validation
    │
    ├── Views/
    │   ├── RootView.swift           # Navigation (iOS 26 Liquid Glass)
    │   ├── LeaveFormView.swift      # Main form
    │   ├── ConfirmationView.swift   # Export success screen
    │   └── HistoryView.swift        # Past requests list
    │
    ├── Services/
    │   ├── LeaveExporter.swift      # JSON generation
    │   ├── QRGenerator.swift        # QR code creation (CoreImage)
    │   ├── EmailComposer.swift      # Email composition (MessageUI)
    │   └── LeaveSigner.swift        # CryptoKit signing
    │
    └── UI/
        └── StyleGuide.swift         # Design tokens for iOS 26 Liquid Glass
```

---

## 🎨 Design System: iOS 26 Liquid Glass

### Overview

Leverage **system-provided Liquid Glass effects** introduced in iOS 26, rather than custom glass implementations.

### Key iOS 26 Features (Stable Release)

1. **NavigationSplitView with Background Extension**
   - Content automatically extends under sidebar/inspector
   - Blur effects applied by system
   - Adaptive layouts for window size changes
   - Use `.backgroundExtensionEffect()` modifier

2. **System Glass Effects in Toolbars**
   - Native toolbar styling with glass effects
   - Automatic light/dark mode support
   - System-provided Liquid Glass in standard components

3. **Background Extension Effects**
   - `.backgroundExtensionEffect()` modifier for sidebars
   - Content scrolling extends under sidebars
   - Horizontal scroll views extend under sidebar/inspector

4. **Custom Activity Badges**
   - Animated activity indicators using Liquid Glass style
   - Custom glass effects for interface elements

### Design Tokens (StyleGuide.swift)

```swift
// Minimal color palette (content-focused)
- Primary: System blue
- Secondary: System gray
- Background: Clear (let system handle glass effects)
- Text: System foreground colors

// Typography
- Title: .largeTitle, .bold
- Body: .body
- Caption: .caption

// Spacing
- Padding: 16pt, 24pt
- Corner radius: 12pt, 16pt
```

### UI Components

- **Prefer system components** with Liquid Glass styling
- Use `NavigationSplitView` for iPad/Mac layouts
- Apply background extension effects where appropriate
- Leverage system modifiers for depth and blur

---

## 🛠️ Technology Stack

### Frameworks

- **SwiftUI 3+**: Primary UI framework
- **Combine**: Reactive data flow (optional, for future enhancements)
- **CoreData**: Local persistence (leave history, drafts)
- **CoreImage**: QR code generation (`CIFilter.qrCodeGenerator`)
- **CryptoKit**: HMAC-SHA256 signing (`HMAC<SHA256>`)
- **MessageUI**: Email composition (`MFMailComposeViewController`)
- **Foundation**: JSON encoding, date formatting, file I/O

### iOS Version

- **Minimum**: iOS 17.0 (for modern SwiftUI features)
- **Target**: iOS 26.0+ (for Liquid Glass APIs)
- **Liquid Glass**: Fully supported in iOS 26.0+ stable

### Dependencies

- **Zero external dependencies** (focus on Apple frameworks)
- All functionality provided by native iOS SDK

---

## 📊 Data Models

### LeaveRequest (Codable)

```swift
enum LeaveType: String, Codable {
    case CASUAL = "CASUAL"
    case MEDICAL = "MEDICAL"
    case EARNED = "EARNED"
}

enum LeaveStatus: String, Codable {
    case DRAFT
    case SUBMITTED
    case PENDING
    case APPROVED
    case REJECTED
    case CANCELLED
}

struct LeaveRequest: Codable {
    let type: LeaveType
    let startDate: Date          // ISO8601
    let endDate: Date            // ISO8601
    let workingDays: Int         // Calculated: (endDate - startDate) + 1
    let reason: String
    let needsCertificate: Bool
    let status: LeaveStatus
    let policyVersion: String    // "v1.1" (from web app)
}
```

### Core Data: LeaveEntity

```swift
@objc(LeaveEntity)
class LeaveEntity: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var type: String           // LeaveType rawValue
    @NSManaged var startDate: Date
    @NSManaged var endDate: Date
    @NSManaged var reason: String
    @NSManaged var needsCertificate: Bool
    @NSManaged var status: String          // LeaveStatus rawValue
    @NSManaged var createdAt: Date
    @NSManaged var certificateData: Data? // Optional attachment
    @NSManaged var exported: Bool          // Track if sent
}
```

### SignedLeavePackage (Export Format)

```swift
struct SignedLeavePackage: Codable {
    let data: LeaveRequest
    let signature: String      // Hex-encoded HMAC-SHA256
    let timestamp: String      // ISO8601
    let expiry: String         // ISO8601
}
```

---

## 🔄 Demo Flow Storyboard

### Scene 1: Launch
- App opens to **RootView**
- NavigationSplitView shows sidebar (iPad) or TabView (iPhone)
- Default tab: **LeaveFormView**

### Scene 2: Create Leave Request
1. User selects leave type (CASUAL, MEDICAL, EARNED)
2. Picks date range using DatePicker
3. Enters reason in TextEditor (min 10 chars)
4. If MEDICAL > 3 days, file picker appears
5. Real-time validation feedback
6. Save draft button (optional) → Core Data

### Scene 3: Export
1. User taps "Generate Export" or "Submit"
2. **LeaveSigner** creates signed package
3. **QRGenerator** creates QR code image
4. **ConfirmationView** appears with:
   - Success animation
   - QR code preview
   - Action buttons: Email, Save to Files, Share

### Scene 4: Email Composition
1. User taps "Email to CDBL HR"
2. **EmailComposer** opens `MFMailComposeViewController`
3. Pre-filled:
   - To: `hr@cdbl.com.bd` (configurable)
   - Subject: "Leave Request - [Type] - [Dates]"
   - Body: Pre-written message
   - Attachments: JSON file + QR PNG

### Scene 5: History
1. User navigates to **HistoryView**
2. List of all past leave requests from Core Data
3. Filter by type/status
4. Tap item → View details or re-export

---

## 🔗 Integration with Web App

### JSON Schema Alignment

The iOS app generates JSON matching the Prisma `LeaveRequest` model:

```json
{
  "data": {
    "type": "MEDICAL",
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-05T00:00:00Z",
    "workingDays": 5,
    "reason": "Medical treatment required",
    "needsCertificate": true,
    "status": "DRAFT",
    "policyVersion": "v1.1"
  },
  "signature": "a1b2c3d4...",
  "timestamp": "2025-10-31T12:00:00Z",
  "expiry": "2025-11-01T12:00:00Z"
}
```

### Desktop Import (Future)

1. HR receives email with JSON attachment
2. Web app validates:
   - Signature (recompute HMAC, compare)
   - Expiry (must be valid)
   - Data structure (matches Prisma schema)
3. If valid, create `LeaveRequest` in database
4. Status set to `SUBMITTED` or `PENDING`

---

## 🧪 Testing Strategy

### Unit Tests
- Model validation logic
- Signing/verification algorithms
- Date calculations (working days)

### UI Tests
- Form validation flows
- Export generation
- Email composition (simulated)

### Manual Testing
- iPhone simulator
- iPad simulator
- Physical device (personal iPhone)
- Email delivery verification

---

## 📝 Version History

- **v1.0.0** (Initial Release)
  - Basic leave form
  - JSON/QR export
  - Email integration
  - iOS 26 Liquid Glass UI

---

## 🔮 Future Enhancements

- Support all Prisma LeaveType enum values (not just 3)
- Balance sync from web app (if API available)
- Push notifications for approval status
- Multi-language support
- Apple Watch companion app
- VisionOS support (floating UI)

---

## 📚 References

- [Apple Developer: iOS 26 Liquid Glass](https://developer.apple.com/documentation)
- [SwiftUI NavigationSplitView](https://developer.apple.com/documentation/swiftui/navigationsplitview)
- [CryptoKit Documentation](https://developer.apple.com/documentation/cryptokit)
- [CDBL Web App: Prisma Schema](../prisma/schema.prisma)

