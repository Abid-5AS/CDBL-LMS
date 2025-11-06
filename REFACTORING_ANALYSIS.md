# CDBL Leave Management - Refactoring Analysis

**Generated:** 2025-11-06  
**Based on:** CODEBASE_STRUCTURE.md

---

## 📊 Current State Summary

- **Total Files:** 1,126
- **Total Directories:** 323
- **TypeScript/TSX Files:** 373 (227 .tsx + 146 .ts)
- **Components in `components/dashboard/`:** 64 files

---

## ✅ Completed Refactoring (Phase 1)

### Foundation Infrastructure

- ✅ Unified API Client (`lib/apiClient.ts`)
- ✅ Unified Export System (`lib/exportUtils.ts`, `components/shared/ExportSection.tsx`)
- ✅ Unified Modal System (`components/shared/UnifiedModal.tsx`, `ConfirmModal.tsx`, `ReviewModal.tsx`)
- ✅ Shared Component Library (`components/shared/`)
- ✅ Enhanced DashboardLayout with role prop

### Dashboard Refactors

- ✅ Employee Dashboard - Consolidated, uses shared components
- ✅ Dept Head Dashboard - Uses KPIGrid, apiClient
- ✅ HR Admin Dashboard - Enhanced layout
- ✅ HR Head Dashboard - Enhanced layout

---

## 🔍 Remaining Refactoring Opportunities

### 1. Components/Dashboard Consolidation (HIGH PRIORITY)

**Current State:** 64 files in `components/dashboard/` with potential duplicates

#### A. Modal Components (Can be unified)

- `ReviewLeaveModal.tsx` → Should use `components/shared/UnifiedModal.tsx`
- `CancelRequestModal.tsx` → Should use `components/shared/UnifiedModal.tsx`
- `LeaveDetailsModal.tsx` → Should use `components/shared/UnifiedModal.tsx`
- `LeaveComparisonModal.tsx` → Should use `components/shared/UnifiedModal.tsx`

**Action:** Replace all with UnifiedModal wrappers

#### B. Status Badge Components (Duplicate)

- `StatusBadgeSimple.tsx` → Should use `components/shared/StatusBadge.tsx`
- `app/dashboard/components/status-badge.tsx` → Should use `components/shared/StatusBadge.tsx`

**Action:** Remove duplicates, use shared StatusBadge everywhere

#### C. Chart Components (Potential consolidation)

- `LeaveTrendChart.tsx` + `LeaveTrendChartData.tsx` → Could be combined
- `LeaveTypePieChart.tsx` + `LeaveTypePieChartData.tsx` → Could be combined
- `DonutChart.tsx` → Generic chart component?

**Action:** Consider creating shared chart components in `components/shared/charts/`

#### D. Balance/Card Components (Many similar)

- `LeaveBalanceCards.tsx`
- `LeaveBalancesCompact.tsx`
- `BalanceMetersGroup.tsx`
- `LeaveSummaryCard.tsx`
- `LeaveSummaryCardNew.tsx`

**Action:** Consolidate into shared balance components using KPICard

#### E. Timeline Components (Overlapping)

- `ActiveRequestsTimeline.tsx`
- `LeaveTimeline.tsx`
- `LiveActivityTimeline.tsx`
- `SortedTimeline.tsx`
- `ApprovalTimeline.tsx`

**Action:** Create unified Timeline component in `components/shared/`

#### F. Quick Actions (Multiple implementations)

- `QuickActions.tsx`
- `QuickActionsCard.tsx`
- `HRQuickActions.tsx`
- `DeptHeadQuickActions.tsx`
- `ActionItems.tsx`
- `ActionCenterCard.tsx`

**Action:** Create unified QuickActions component with role-based actions

#### G. Dashboard-Specific Components (Still role-specific)

- `HRDashboard.tsx` - May be duplicate of `HRAdminDashboard.tsx`
- `SuperAdminDashboard.tsx` - Needs refactor
- `SystemAdminDashboard.tsx` - Needs refactor
- `DeptHeadDashboardContent.tsx` - Unused? (We use `DeptHeadDashboardWrapper.tsx`)

**Action:** Verify usage, remove unused, consolidate similar dashboards

---

### 2. API Routes Organization (MEDIUM PRIORITY)

**Current State:** API routes are well-organized but some consolidation possible

#### Potential Improvements:

- `/api/leaves/[id]/*` - Many action routes (approve, reject, forward, return, cancel, recall)
  - Could consolidate into `/api/leaves/[id]/actions` with action type in body
- `/api/approvals/*` - Some overlap with `/api/leaves/*` approval routes
- `/api/dashboard/*` - Multiple analytics endpoints could be unified

**Action:** Consider RESTful consolidation, but current structure is acceptable

---

### 3. Component Organization (MEDIUM PRIORITY)

