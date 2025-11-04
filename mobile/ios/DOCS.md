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
    case RETURNED                 // Policy v2.0: Returned for modification
    case CANCELLATION_REQUESTED   // Policy v2.0: Cancellation request pending
    case RECALLED                 // Policy v2.0: Recalled by HR
    case OVERSTAY_PENDING         // Policy v2.0: Overstay detected
}

struct LeaveRequest: Codable {
    let type: LeaveType
    let startDate: Date          // ISO8601, normalized to Asia/Dhaka midnight
    let endDate: Date            // ISO8601, normalized to Asia/Dhaka midnight
    let workingDays: Int         // Calculated: (endDate - startDate) + 1 (inclusive calendar days)
    let reason: String            // Minimum 10 characters
    let needsCertificate: Bool     // Required if MEDICAL > 3 days
    let status: LeaveStatus
    let policyVersion: String    // "v2.0" (Policy v2.0)
    let fitnessCertificateUrl: String?  // Optional: Required for ML > 7 days on return
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

## 📋 Policy Logic Compliance (Policy v2.0)

> **Source of Truth**: All rules in this section align with `/docs/Policy Logic/` documentation, which is the ultimate source of truth for business rules.

### Leave Entitlements & Annual Caps

| Leave Type | Annual Entitlement | Accrual Rate | Carry Forward | Annual Cap |
|------------|-------------------|--------------|---------------|------------|
| **EARNED (EL)** | 24 days/year | 2 working days/month | Yes, up to 60 days | None (subject to accrual) |
| **CASUAL (CL)** | 10 days/year | Granted at start of year | No (lapses Dec 31) | 10 days/year (hard limit) |
| **MEDICAL (ML)** | 14 days/year | Granted at start of year | No | 14 days/year (hard limit) |

### Earned Leave (EL) Rules

#### Entitlement & Accrual
- **Annual Total**: 24 days/year (2 days × 12 months)
- **Accrual**: 2 working days per month while on duty
- **Carry-Forward**: Up to 60 days maximum (opening + accrued combined)
- **Calculation**: Available balance = `(opening ?? 0) + (accrued ?? 0) - (used ?? 0)`

#### Advance Notice Requirement
- **Minimum**: ≥ **5 working days** before start date (Policy 6.11)
- **Calculation**: Counts working days only (excludes Friday, Saturday, and company holidays)
- **Enforcement**: Hard block if insufficient notice
- **Error**: `el_insufficient_notice`

#### Backdating Rules
- **Allowed**: Yes, up to 30 days back
- **Org Setting**: May require confirmation (`"ask"` mode)
- **Validation**: Window limit enforced at server

### Casual Leave (CL) Rules

#### Annual Cap
- **Limit**: 10 days per calendar year
- **Counting**: Includes `APPROVED` + `PENDING` status
- **Enforcement**: Hard block if annual usage exceeds 10 days

#### Consecutive Days Limit
- **Maximum**: **3 consecutive days per spell** (not 7 days)
- **Enforcement**: Hard block
- **Error**: `cl_exceeds_consecutive_limit`

#### Holiday/Weekend Side-Touch Restriction
- **Critical Rule**: CL **cannot start or end** on Friday, Saturday, or company holidays
- **Enforcement**: Hard block
- **Error**: `cl_cannot_touch_holiday`
- **Message**: "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."

#### Advance Notice (Soft Warning)
- **Recommended**: 5 working days before start
- **Enforcement**: Warning only (allows submission)
- **Warning Flag**: `clShortNotice`

#### Backdating Rules
- **Allowed**: **No** (start date must be >= today)
- **Enforcement**: Hard block

### Medical Leave (ML) Rules

#### Annual Cap
- **Limit**: 14 days per calendar year
- **Counting**: Same as CL (includes `APPROVED` + `PENDING`)
- **Enforcement**: Hard block if annual usage exceeds 14 days

#### Medical Certificate Requirement
- **Trigger**: Required if leave duration > 3 days
- **Enforcement**: Hard block (checked before other validations)
- **Error**: `medical_certificate_required`
- **File Validation**:
  - Types: PDF, JPG, JPEG, PNG only
  - Size: Maximum 5 MB
  - MIME validation: Server-side validation using `file-type` library

#### Fitness Certificate Requirement (Return-to-Duty)
- **Trigger**: MEDICAL leave where `workingDays > 7`
- **Policy**: Section 6.14 — "Medical leave over 7 days requires fitness certificate on return"
- **Field**: `fitnessCertificateUrl` in LeaveRequest
- **Enforcement**: Required when submitting duty return for ML > 7 days

#### Advance Notice
- **Required**: **None** (can be submitted same-day)
- **Exception**: Can be submitted on day of rejoining (Policy 6.11a)

#### Backdating Rules
- **Allowed**: Yes, up to 30 days back
- **Validation**: Window limit enforced

### Date & Time Handling

#### Timezone
- **Standard**: **Asia/Dhaka** (GMT+6)
- **Normalization**: All dates normalized to Dhaka midnight before validation
- **Display Format**: `DD/MM/YYYY` (British English format)
- **Function**: Use `normalizeToDhakaMidnight()` for all date comparisons

#### Weekend Definition (Bangladesh)
- **Weekend Days**: Friday (day index 5), Saturday (day index 6)
- **Working Days**: Sunday (0) through Thursday (4)

#### Start/End Date Restrictions
- **Cannot Be**: Friday, Saturday, or any company holiday
- **Enforcement**: Hard block in UI and API
- **UI Messages**:
  - "Start date cannot be on Friday, Saturday, or a company holiday"
  - "End date cannot be on Friday, Saturday, or a company holiday"

#### Leave Duration Calculation
- **Method**: **Inclusive calendar days** (all days count, including weekends/holidays)
- **Formula**: `(endDate - startDate) + 1` calendar days
- **Note**: Weekends and holidays **inside** the range count toward leave balance

#### Working Days Calculation (for Notice)
- **Purpose**: Used for advance notice calculations only
- **Method**: Excludes weekends (Fri/Sat) and company holidays
- **Usage**: EL ≥5 working days notice calculation

### File Upload Rules

#### Medical Certificate Upload
- **Required**: When MEDICAL leave > 3 days
- **File Types**: PDF, JPG, JPEG, PNG only (case-insensitive)
- **File Size**: Maximum 5 MB (5,242,880 bytes)
- **Validation**:
  - Extension check (client-side)
  - MIME type validation (server-side via `file-type` library)
  - Size validation (both client and server)

#### File Storage
- **Location**: `/private/uploads/` (not publicly accessible)
- **Access**: Via signed URLs only (15-minute expiry)
- **Naming**: `{UUID}-{sanitized-filename}`
- **Security**: HMAC signature verification required

#### Error Messages (Exact Text)
- "Unsupported file type. Use PDF, JPG, or PNG."
- "File too large (max 5 MB)."
- "Medical certificate is required for sick leave over 3 days"
- "File content type not allowed (PDF, JPG, PNG only)." (server-side MIME validation)

### Reason Field Validation

#### Requirements
- **Required**: Yes
- **Minimum Length**: 10 characters (UI display), 3 characters (API minimum)
- **Display**: Shows character count: "{count} / 10 characters minimum"
- **Enforcement**: Frontend prevents submit if < 10 chars; API validates 3 char minimum

### Balance Validation

#### Available Balance Formula
```
available = (opening ?? 0) + (accrued ?? 0) - (used ?? 0)
```

#### Validation Order
1. EL advance notice (≥5 working days)
2. CL consecutive limit (3 days max)
3. ML medical certificate requirement (>3 days)
4. Backdate settings check
5. Backdate window limit (30 days for EL/ML)
6. CL holiday/weekend side-touch check
7. CL annual cap (10 days/year)
8. ML annual cap (14 days/year)
9. EL carry-forward cap (60 days)
10. Balance availability check

#### Error Codes
- `insufficient_balance`: Requested days exceed available balance
- `cl_annual_cap_exceeded`: CL annual usage exceeds 10 days
- `ml_annual_cap_exceeded`: ML annual usage exceeds 14 days
- `el_carry_cap_exceeded`: EL carry-forward would exceed 60 days

### Status Lifecycle

#### Standard Flow
```
DRAFT → SUBMITTED → PENDING → { APPROVED | REJECTED }
                              ↓
                         CANCELLED (can happen from SUBMITTED/PENDING)
```

#### Policy v2.0 Additional Statuses
- **RETURNED**: Returned for modification by approver
- **CANCELLATION_REQUESTED**: Employee requested cancellation of APPROVED leave
- **RECALLED**: Recalled by HR (balance restored)
- **OVERSTAY_PENDING**: Employee past endDate without return confirmation

### Cancellation Rules

#### Employee Cancellation
- **Valid Status**: `SUBMITTED` or `PENDING`
- **Invalid Status**: `APPROVED`, `REJECTED`, `CANCELLED`, `DRAFT`
- **Action**: Status → `CANCELLED`
- **After Approval**: Requires `CANCELLATION_REQUESTED` → HR reviews

#### Balance Restoration
- **Rule**: If approved leave is cancelled, balance is restored
- **Implementation**: `Balance.used` decremented by `workingDays`
- **Audit**: Creates audit log entry

### Date Format Standards

#### Display Format
- **Standard**: `DD/MM/YYYY` (day/month/year)
- **Example**: `23/10/2024`
- **Locale**: British English (`en-GB`)

#### API Format
- **Input**: ISO date string (`"2024-10-23T00:00:00.000Z"` or `"2024-10-23"`)
- **Output**: ISO date string (from database)
- **Normalization**: All dates normalized to Asia/Dhaka midnight before persistence

---

## 🔄 Demo Flow Storyboard

### Scene 1: Launch
- App opens to **RootView**
- NavigationSplitView shows sidebar (iPad) or TabView (iPhone)
- Default tab: **LeaveFormView**

### Scene 2: Create Leave Request
1. User selects leave type (CASUAL, MEDICAL, EARNED)
2. Picks date range using DatePicker
   - **Validation**: Start/end cannot be Friday, Saturday, or holidays
   - **CL Special**: Start/end cannot touch Fri/Sat/holidays (hard block)
   - **Min Date**: Today for CL; 30 days back for EL/ML
3. Enters reason in TextEditor (min 10 chars, shows character count)
4. **Real-time Policy Validation**:
   - EL: Checks ≥5 working days notice (excludes Fri/Sat/holidays)
   - CL: Checks 3-day consecutive limit, warns if <5 working days notice
   - CL: Blocks if start/end touches Fri/Sat/holiday
   - ML: No notice requirement, certificate required if >3 days
5. If MEDICAL > 3 days, file picker appears (required)
6. Real-time validation feedback with policy-specific error messages
7. Save draft button (optional) → Core Data

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
    "policyVersion": "v2.0"
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
- [CDBL Web App: Prisma Schema](../../prisma/schema.prisma)
- [Policy Logic Documentation](../../docs/Policy%20Logic/) - **Ultimate Source of Truth**
  - [01-Leave Types and Entitlements](../../docs/Policy%20Logic/01-Leave%20Types%20and%20Entitlements.md)
  - [02-Leave Application Rules and Validation](../../docs/Policy%20Logic/02-Leave%20Application%20Rules%20and%20Validation.md)
  - [03-Holiday and Weekend Handling](../../docs/Policy%20Logic/03-Holiday%20and%20Weekend%20Handling.md)
  - [04-Leave Balance and Accrual Logic](../../docs/Policy%20Logic/04-Leave%20Balance%20and%20Accrual%20Logic.md)
  - [05-File Upload and Medical Certificate Rules](../../docs/Policy%20Logic/05-File%20Upload%20and%20Medical%20Certificate%20Rules.md)

