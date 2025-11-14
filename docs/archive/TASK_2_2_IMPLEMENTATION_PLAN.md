# PHASE 2, TASK 2.2: Standardize Dashboard Layouts - Implementation Plan

**Status:** 🔧 READY FOR IMPLEMENTATION
**Estimated Duration:** 9 hours
**Components Affected:** 6 dashboards + shared components

---

## 📋 Quick Reference: Changes Summary

| Component | Changes | Time | Priority |
|-----------|---------|------|----------|
| DashboardSection (enhanced) | Add Suspense, error boundaries, animations | 1.5h | CRITICAL |
| Employee Dashboard | Add section headers, wrapping | 1h | HIGH |
| Dept Head Dashboard | Standardize grid layout, section wrapping | 1.5h | HIGH |
| HR Admin Dashboard | Standardize sections, grid patterns | 1.5h | HIGH |
| CEO Dashboard | Reorganize grids, add section headers | 1.5h | HIGH |
| HR Head Dashboard | Add section organization | 1h | MEDIUM |
| System Admin Dashboard | Integrate with RoleBasedDashboard, animations | 1h | MEDIUM |
| Testing & Documentation | Responsive testing, layout guide | 1.5h | MEDIUM |

**Total: 9 hours**

---

## 🔧 Phase 2.2a: Enhanced DashboardSection Component (1.5 hours)

### Current Implementation Location
**File:** `/components/dashboards/shared/ResponsiveDashboardGrid.tsx` (lines 148-199)

### What Needs to Change
```tsx
// CURRENT
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  animate = true,
}: {...}) {
  // Basic section with header
}

// NEW - Add these features:
// 1. Suspense/Loading support with fallback
// 2. Error boundary integration
// 3. Divider option
// 4. Better animation variants
// 5. Conditional header rendering
```

### Step-by-Step Implementation

**Step 1:** Create new enhanced version in `/components/dashboards/shared/DashboardSection.tsx`

```tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  animate?: boolean;
  // New props
  isLoading?: boolean;
  error?: Error | null;
  loadingFallback?: ReactNode;
  showDivider?: boolean;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  animate = true,
  isLoading = false,
  error = null,
  loadingFallback,
  showDivider = true,
}: DashboardSectionProps) {
  // Implementation...
}
```

**Step 2:** Add to `/components/dashboards/shared/index.ts` exports

```tsx
export { DashboardSection } from "./DashboardSection";
```

**Step 3:** Test the new component with all features

---

## 🔧 Phase 2.2b: Standardize Employee Dashboard (1 hour)

### Current State
**File:** `/components/dashboards/employee/Overview.tsx`

**Issues:**
- No section headers
- No loading states
- Simple vertical layout
- No error handling

### Target State
```tsx
<RoleBasedDashboard
  role={role}
  title="Employee Dashboard"
  description="Manage your leave requests and view balances"
  animate
>
  <div className="space-y-6">
    <DashboardSection
      title="Greeting"
      isLoading={isLoading}
      animate
    >
      <DashboardGreeting />
    </DashboardSection>

    <DashboardSection
      title="Recent Actions"
      description="Returned requests and quick actions"
      isLoading={isLoadingLeaves}
      error={error}
      animate
    >
      <ActionCenterCard leaves={leaves} isLoading={isLoadingLeaves} />
    </DashboardSection>

    <DashboardSection
      title="Leave Overview"
      description="Your balance and recent activity"
      isLoading={isLoadingBalance || isLoadingLeaves}
      animate
    >
      <LeaveOverviewCard
        balanceData={balanceData}
        isLoadingBalance={isLoadingBalance}
        isLoadingLeaves={isLoadingLeaves}
      />
    </DashboardSection>

    <DashboardSection
      title="History & Analytics"
      description="Leave trends and activity timeline"
      isLoading={isLoadingLeaves}
      animate
    >
      <HistoryAnalyticsCard leaves={leaves} isLoadingLeaves={isLoadingLeaves} />
    </DashboardSection>
  </div>
</RoleBasedDashboard>
```

### Changes Required
1. Add section headers to each component
2. Wrap in RoleBasedDashboard
3. Add isLoading states where applicable
4. Keep space-y-6 layout

---

## 🔧 Phase 2.2c: Standardize Data-Heavy Dashboards (1.5 hours)

### Dept Head Dashboard
**File:** `/components/dashboards/dept-head/Overview.tsx`

**Changes:**
1. Keep `ResponsiveDashboardGrid columns="2:2:4:4"` for KPIs ✅ (already good)
2. Add DashboardSection wrapper for each section:
   - "Pending Approvals" section
   - "Team Overview" section
   - "Quick Actions" section
