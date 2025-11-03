# CDBL iOS App — Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial audit and documentation package
- `STATE_OF_APP.md` — Comprehensive current state analysis
- `ARCHITECTURE.md` — Clean architecture proposal and coding standards
- `PAIRING_AND_SYNC.md` — Pairing strategy (QR, air-gap, multi-frame)
- `SECURITY.md` — Security model and compliance guide
- `API_CONTRACTS.md` — Complete API endpoint documentation
- `TEST_STRATEGY.md` — Testing approach and coverage targets
- `IMPLEMENTATION_PLAN_AUTO.md` — Automated implementation plan with iOS 26 updates
- `mobile_audit.json` — Machine-readable audit summary
- `PolicyConstants.swift` — Policy v2.0 constants matching lib/policy.ts
- `Glass.swift` — iOS 26 liquid-glass unified components
- `LeaveValidators.swift` — Complete policy validation suite
- `QRFramer.swift` — Multi-frame QR encoding with 2KB frames, CRC32, SHA-256
- `QRAssembler.swift` — QR frame assembly with adaptive downshift to 1KB
- `SnapshotImporter.swift` — Snapshot import with signature verification
- `QueueStore.xcdatamodeld` — CoreData queue entities (QueuedAction, AttachmentRef, Receipt)
- `AttachmentManifest.swift` — Attachment validation and SHA-256 hashing
- `DeltaOutbox.swift` — Delta package builder with UUIDv7 idempotency
- `QueueManager.swift` — CoreData queue CRUD operations
- `ReceiptIngestor.swift` — Receipt reconciliation logic
- `PendingActionsBadge.swift` — Dashboard badge for queue count
- `ReconciliationModal.swift` — Queue management modal
- `PairSyncHub.swift` — Central sync hub screen
- `SettingsView.swift` — Settings with diagnostics
- `FileProtection.swift` — NSFileProtection helpers for CoreData and exports
- `IntegrityChecker.swift` — Jailbreak detection heuristics
- `LogBook.swift` — OSLog structured logging with redaction
- Scaffolded modules: `Networking/`, `PolicyRules/`, `Pairing/`, `Sync/`, `Storage/`, `Uploads/`, `Security/`, `Diagnostics/`

### Changed
- iOS deployment target set to iOS 26.0 as per existing project configuration
- Added `OFFLINE_BUILD` compile-time flag to project settings
- Fixed Policy v2.0 mismatches: EL notice 15d → 5wd, CL max consecutive 7d → 3d
- Updated `LeaveRequest` with Policy v2.0 statuses (RETURNED, CANCELLATION_REQUESTED, RECALLED, OVERSTAY_PENDING)
- Enhanced `WorkingDayCalculator` with holiday awareness and `nextWorkingDay` helper
- Updated `RootView` to include Pair/Sync and Settings tabs
- Updated `DashboardView` with PendingActionsBadge integration

### Fixed
- iOS deployment target maintained at 26.0 (confirmed by user)
- Policy constants now match web app exactly
- CL consecutive days limit corrected to 3 days (Policy v2.0)
- EL advance notice corrected to 5 working days (Policy v2.0)

### Deprecated
- None

### Removed
- None

### Security
- Initial security review documented
- Keychain usage already implemented
- Jailbreak detection, kill switch pending

---

## [1.0.0] — 2025-01-30 (Baseline)

### Added
- SwiftUI-based iOS companion app
- CoreData persistence layer
- Offline leave request creation
- JSON/QR export functionality
- Email integration for HR submission
- HMAC-SHA256 signing for package integrity
- iOS 26 Liquid Glass UI design system
- Dashboard, Apply Leave, History views
- Mock balance and leave data

### Known Issues
- iOS 26.0 deployment target (doesn't exist)
- No real API integration
- Policy validation mismatches (EL notice, CL side-touch)
- Missing holiday integration
- Zero test coverage
- No accessibility support

---

**Next Steps**: See `IMPLEMENTATION_PLAN.md` for 7-day roadmap.

