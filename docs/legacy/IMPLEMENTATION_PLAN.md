# 7-Day Implementation Plan — CDBL iOS App

**Start Date**: TBD  
**Target Completion**: TBD  
**Team Size**: 1–2 developers

---

## 🎯 Goals

1. **Fix critical blockers** (iOS version, policy validation)
2. **Implement API layer** (balances, leaves, pairing)
3. **Add test coverage** (30% minimum)
4. **Prepare for beta testing** (QA-ready state)

---

## 📅 Phase 1: Foundation (Day 1–2)

**Goal**: Fix blocking issues, establish infrastructure

### Day 1 Morning

- [ ] **Fix iOS deployment target** (1h)
  - Change from 26.0 → 17.0 minimum
  - Test on iOS 17 simulator
  - Verify Liquid Glass features still work

- [ ] **Policy validation fixes** (2h)
  - Fix EL advance notice: 15 days → 5 working days
  - Add CL side-touch validation
  - Update policy version: v1.1 → v2.0

- [ ] **Add missing LeaveStatus enum values** (1h)
  - Add RETURNED, CANCELLATION_REQUESTED, RECALLED, OVERSTAY_PENDING
  - Update display names

### Day 1 Afternoon

- [ ] **Project structure reorganization** (2h)
  - Create missing directories (Networking/, PolicyRules/, ViewModels/)
  - Move files to new locations
  - Fix imports

- [ ] **API client scaffolding** (2h)
  - Create APIClient.swift
  - Define APIEndpoints enum
  - Add request/response models

### Day 2 Morning

- [ ] **Environment configuration** (1h)
  - Create AppConfig.swift
  - Add Environment enum (dev/staging/prod)
  - Wire base URL to configuration

- [ ] **Error mapping** (2h)
  - Create ErrorMapper.swift
  - Map all error codes from lib/errors.ts
  - Add user-friendly messages

### Day 2 Afternoon

- [ ] **Holiday integration** (3h)
  - Add Holiday.swift model
  - Create /api/holidays endpoint call
  - Cache holidays in CoreData
  - Update WorkingDayCalculator

---

## 📅 Phase 2: Core Features (Day 3–4)

**Goal**: Implement API integration for core leave management

### Day 3 Morning

- [ ] **Balance API** (3h)
  - Implement /api/balance/mine GET
  - Add caching with TTL
  - Update BalanceService to use real API
  - Fallback to mock if offline

### Day 3 Afternoon

- [ ] **Leave History API** (3h)
  - Implement /api/leaves GET
  - Add pagination support
  - Cache recent leaves
  - Update HistoryView

### Day 4 Morning

- [ ] **Create Leave API** (3h)
  - Implement /api/leaves POST
  - Add file upload support
  - Handle validation errors
  - Update ApplyLeaveView

### Day 4 Afternoon

- [ ] **Cancel Leave API** (1h)
  - Implement /api/leaves/{id}/cancel PATCH
  - Add confirmation flow
  - Update leave status

- [ ] **Retry & offline queue** (2h)
  - Add exponential backoff
  - Create OfflineQueue service
  - Queue failed requests

---

## 📅 Phase 3: Pairing & Sync (Day 5)

**Goal**: Enable device pairing and data sync

### Day 5 Morning

- [ ] **QR pairing** (4h)
  - Implement /api/mobile/pair POST
  - Create PairingService
  - Add QRCodePairing view
  - Store session in Keychain

### Day 5 Afternoon

- [ ] **Sync service** (3h)
  - Create SyncService
  - Add ConflictResolver
  - Implement sync flow
  - Test with mock API

---

## 📅 Phase 4: Testing & Polish (Day 6–7)

**Goal**: Add tests, fix bugs, prepare for QA

### Day 6 Morning

- [ ] **Unit tests** (4h)
  - WorkingDayCalculator (80% coverage)
  - LeaveRequest.validate() (80% coverage)
  - Date utilities (90% coverage)

### Day 6 Afternoon

- [ ] **Integration tests** (3h)
  - BalanceService tests
  - LeaveService tests
  - API mock tests

### Day 7 Morning

- [ ] **UI tests** (3h)
  - Apply Leave flow
  - History view
  - Dashboard

### Day 7 Afternoon

- [ ] **Bug fixes** (2h)
  - Fix discovered issues
  - Add logging
  - Performance tuning

- [ ] **Documentation** (1h)
  - Update README
  - Create beta testing guide
  - Document known issues

---

## 🎯 Gates & Success Criteria

### Gate 1: End of Day 2
- ✅ App compiles with iOS 17.0
- ✅ Policy validation aligned with v2.0
- ✅ API client structure in place

### Gate 2: End of Day 4
- ✅ Real balance data displayed
- ✅ Leave submission works end-to-end
- ✅ Error handling tested

### Gate 3: End of Day 5
- ✅ Device pairing functional
- ✅ Sync completes without crashes
- ✅ Offline queue works

### Gate 4: End of Day 7
- ✅ 30%+ test coverage
- ✅ All blockers resolved
- ✅ QA-ready build

---

## 🚨 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| iOS 26 dependencies break | High | Medium | Test early, remove if needed |
| API endpoints not ready | High | High | Use mocks, document blockers |
| Test coverage goal not met | Medium | High | Prioritize policy tests |
| Pairing security issues | High | Low | Security review before release |
| Time overrun | Medium | High | Scope reduction plan ready |

---

## 📊 Effort Estimate

| Task | Days | Hours |
|------|------|-------|
| Foundation | 2 | 16h |
| Core Features | 2 | 16h |
| Pairing & Sync | 1 | 8h |
| Testing | 1.5 | 12h |
| Bug fixes | 0.5 | 4h |
| **Total** | **7** | **56h** |

**Note**: Assumes 1–2 developers, no major blockers

---

## 🔄 Post-Plan (Week 2+)

If plan completes on time:

- [ ] Accessibility audit (VoiceOver, Dynamic Type)
- [ ] Performance profiling
- [ ] Security audit
- [ ] Beta testing deployment
- [ ] App Store submission prep (if applicable)

---

**Document Status**: ✅ Complete (Planning Phase)  
**Last Reviewed**: 2025-01-30