3. Add loading fallbacks
4. Add error boundaries

**Example:**
```tsx
<DashboardSection
  title="Pending Approvals"
  description="Leave requests awaiting your review"
  isLoading={isLoading}
  action={<RefreshButton />}
>
  <Suspense fallback={<DashboardCardSkeleton />}>
    <DeptHeadPendingTable data={data?.items} />
  </Suspense>
</DashboardSection>
```

### HR Admin Dashboard
**File:** `/components/dashboards/hr-admin/HRAdminDashboardClient.tsx`

**Changes:**
1. Standardize KPI grid: `columns="1:2:4:4"` (same as Dept Head)
2. Wrap all major sections with DashboardSection
3. Add consistent error handling
4. Reorganize sections logically

**Sections to organize:**
1. Header (keep as-is)
2. KPI Cards (ResponsiveDashboardGrid)
3. Pending Approvals (DashboardSection)
4. Cancellation Requests (DashboardSection)
5. Analytics/Charts (DashboardSection)

---

## 🔧 Phase 2.2d: Standardize Executive Dashboards (1.5 hours)

### CEO Dashboard
**File:** `/components/dashboards/ceo/CEODashboardClient.tsx`

**Current Issues:**
- Multiple different grid configs: `1:2:4:4`, `1:1:2:3`, etc.
- No visual section separation
- Sections not clearly labeled

**Standardization:**
1. Organize into logical section groups:
   - Organization Metrics (KPIs)
   - Performance Metrics (KPIs)
   - Financial Metrics (KPIs)
   - Trends & Analytics (Charts)
   - Departmental Analysis (Grid)
   - AI Insights (Cards)

2. Standard grid configs:
   - All KPI rows: `columns="1:2:4:4"` (4 cards typical)
   - Chart rows: `columns="1:1:2:2"` (2 large charts)
   - Insight rows: `columns="1:1:2:3"` (flexible)

3. Wrap each section with DashboardSection

### HR Head Dashboard
**File:** `/components/dashboards/hr-head/HRHeadDashboardClient.tsx`

**Changes:**
1. Similar to CEO but focused on HR operations
2. Standardize grid layouts
3. Add section headers
4. Improve layout organization

---

## 🔧 Phase 2.2e: Standardize System Admin Dashboard (1 hour)

### File: `/components/dashboards/admin/Overview.tsx`

**Current State:**
- ✅ Uses DashboardSection
- ⚠️ Not using RoleBasedDashboard
- ⚠️ Missing animations
- ⚠️ Different pattern than others

