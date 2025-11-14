# Refactoring Quick Reference

**Generated:** 2025-11-06  
**Purpose:** Quick overview of remaining refactoring opportunities

---

## 📊 Current State

- **Total Components in `components/dashboard/`:** 64 files
- **Shared Components Created:** 9 files in `components/shared/`
- **Refactoring Progress:** Phase 1 Complete ✅

---

## 🎯 High Priority Refactoring (Quick Wins)

### 1. Modal Consolidation (4 files → 0)
**Files to replace:**
- `components/dashboard/ReviewLeaveModal.tsx` → Use `components/shared/UnifiedModal.tsx`
- `components/dashboard/CancelRequestModal.tsx` → Use `components/shared/UnifiedModal.tsx`
- `components/dashboard/LeaveDetailsModal.tsx` → Use `components/shared/UnifiedModal.tsx`
- `components/dashboard/LeaveComparisonModal.tsx` → Use `components/shared/UnifiedModal.tsx`

**Impact:** Remove 4 duplicate modal implementations

---

### 2. Status Badge Consolidation (2 files → 0)
**Files to remove:**
- `components/dashboard/StatusBadgeSimple.tsx` → Use `components/shared/StatusBadge.tsx`
- `app/dashboard/components/status-badge.tsx` → Import from `components/shared/StatusBadge.tsx`

**Impact:** Single source of truth for status badges

---

### 3. Unused Components (Cleanup)
**Files to verify/remove:**
- `components/dashboard/DeptHeadDashboardContent.tsx` - Check if used
- `components/dashboard/DeptHeadSummaryCards.tsx` - Already replaced by KPIGrid
- `components/dashboard/HRDashboard.tsx` - Check if duplicate of HRAdminDashboard

**Impact:** Remove dead code

---

## 🔄 Medium Priority Refactoring

### 4. Timeline Components (5 files → 1 shared)
**Files to consolidate:**
- `ActiveRequestsTimeline.tsx`
- `LeaveTimeline.tsx`
- `LiveActivityTimeline.tsx`
- `SortedTimeline.tsx`
- `ApprovalTimeline.tsx`

**Action:** Create `components/shared/Timeline.tsx`

---

### 5. Balance/Card Components (5 files → 1-2 shared)
**Files to consolidate:**
- `LeaveBalanceCards.tsx`
- `LeaveBalancesCompact.tsx`
- `BalanceMetersGroup.tsx`
- `LeaveSummaryCard.tsx`
- `LeaveSummaryCardNew.tsx`

**Action:** Use `KPICard` from `components/shared/` or create unified `LeaveBalanceCard`

---

### 6. Quick Actions (6 files → 1 shared)
**Files to consolidate:**
- `QuickActions.tsx`
- `QuickActionsCard.tsx`
- `HRQuickActions.tsx`
- `DeptHeadQuickActions.tsx`
- `ActionItems.tsx`
- `ActionCenterCard.tsx`

**Action:** Create `components/shared/QuickActions.tsx` with role-based actions

---

### 7. Chart Components (4 files → 2 shared)
**Files to consolidate:**
- `LeaveTrendChart.tsx` + `LeaveTrendChartData.tsx` → Combine
- `LeaveTypePieChart.tsx` + `LeaveTypePieChartData.tsx` → Combine

**Action:** Create shared chart wrapper components

---

## 📁 File Structure Summary

### Current Organization
```
components/
  ├── shared/          ← NEW: 9 shared components
  │   ├── KPICard.tsx
  │   ├── StatusBadge.tsx
  │   ├── UnifiedModal.tsx
  │   ├── ExportSection.tsx
  │   └── ...
  ├── dashboard/       ← 64 files (needs consolidation)
  │   ├── EmployeeDashboard.tsx ✅ (refactored)
  │   ├── HRAdminDashboard.tsx ✅ (refactored)
  │   ├── DeptHeadDashboardWrapper.tsx ✅ (refactored)
  │   └── [60+ other components]
  ├── ui/              ← shadcn components (keep as-is)
  └── reports/         ← Reports-specific components
```

### Target Organization
```
components/
  ├── shared/          ← All reusable business components
  │   ├── KPICard.tsx ✅
  │   ├── StatusBadge.tsx ✅
  │   ├── UnifiedModal.tsx ✅
  │   ├── Timeline.tsx ← TODO
  │   ├── QuickActions.tsx ← TODO
  │   ├── LeaveBalanceCard.tsx ← TODO
  │   └── ...
  ├── dashboard/       ← Role-specific dashboard components only
  │   ├── EmployeeDashboard.tsx ✅
  │   ├── HRAdminDashboard.tsx ✅
  │   └── [minimal role-specific components]
  └── ui/              ← Base UI components
```

---

## 📈 Estimated Reduction

**Current:** 64 files in `components/dashboard/`  
**After Phase 2:** ~40-45 files (20-25 file reduction)  
**Target:** ~30-35 files (role-specific only)

---

## ⚡ Quick Action Items

1. **Replace modals** (1-2 hours)
   ```bash
   # Find all modal usages
   grep -r "ReviewLeaveModal\|CancelRequestModal\|LeaveDetailsModal" components/
   ```

2. **Remove duplicate status badges** (30 mins)
   ```bash
   # Find all status badge imports
   grep -r "StatusBadgeSimple\|status-badge" components/ app/
   ```

3. **Check unused components** (30 mins)
   ```bash
   # Find imports of potentially unused components
   grep -r "DeptHeadDashboardContent\|DeptHeadSummaryCards\|HRDashboard" .
   ```

---

## 📝 Notes

- Phase 1 refactor is **production-ready** ✅
- Remaining refactoring is **optimization**, not critical
- Can be done incrementally
- Each change can be tested independently

---

*See `REFACTORING_ANALYSIS.md` for detailed analysis and `CODEBASE_STRUCTURE.md` for full structure.*