#### A. Reports Components

- `components/reports/` - Has its own FilterBar, KpiCards, ChartsSection
  - Should use `components/shared/FilterBar.tsx` where possible
  - KpiCards could use shared KPICard

#### B. Employee Components

- `app/employees/components/` - Some components might be reusable
  - `EmployeeDashboard.tsx` (in app/employees) vs `components/dashboard/EmployeeDashboard.tsx`
  - Verify which is used

#### C. Legacy/Unified Components

- `components/legacy/` - Should be removed if truly legacy
- `components/unified/` - Check if these are still needed or can be merged

---

### 4. Utility Functions (LOW PRIORITY)

#### Potential Consolidation:

- `lib/date-utils.ts` - Good
- `lib/formatters.ts` - Should be created to consolidate formatting
- `lib/constants.ts` - Should be created for shared constants
- Multiple files with similar utility functions

**Action:** Create `lib/formatters.ts` and `lib/constants.ts` to centralize

---

### 5. Type Definitions (LOW PRIORITY)

#### Potential Improvements:

- Leave status types defined in multiple places
- Leave request types duplicated across components
- Should centralize in `types/` directory

**Action:** Create `types/leaves.ts`, `types/dashboard.ts` for shared types

---

## 📋 Recommended Next Steps (Priority Order)

### Phase 2: Component Consolidation

1. **Replace all modals with UnifiedModal** (1-2 hours)

   - Update `ReviewLeaveModal.tsx` to use UnifiedModal
   - Update `CancelRequestModal.tsx` to use UnifiedModal
   - Update `LeaveDetailsModal.tsx` to use UnifiedModal
   - Remove old modal implementations

2. **Consolidate Status Badge components** (30 mins)

   - Remove `StatusBadgeSimple.tsx`
   - Update `app/dashboard/components/status-badge.tsx` to import from shared
   - Update all imports across codebase

3. **Create unified Timeline component** (2-3 hours)

   - Analyze all timeline components
   - Create `components/shared/Timeline.tsx`
   - Replace all timeline implementations

4. **Consolidate Balance/Card components** (2-3 hours)

   - Use KPICard for all balance displays
   - Remove duplicate balance components
   - Create shared `LeaveBalanceCard.tsx` if needed

5. **Unify Quick Actions** (2-3 hours)
   - Create `components/shared/QuickActions.tsx` with role-based actions
   - Replace all quick action components
   - Use role context to show appropriate actions

### Phase 3: Cleanup & Optimization

6. **Remove unused components** (1 hour)

   - `DeptHeadDashboardContent.tsx` (if unused)
   - `DeptHeadSummaryCards.tsx` (replaced by KPIGrid)
   - Any other unused components

7. **Consolidate chart components** (2-3 hours)

   - Create shared chart wrapper components
   - Reduce duplication between chart and chart-data files

8. **Create shared formatters and constants** (1-2 hours)

   - `lib/formatters.ts` for date/number formatting
   - `lib/constants.ts` for shared constants

9. **Centralize type definitions** (1-2 hours)
   - `types/leaves.ts` for leave-related types
   - `types/dashboard.ts` for dashboard types
   - Update all imports

### Phase 4: Advanced Refactoring (Optional)

10. **API route consolidation** (3-4 hours)

    - Consider RESTful patterns
    - Consolidate similar endpoints

11. **Component folder reorganization** (2-3 hours)
    - Group by feature vs by type
    - Consider feature-based structure

---

## 📈 Estimated Impact

### Files to Refactor:

- **Modals:** 4 files → 0 (use shared)
- **Status Badges:** 2 files → 0 (use shared)
- **Timelines:** 5 files → 1 shared
- **Balance Cards:** 5 files → 1-2 shared
- **Quick Actions:** 6 files → 1 shared
- **Charts:** 4 files → 2 shared

**Total Reduction:** ~20-25 files could be consolidated

### Benefits:

- Reduced bundle size
- Easier maintenance
- Consistent UI/UX
- Faster development of new features

---

## 🎯 Quick Wins (Can be done immediately)

1. ✅ Remove `StatusBadgeSimple.tsx` - Use shared StatusBadge
2. ✅ Remove `DeptHeadSummaryCards.tsx` - Already replaced
3. ✅ Update `ReviewLeaveModal.tsx` - Use UnifiedModal
4. ✅ Remove unused `DeptHeadDashboardContent.tsx` if not used
5. ✅ Create `lib/formatters.ts` and `lib/constants.ts`

---

## 📝 Notes

- Current refactor (Phase 1) is **production-ready**
- Remaining refactoring is **optimization**, not critical
- Can be done incrementally without breaking changes
- Each phase can be tested independently

---

_This analysis is based on the current codebase structure. Run `pnpm tsx scripts/generate-structure-doc.ts` to regenerate the structure document._