**Changes:**
1. Wrap with RoleBasedDashboard for consistency
2. Add animations to DashboardSection calls
3. Keep DashboardSection pattern (it's good)
4. Add role="SYSTEM_ADMIN" styling
5. Improve responsive grid for system overview cards

**Example:**
```tsx
<RoleBasedDashboard
  role="SYSTEM_ADMIN"
  title="System Administration"
  description="System health, user management, and audit logs"
  animate
>
  <div className="space-y-6">
    <DashboardSection
      title="System Overview"
      description="Key system metrics and status"
      animate
    >
      <Suspense fallback={<DashboardCardSkeleton />}>
        <SystemOverviewCards />
      </Suspense>
    </DashboardSection>
    {/* ... more sections ... */}
  </div>
</RoleBasedDashboard>
```

---

## 🔧 Phase 2.2f: Create Layout Documentation (1 hour)

### Create File: `/docs/DASHBOARD_LAYOUT_GUIDE.md`

**Contents:**
1. **Standard Grid Patterns**
   ```
   KPI Row (metrics):        1:2:3:4
   Chart Row (analytics):    1:1:2:2
   Action Row (buttons):     1:2:2:3
   Info Row (cards):         1:1:2:3
   ```

2. **Spacing System**
   ```
   Section spacing:  space-y-6 (1.5rem)
   Grid gap:         gap="md" (1rem mobile, 1.5rem tablet+)
   Card padding:     p-4 sm:p-6
   Section padding:  Standard container
   ```

3. **Component Usage**
   - RoleBasedDashboard wrapper
   - DashboardSection for each major section
   - ResponsiveDashboardGrid for cards
   - Standard error & loading patterns

4. **Responsive Breakpoints**
   - Mobile (base): 1 column
   - Tablet (md): 2 columns
   - Desktop (lg): 3-4 columns
   - Wide (xl): 4-6 columns

5. **Code Examples**
   - Simple dashboard layout
   - Complex dashboard with mixed grids
   - Error boundary pattern
   - Loading state pattern

---

## ✅ Implementation Checklist

### Phase 2.2a: DashboardSection
- [ ] Create new `/components/dashboards/shared/DashboardSection.tsx`
- [ ] Add Suspense support with fallback
- [ ] Add error boundary integration
- [ ] Add animation variants
- [ ] Update exports in index.ts
- [ ] Test with mock data
- [ ] Verify TypeScript types

### Phase 2.2b: Employee Dashboard
- [ ] Add section headers
- [ ] Wrap sections with DashboardSection
- [ ] Add RoleBasedDashboard wrapper
- [ ] Test responsive layout
- [ ] Verify loading states
- [ ] Check dark mode

### Phase 2.2c: Data-Heavy Dashboards
- [ ] Standardize Dept Head layout
- [ ] Standardize HR Admin layout
- [ ] Add section headers
- [ ] Add loading states
- [ ] Verify grid responsiveness
- [ ] Test on all breakpoints

### Phase 2.2d: Executive Dashboards
- [ ] Reorganize CEO dashboard
- [ ] Standardize CEO grid layouts
- [ ] Organize HR Head dashboard
- [ ] Add consistent section structure
- [ ] Test animations
- [ ] Verify mobile layout

### Phase 2.2e: System Admin Dashboard
- [ ] Integrate with RoleBasedDashboard
- [ ] Add animations
- [ ] Test responsive grid
- [ ] Verify error states
- [ ] Check loading states

### Phase 2.2f: Documentation
- [ ] Create layout guide
- [ ] Document grid patterns
- [ ] Add code examples
- [ ] Document spacing system
- [ ] Add accessibility notes
- [ ] Create component templates

### Final Verification
- [ ] All dashboards have consistent layout
- [ ] All responsive breakpoints work
- [ ] Loading states display correctly
- [ ] Error boundaries function
- [ ] Animations are smooth
- [ ] No console warnings
- [ ] TypeScript strict mode
- [ ] Build passes

---

## 📊 Success Metrics

### Layout Consistency
- ✅ All dashboards use DashboardSection wrapper
- ✅ All sections have headers
- ✅ Standard grid patterns applied
- ✅ Consistent spacing throughout

### Responsive Behavior
- ✅ 4 breakpoints tested (mobile, tablet, desktop, wide)
- ✅ No layout shifts
- ✅ Cards adapt to screen size
- ✅ Tables scroll properly on small screens

### Performance
- ✅ No console errors
- ✅ Animations smooth (60fps)
- ✅ No unnecessary re-renders
- ✅ Loading states prevent CLS

### Code Quality
- ✅ TypeScript strict mode passes
- ✅ DRY principle (no duplicated layout code)
- ✅ Consistent naming conventions
- ✅ Well-documented components

---

## 🎯 Key Decisions Made

1. **Keep ResponsiveDashboardGrid** - Already good, widely used
2. **Enhance DashboardSection** - Extend existing pattern, don't create new
3. **Use space-y-6** - Keep existing vertical spacing
4. **Standard grid patterns** - Define 4 common patterns
5. **Wrap all sections** - Consistent headers + loading
6. **Integrate with RoleBasedDashboard** - Unified wrapper
7. **Document thoroughly** - Future-proof with guide

---

## ⏱️ Time Allocation

| Task | Time | Notes |
|------|------|-------|
| DashboardSection enhancement | 1.5h | Most critical, enables others |
| Employee Dashboard | 1h | Simplest, good starting point |
| Dept Head Dashboard | 1.5h | Complex data layout |
| HR Admin Dashboard | 1.5h | Multiple sections to organize |
| CEO Dashboard | 1.5h | Most sections, complex grids |
| HR Head Dashboard | 1h | Simpler variant of CEO |
| System Admin Dashboard | 1h | Already has pattern, just integrate |
| Testing & Documentation | 1.5h | Final verification and guide |

**Total: 9 hours (within 16-hour Phase 2 budget)**

---

## 🚀 Next Steps After Task 2.2

Once dashboard layouts are standardized:

**Task 2.3:** Add Error Boundaries
- Wrap dashboard sections
- Add error handling UI
- Test error states

**Task 2.4:** Standardize Loading States
- Define standard skeleton components
- Consistent loading UI
- CLS prevention

**Task 2.5:** Audit Role-Specific Cards
- Review all role-specific styling
- Ensure color system applied
- Verify accessibility

---

**Status:** ✅ Implementation Plan Complete - Ready to Begin
