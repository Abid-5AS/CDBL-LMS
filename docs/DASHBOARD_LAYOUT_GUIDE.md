# Dashboard Layout Guide

## Overview

This guide documents the standardized dashboard layout patterns, components, and best practices used across all role-based dashboards in the CDBL Leave Management System. All dashboards follow a consistent structure using the same core components and layout patterns.

## Table of Contents

1. [Core Components](#core-components)
2. [Standard Grid Patterns](#standard-grid-patterns)
3. [Dashboard Section Structure](#dashboard-section-structure)
4. [Role-Based Theming](#role-based-theming)
5. [Responsive Design](#responsive-design)
6. [Loading States](#loading-states)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

## Core Components

### RoleBasedDashboard

The primary wrapper component that provides:
- Role-specific color theming
- Consistent layout constraints (max-width)
- Animations and transitions
- Header with title and description

**Location:** `components/dashboards/shared/RoleBasedDashboard.tsx`

**Props:**
```typescript
interface RoleBasedDashboardProps {
  children: ReactNode;
  role: Role; // EMPLOYEE, MANAGER, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
  className?: string;
  fullWidth?: boolean; // Disables max-width constraint for data-heavy dashboards
  title?: string; // Main dashboard title
  description?: string; // Subtitle/description
  actions?: ReactNode; // Action buttons in header
  animate?: boolean; // Enable Framer Motion animations
  backgroundVariant?: "gradient" | "solid" | "transparent";
}
```

### DashboardSection

Component for organizing dashboard content into logical sections with:
- Section title and description
- Loading state support with optional fallback
- Error handling with AlertCircle icon
- Divider between sections
- Action buttons (refresh, export, etc.)

**Location:** `components/dashboards/shared/ResponsiveDashboardGrid.tsx`

**Props:**
```typescript
interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode; // Action button(s) in section header
  children: ReactNode;
  className?: string;
  animate?: boolean; // Section-level animations
  isLoading?: boolean; // Show loading fallback
  error?: Error | null; // Display error state
  loadingFallback?: ReactNode; // Custom loading UI
  showDivider?: boolean; // Show divider after section
}
```

### ResponsiveDashboardGrid

Flexible grid system adapting to 4 responsive breakpoints:
- Mobile (< 640px)
- Tablet (640px - 1024px)
- Desktop (1024px - 1536px)
- Wide (≥ 1536px)

**Location:** `components/dashboards/shared/ResponsiveDashboardGrid.tsx`

**Props:**
```typescript
interface ResponsiveDashboardGridProps {
  columns: string; // Format: "mobile:tablet:desktop:wide" (e.g., "1:2:3:4")
  gap?: "sm" | "md" | "lg"; // Spacing between items
  children: ReactNode;
  className?: string;
  animate?: boolean;
}
```

## Standard Grid Patterns

All dashboards use consistent grid column configurations based on content type:

### Pattern 1: KPI Cards Grid (4 Cards)
**Use Case:** Primary metrics, quick stats
**Grid Columns:** `2:2:4:4`

```
Mobile:  [Card] [Card]
         [Card] [Card]

Tablet:  [Card] [Card]
         [Card] [Card]

Desktop: [Card] [Card] [Card] [Card]

Wide:    [Card] [Card] [Card] [Card]
```

### Pattern 2: Secondary Metrics Grid (3 Cards)
**Use Case:** Secondary metrics, monthly stats
**Grid Columns:** `1:1:3:3`

```
Mobile:  [Card]

Tablet:  [Card]

Desktop: [Card] [Card] [Card]

Wide:    [Card] [Card] [Card]
```

### Pattern 3: Mixed Content Grid (2:1 Split)
**Use Case:** Main content + sidebar
**Layout:** CSS Grid with `lg:grid-cols-12` and responsive spans

```
Mobile:  [Card] [Card]
         [Card] [Card]

Desktop: [Main Content - 8 cols] [Sidebar - 4 cols]
         [Analytics]            [Metrics]
```

### Pattern 4: Full-Width Grid (3 Cards)
**Use Case:** Quick access, team actions
**Grid Columns:** `1:2:3`

```
Mobile:  [Card]

Tablet:  [Card] [Card]

Desktop: [Card] [Card] [Card]
```

## Dashboard Section Structure

All dashboards follow a consistent structure:

```typescript
export function DashboardComponent({ username }: Props) {
  return (
    <RoleBasedDashboard
      role="EMPLOYEE"
      title={`Welcome back, ${username}`}
      description="Your dashboard description"
      animate
    >
      <div className="space-y-6">
        {/* Section 1: Primary Metrics */}
        <DashboardSection
          title="Key Metrics"
          description="Overview of important metrics"
          isLoading={isLoading}
          loadingFallback={<KPIGridSkeleton />}
        >
          <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
            {/* Cards here */}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Section 2: Main Content */}
        <DashboardSection
          title="Main Content"
          description="Detailed information"
          isLoading={isLoading}
        >
          {/* Content here */}
        </DashboardSection>

        {/* Section 3: Sidebar + Analytics */}
        <DashboardSection
          title="Analytics & Details"
          description="Charts and detailed data"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {/* Main content */}
            </div>
            <div className="lg:col-span-4">
              {/* Sidebar */}
            </div>
          </div>
        </DashboardSection>
      </div>
    </RoleBasedDashboard>
  );
}
```

## Role-Based Theming

Each role has specific styling configured in `RoleBasedDashboard`:

| Role | Accent Color | Accent Soft | Gradient | Max-Width |
|------|------|------|------|------|
| EMPLOYEE | Indigo (#6366f1) | Light Indigo | Indigo → Purple | max-w-7xl |
| MANAGER | Emerald (#059669) | Light Green | Emerald → Teal | max-w-7xl |
| DEPT_HEAD | Red (#dc2626) | Light Red | Red → Pink | max-w-[1600px] |
| HR_ADMIN | Violet (#7c3aed) | Light Gray | Violet → Indigo | max-w-[1600px] |
| HR_HEAD | Orange (#ea580c) | Light Orange | Orange → Yellow | max-w-[1600px] |
| CEO | Gray (#1f2937) | Light Gray | Slate → Zinc | max-w-[1800px] |
| SYSTEM_ADMIN | Cyan (#0891b2) | Light Cyan | Cyan → Indigo | max-w-[1600px] |

### CSS Variables

The color system uses semantic CSS variables for consistency:

```css
/* Role-specific accents */
--role-employee-accent: #6366f1;
--role-employee-accent-soft: #eef2ff;

--role-dept-head-accent: #dc2626;
--role-dept-head-accent-soft: #fef2f2;

/* Data semantic colors */
--data-success: #10b981;
--data-warning: #f59e0b;
--data-error: #ef4444;
--data-info: #3b82f6;

/* Component-specific */
--card-summary: #8b5cf6;
--card-accent: #ec4899;
```

## Responsive Design

### Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** 1024px - 1536px (lg)
- **Wide:** ≥ 1536px (xl, 2xl)

### Spacing Standards
- **Section spacing:** `space-y-6` (1.5rem)
- **Grid item spacing:** `gap="md"` → Tailwind `gap-6`
- **Card padding:** `p-6` (1.5rem)
- **Container padding:** `px-4 sm:px-6 lg:px-8`

### Responsive Grid Example
```typescript
<ResponsiveDashboardGrid columns="1:2:3:4" gap="md">
  {/* Auto-adapts: 1 col mobile → 2 tablet → 3 desktop → 4 wide */}
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</ResponsiveDashboardGrid>
```

## Loading States

### KPI Card Skeleton
```typescript
function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
```

### Loading Fallback Grid
```typescript
function KPIGridSkeleton() {
  return (
    <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </ResponsiveDashboardGrid>
  );
}

// Usage
<DashboardSection
  title="Metrics"
  isLoading={isLoading}
  loadingFallback={<KPIGridSkeleton />}
>
  {/* Content only renders when not loading */}
</DashboardSection>
```

### Error Handling
```typescript
// DashboardSection automatically displays error state
<DashboardSection
  title="Data"
  error={error} // Shows AlertCircle + message if present
>
  {/* Content */}
</DashboardSection>

// Error display format:
// [AlertCircle Icon]
// "Failed to load dashboard statistics"
// "Please try refreshing the page"
```

## Code Examples

### Complete Dashboard Example (Employee)

```typescript
"use client";

import { RoleBasedDashboard } from "@/components/dashboards/shared";
import { DashboardSection, ResponsiveDashboardGrid } from "@/components/dashboards/shared";
import { RoleKPICard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

interface DashboardProps {
  username: string;
}

export function EmployeeDashboard({ username }: DashboardProps) {
  const { data: stats, isLoading } = useSWR("/api/stats", fetcher);

  return (
    <RoleBasedDashboard
      role="EMPLOYEE"
      title={`Welcome back, ${username}`}
      description="Manage your time off and track your balance"
      animate
    >
      <div className="space-y-6">
        {/* KPI Cards Section */}
        <DashboardSection
          title="Your Leave Balance"
          description="Current and upcoming leave status"
          isLoading={isLoading}
          loadingFallback={<KPIGridSkeleton />}
        >
          <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
            <RoleKPICard
              title="Casual Leave"
              value={stats?.casualDays || 0}
              subtitle="Days remaining"
              icon={Calendar}
              role="EMPLOYEE"
            />
            <RoleKPICard
              title="Sick Leave"
              value={stats?.sickDays || 0}
              subtitle="Days remaining"
              icon={HeartHandshake}
              role="EMPLOYEE"
            />
            <RoleKPICard
              title="Pending Requests"
              value={stats?.pendingCount || 0}
              subtitle="Awaiting approval"
              icon={Clock}
              role="EMPLOYEE"
            />
            <RoleKPICard
              title="Approved This Year"
              value={stats?.approvedCount || 0}
              subtitle="Total approved"
              icon={CheckCircle}
              role="EMPLOYEE"
            />
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Recent Activity Section */}
        <DashboardSection
          title="Recent Activity"
          description="Your recent leave requests"
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Activity list */}
            </CardContent>
          </Card>
        </DashboardSection>

        {/* Analytics Section */}
        <DashboardSection
          title="Analytics"
          description="Leave trends and patterns"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Chart */}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Leave Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Chart */}
              </CardContent>
            </Card>
          </div>
        </DashboardSection>
      </div>
    </RoleBasedDashboard>
  );
}

// Skeleton component for loading state
function KPIGridSkeleton() {
  return (
    <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </ResponsiveDashboardGrid>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted/50 animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
```

### Data-Heavy Dashboard Example (Dept Head)

```typescript
"use client";

import { RoleBasedDashboard } from "@/components/dashboards/shared";
import { DashboardSection } from "@/components/dashboards/shared";

export function DeptHeadDashboard() {
  const { data, isLoading } = useSWR("/api/manager/pending", fetcher);

  return (
    <RoleBasedDashboard
      role="DEPT_HEAD"
      title="Department Dashboard"
      description="Manage leave requests for your department"
      fullWidth // Enable full-width for data tables
      animate
    >
      <div className="space-y-6">
        {/* KPI Summary */}
        <DashboardSection
          title="Leave Requests Overview"
          description="Key metrics for your department"
          isLoading={isLoading}
          loadingFallback={<KPIGridSkeleton />}
        >
          <ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
            {/* KPI Cards */}
          </ResponsiveDashboardGrid>
        </DashboardSection>

        {/* Main Table */}
        <DashboardSection
          title="Pending Leave Requests"
          description="Review and process requests"
          isLoading={isLoading}
          error={error}
        >
          <div id="pending-requests-table">
            <PendingRequestsTable data={data} />
          </div>
        </DashboardSection>

        {/* Two-Column Layout */}
        <DashboardSection
          title="Team & Actions"
          description="Team overview and quick actions"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
              </CardHeader>
              <CardContent>{/* Team data */}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>{/* Actions */}</CardContent>
            </Card>
          </div>
        </DashboardSection>
      </div>
    </RoleBasedDashboard>
  );
}
```

## Best Practices

### 1. Always Use RoleBasedDashboard Wrapper
```typescript
// ✅ Good
<RoleBasedDashboard role="EMPLOYEE">
  {/* Content */}
</RoleBasedDashboard>

// ❌ Avoid
<div className="bg-white">
  {/* Content without role styling */}
</div>
```

### 2. Wrap Sections with DashboardSection
```typescript
// ✅ Good
<DashboardSection title="Metrics" description="Key stats">
  <ResponsiveDashboardGrid columns="2:2:4:4">
    {/* Cards */}
  </ResponsiveDashboardGrid>
</DashboardSection>

// ❌ Avoid
<div>
  <ResponsiveDashboardGrid columns="2:2:4:4">
    {/* Cards without section header */}
  </ResponsiveDashboardGrid>
</div>
```

### 3. Use Consistent Spacing
```typescript
// ✅ Good - space-y-6 between sections
<div className="space-y-6">
  <DashboardSection>{/* Section 1 */}</DashboardSection>
  <DashboardSection>{/* Section 2 */}</DashboardSection>
  <DashboardSection>{/* Section 3 */}</DashboardSection>
</div>

// ❌ Avoid - inconsistent spacing
<div>
  <DashboardSection className="mb-4">{/* Section 1 */}</DashboardSection>
  <DashboardSection className="mb-8">{/* Section 2 */}</DashboardSection>
  <DashboardSection className="mt-2">{/* Section 3 */}</DashboardSection>
</div>
```

### 4. Provide Loading Fallbacks
```typescript
// ✅ Good
<DashboardSection
  title="Data"
  isLoading={isLoading}
  loadingFallback={<KPIGridSkeleton />}
>
  <ResponsiveDashboardGrid columns="2:2:4:4">
    {/* Content only renders when not loading */}
  </ResponsiveDashboardGrid>
</DashboardSection>

// ❌ Avoid - No loading fallback
<DashboardSection title="Data">
  {isLoading ? <Spinner /> : <Content />}
</DashboardSection>
```

### 5. Handle Errors Gracefully
```typescript
// ✅ Good - DashboardSection handles display
<DashboardSection
  title="Metrics"
  error={error}
  isLoading={isLoading}
>
  {/* Content */}
</DashboardSection>

// ❌ Avoid - Manual error handling
<div>
  {error && <Alert>{error.message}</Alert>}
  {isLoading && <Spinner />}
  {data && <Content />}
</div>
```

### 6. Use Standard Grid Patterns
```typescript
// ✅ Good - Standard 2:2:4:4 for KPI cards
<ResponsiveDashboardGrid columns="2:2:4:4">
  {/* 4 KPI cards */}
</ResponsiveDashboardGrid>

// ✅ Good - Standard 1:1:3:3 for secondary metrics
<ResponsiveDashboardGrid columns="1:1:3:3">
  {/* 3 metric cards */}
</ResponsiveDashboardGrid>

// ❌ Avoid - Custom columns without consistency
<ResponsiveDashboardGrid columns="1:1:2:3">
  {/* Non-standard pattern */}
</ResponsiveDashboardGrid>
```

### 7. Enable Animations for RoleBasedDashboard
```typescript
// ✅ Good - Animations improve UX
<RoleBasedDashboard
  role="EMPLOYEE"
  title="Dashboard"
  animate // Enable Framer Motion animations
>
  {/* Content */}
</RoleBasedDashboard>

// ✅ Also good - No animations for admin/heavy data tables
<RoleBasedDashboard
  role="DEPT_HEAD"
  title="Dashboard"
  // animate not needed for data-heavy dashboards
>
  {/* Content */}
</RoleBasedDashboard>
```

### 8. Maintain Suspense Boundaries
```typescript
// ✅ Good - Wrap async components in Suspense
<DashboardSection title="Recent Logs">
  <Suspense fallback={<DashboardCardSkeleton />}>
    <RecentAuditLogs /> {/* Server component */}
  </Suspense>
</DashboardSection>

// ✅ Alternative - Use loading prop for client data
<DashboardSection
  title="Data"
  isLoading={isLoading}
  loadingFallback={<Skeleton />}
>
  {/* Client component with SWR */}
</DashboardSection>
```

### 9. Data-Heavy Dashboards Use fullWidth
```typescript
// ✅ Good - Full width for tables
<RoleBasedDashboard
  role="DEPT_HEAD"
  title="Manager Dashboard"
  fullWidth // Remove max-width constraint
>
  {/* Table content */}
</RoleBasedDashboard>

// ❌ Avoid - Tables constrained to max-w-7xl
<RoleBasedDashboard role="DEPT_HEAD">
  {/* Table squeezed */}
</RoleBasedDashboard>
```

### 10. Use Semantic Color Variables
```typescript
// ✅ Good - Semantic colors
<div className="text-data-success">Approved</div>
<div className="text-data-error">Rejected</div>
<div className="text-data-warning">Pending</div>

// ✅ Good - Role-specific accents
<Button className="bg-role-employee-accent">
  Take Action
</Button>

// ❌ Avoid - Hardcoded colors
<div className="text-green-500">Approved</div>
<Button className="bg-blue-600">Take Action</Button>
```

## Implementation Checklist

When creating or updating a dashboard, ensure:

- [ ] Wrapped with `RoleBasedDashboard` with correct role
- [ ] RoleBasedDashboard has title, description, and animate props
- [ ] All major sections use `DashboardSection` component
- [ ] Standard grid pattern used (`2:2:4:4`, `1:1:3:3`, etc.)
- [ ] Loading fallback provided for async data
- [ ] Error handling included via DashboardSection error prop
- [ ] Responsive grid columns follow standard patterns
- [ ] Section spacing uses `space-y-6`
- [ ] Card styling consistent (rounded-2xl, p-6)
- [ ] Suspense boundaries for server components
- [ ] Semantic color variables used (data-success, data-error, etc.)
- [ ] Mobile layout tested and working
- [ ] Animations enabled (animate={true})
- [ ] fullWidth used for data-heavy layouts
- [ ] All role-specific colors applied correctly

## Summary of Changes (Task 2.2)

This standardization effort completed the following:

1. **Enhanced DashboardSection Component** (Phase 2.2a)
   - Added loading state support with optional fallback
   - Error handling with AlertCircle icon
   - Section headers and descriptions
   - Action button support in headers

2. **Standardized All Dashboards** (Phases 2.2b-e)
   - Employee Dashboard: 3 sections with loading states
   - Dept Head Dashboard: 3 sections for pending, team, actions
   - HR Admin Dashboard: 3 sections for metrics, processing, approvals
   - CEO Dashboard: 3 sections for executive metrics and analytics
   - HR Head Dashboard: 4 sections for operations and approvals
   - System Admin Dashboard: 4 sections with RoleBasedDashboard integration

3. **Applied Consistent Patterns**
   - Grid columns: 2:2:4:4 for KPIs, 1:1:3:3 for secondary metrics
   - Spacing: space-y-6 between sections, gap="md" in grids
   - Loading: Skeleton components and DashboardSection fallbacks
   - Error handling: Automatic via DashboardSection
   - Animations: Enabled on RoleBasedDashboard wrappers

4. **Created Documentation**
   - This comprehensive layout guide
   - Code examples for each pattern
   - Best practices and implementation checklist
   - Responsive design guidelines
   - Role-specific theming reference

## Related Files

- `components/dashboards/shared/RoleBasedDashboard.tsx` - Role wrapper component
- `components/dashboards/shared/ResponsiveDashboardGrid.tsx` - Grid and section components
- `components/dashboards/shared/KPICard.tsx` - KPI card component
- Dashboard implementations:
  - `components/dashboards/employee/ModernOverview.tsx`
  - `components/dashboards/dept-head/Overview.tsx`
  - `components/dashboards/hr-admin/HRAdminDashboardClient.tsx`
  - `components/dashboards/ceo/CEODashboardClient.tsx`
  - `components/dashboards/hr-head/HRHeadDashboardClient.tsx`
  - `components/dashboards/admin/Overview.tsx`
