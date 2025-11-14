# Visual Styling Requirements & Design System

**Last Updated:** 2025-11-13
**Version:** 1.0
**Status:** Active Standard

---

## Table of Contents
1. [Color System](#color-system)
2. [Component Standards](#component-standards)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Animation](#animation)
6. [Implementation Guidelines](#implementation-guidelines)

---

## Color System

### Semantic Color Variables

**RULE:** Always use CSS variables. Never hardcode color values.

```typescript
// ❌ WRONG - Hardcoded colors
color: "#3b82f6"
className="bg-indigo-500/10 text-indigo-600"
style={{ color: "var(--role-hr-admin-accent, #7c3aed)" }} // Fallback not needed

// ✅ CORRECT - CSS variables
color: "hsl(var(--data-info))"
className="bg-data-info/10 text-data-info"
style={{ color: "var(--role-hr-admin-accent)" }}
```

### Color Token Reference

#### Data Visualization
```css
--data-success   /* Success states, positive trends */
--data-info      /* Informational, primary actions */
--data-warning   /* Warnings, attention needed */
--data-error     /* Errors, critical states */
```

#### Status Colors
```css
--status-pending    /* Pending approvals/requests */
--status-approved   /* Approved items */
--status-rejected   /* Rejected items */
--status-cancelled  /* Cancelled items */
```

#### Role-Specific Colors
```css
--role-employee-accent      /* Indigo: #6366f1 */
--role-dept-head-accent     /* Red: #dc2626 */
--role-hr-admin-accent      /* Violet: #7c3aed */
--role-hr-head-accent       /* Orange: #ea580c */
--role-ceo-accent           /* Gray: #1f2937 */
```

#### Text Colors
```css
--foreground              /* Primary text (high emphasis) */
--muted-foreground        /* Secondary text (medium emphasis) */
--muted-foreground/70     /* Tertiary text (low emphasis) */
```

### Chart Colors
```typescript
const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",    // Blue
  secondary: "hsl(var(--chart-2))",  // Green
  tertiary: "hsl(var(--chart-3))",   // Yellow
  quaternary: "hsl(var(--chart-4))", // Purple
  quinary: "hsl(var(--chart-5))",    // Orange
} as const;
```

---

## Component Standards

### Tables

**STANDARD:** Use `ModernTable` exclusively for all tabular data.

```typescript
// ✅ CORRECT - Single table standard
import { ModernTable } from "@/components/ui/modern-table";

<ModernTable>
  <ModernTable.Header>
    <ModernTable.Row>
      <ModernTable.Head label="Name" sortable />
      <ModernTable.Head label="Email" />
    </ModernTable.Row>
  </ModernTable.Header>
  <ModernTable.Body>
    {data.map((item) => (
      <ModernTable.Row key={item.id}>
        <ModernTable.Cell>{item.name}</ModernTable.Cell>
        <ModernTable.Cell>{item.email}</ModernTable.Cell>
      </ModernTable.Row>
    ))}
  </ModernTable.Body>
</ModernTable>

// ❌ WRONG - Deprecated components
import { Table } from "@/components/ui/table";
import { EnhancedTable } from "@/components/ui/enhanced-table";
```

**Files to Delete After Migration:**
- `/components/ui/table.tsx`
- `/components/ui/enhanced-table.tsx`

### KPI Cards

**STANDARD:** Use unified `KPICard` with role support.

```typescript
// ✅ CORRECT - Unified KPI card
import { KPICard } from "@/components/dashboards/shared/KPICard";

<KPICard
  title="Pending Requests"
  value={42}
  subtitle="Awaiting review"
  icon={Clock}
  role="HR_ADMIN"  // Automatic theming
  trend={{
    value: 5,
    label: "from last week",
    direction: "up"
  }}
/>

// ❌ WRONG - Multiple card components
import { RoleKPICard } from "@/components/dashboards/shared/RoleBasedDashboard";
import { KPICard as DashboardKPICard } from "@/app/dashboard/components/kpi-card";
```

**Files to Delete After Migration:**
- `/app/dashboard/components/kpi-card.tsx`
- RoleKPICard from `/components/dashboards/shared/RoleBasedDashboard.tsx` (migrate to shared KPICard)

### Empty States

**STANDARD:** Use single `EmptyState` component from shared.

```typescript
// ✅ CORRECT
import { EmptyState } from "@/components/shared/EmptyState";

<EmptyState
  icon={CheckCircle}
  title="No pending requests"
  description="You're all caught up!"
  variant="card"  // or "default", "minimal"
  action={{
    label: "View History",
    href: "/history"
  }}
/>

// ❌ WRONG
import { EmptyState } from "@/components/ui/empty-state";
```

**Files to Delete:**
- `/components/ui/empty-state.tsx`

### Badges

**STANDARD:** Use role badge utility for consistent role colors.

```typescript
// ✅ CORRECT
import { getRoleBadgeClasses } from "@/lib/ui-utils";

<Badge variant="outline" className={getRoleBadgeClasses(employee.role)}>
  {roleLabel(employee.role)}
</Badge>

// ❌ WRONG - Hardcoded colors
<Badge className="bg-data-info/10 text-data-info">
  HR Head
</Badge>
```

### Cards

**STANDARD:** Use `Card` component with variants, avoid raw divs.

```typescript
// ✅ CORRECT
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card variant="glass" className="rounded-2xl">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ WRONG
<div className="glass-card rounded-xl border p-6">
  {/* mixing Card and raw divs */}
</div>
```

### Pagination

**STANDARD:** Use `CompletePagination` for all paginated lists/tables.

```typescript
// ✅ CORRECT
import { CompletePagination } from "@/components/shared/pagination/Pagination";

const PAGE_SIZE = 20;
const [currentPage, setCurrentPage] = useState(1);

<CompletePagination
  currentPage={currentPage}
  totalPages={Math.ceil(items.length / PAGE_SIZE)}
  pageSize={PAGE_SIZE}
  totalItems={items.length}
  onPageChange={setCurrentPage}
  showFirstLast={true}
/>

// ❌ WRONG - Custom pagination
<div className="flex gap-2">
  <Button onClick={() => setPage(page - 1)}>Previous</Button>
  <span>{page}</span>
  <Button onClick={() => setPage(page + 1)}>Next</Button>
</div>
```

**Pagination Required When:**
- Table/list has > 20 items
- Dataset can grow (e.g., users, requests, employees)
- Performance may be impacted

**Pagination Optional When:**
- Fixed small dataset (< 15 items)
- Dataset is guaranteed small (e.g., leave types, policies)

---

## Typography

### Heading Hierarchy

```typescript
// Page titles (top level)
<h1 className="text-2xl sm:text-3xl font-semibold">
  Page Title
</h1>

// Section titles
<h2 className="text-lg sm:text-xl font-semibold">
  Section Title
</h2>

// Subsection titles
<h3 className="text-base sm:text-lg font-semibold">
  Subsection
</h3>

// Card titles
<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
  KPI METRIC
</h4>
```

### Text Emphasis

```typescript
// Primary text (high emphasis)
<p className="text-foreground">
  Important content
</p>

// Secondary text (medium emphasis)
<p className="text-muted-foreground">
  Supporting information
</p>

// Tertiary text (low emphasis)
<p className="text-muted-foreground/70">
  Supplementary details
</p>
```

---

## Spacing & Layout

### Responsive Grids

**STANDARD:** Use `ResponsiveDashboardGrid` for KPI cards.

```typescript
// ✅ CORRECT
import { ResponsiveDashboardGrid } from "@/components/dashboards/shared";

// Primary KPIs (4 cards)
<ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
  <KPICard ... />
  <KPICard ... />
  <KPICard ... />
  <KPICard ... />
</ResponsiveDashboardGrid>

// Secondary metrics (3 cards)
<ResponsiveDashboardGrid columns="1:1:3:3" gap="md">
  <KPICard ... />
  <KPICard ... />
  <KPICard ... />
</ResponsiveDashboardGrid>

// ❌ WRONG - Raw Tailwind grids for KPIs
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Standard Layouts

```typescript
// Main content + Sidebar
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-8">
    {/* Main content */}
  </div>
  <div className="lg:col-span-4">
    {/* Sidebar */}
  </div>
</div>

// Two column split
<div className="grid gap-6 md:grid-cols-2">
  <div>{/* Left */}</div>
  <div>{/* Right */}</div>
</div>
```

### Spacing Scale

```css
gap="sm"   /* gap-3  (0.75rem) */
gap="md"   /* gap-6  (1.5rem) */
gap="lg"   /* gap-8  (2rem) */
```

---

## Animation

### Duration Constants

```typescript
// lib/animations.ts
export const ANIMATION_DURATIONS = {
  fast: 0.15,      // Micro-interactions (hover, focus)
  normal: 0.3,     // Standard transitions (cards, modals)
  slow: 0.5,       // Page transitions
} as const;

// Usage
import { ANIMATION_DURATIONS } from "@/lib/animations";

animate={{
  opacity: [0, 1],
  duration: ANIMATION_DURATIONS.normal
}}
```

### Standard Animations

```typescript
// Card entrance
animate={{
  opacity: [0, 1],
  y: [20, 0],
  transition: { duration: ANIMATION_DURATIONS.normal }
}}

// Hover scale
whileHover={{
  scale: 1.02,
  transition: { duration: ANIMATION_DURATIONS.fast }
}}

// Page transition
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 20 }}
transition={{ duration: ANIMATION_DURATIONS.slow }}
```

---

## Implementation Guidelines

### 1. Color Usage Checklist

- [ ] No hardcoded hex colors (#xxxxxx)
- [ ] No hardcoded Tailwind colors (bg-blue-500)
- [ ] All colors use CSS variables (var(--*))
- [ ] Chart colors use --chart-* variables
- [ ] Role-specific UI uses --role-*-accent variables

### 2. Component Checklist

- [ ] Tables use ModernTable (not Table or EnhancedTable)
- [ ] KPI cards use shared KPICard with role prop
- [ ] Empty states use shared/EmptyState (not ui/empty-state)
- [ ] Badges use getRoleBadgeClasses utility
- [ ] Cards use Card component (not raw divs with glass-card)

### 3. Pagination Checklist

- [ ] All lists with >20 items have pagination
- [ ] Uses CompletePagination component
- [ ] PAGE_SIZE constant = 20
- [ ] Pagination shows item count ("X to Y of Z")
- [ ] Pagination includes First/Last buttons
- [ ] Pagination resets on filter change

### 4. Layout Checklist

- [ ] KPI grids use ResponsiveDashboardGrid
- [ ] Columns follow standard patterns (2:2:4:4, 1:1:3:3)
- [ ] Gap spacing uses sm/md/lg (not custom values)
- [ ] Responsive breakpoints use standard grid patterns

### 5. Typography Checklist

- [ ] Headings follow hierarchy (h1 > h2 > h3 > h4)
- [ ] Text uses semantic classes (foreground, muted-foreground)
- [ ] Card titles use uppercase + tracking-wider
- [ ] Responsive sizing uses sm: prefix for mobile

### 6. Animation Checklist

- [ ] Durations use ANIMATION_DURATIONS constants
- [ ] No hardcoded duration values
- [ ] Standard easing curves (not custom)
- [ ] Hover states use fast duration (0.15s)

---

## Migration Priority

### Phase 1: Critical (Week 1-2)
1. **Table Consolidation** - Migrate all to ModernTable
2. **Add Missing Pagination** - user-management, policy-panel, holidays
3. **KPI Card Unification** - Merge into single component
4. **Remove Hardcoded Colors** - Replace with CSS variables

### Phase 2: Medium (Week 3)
5. **Badge Standardization** - Create getRoleBadgeClasses utility
6. **Delete Duplicates** - Remove ui/empty-state, old table components
7. **Pagination Consistency** - Use CompletePagination everywhere
8. **Card Styling** - Standardize on Card variants

### Phase 3: Polish (Week 4)
9. **Text Color Fix** - Use foreground/muted-foreground
10. **Heading Hierarchy** - Apply consistent sizes
11. **Shared Skeletons** - Create reusable loading states
12. **Animation Constants** - Use shared durations

---

## Quick Reference

### When to Use What

| Scenario | Component | Example |
|----------|-----------|---------|
| Display tabular data | `ModernTable` | User list, approval queue |
| Show key metric | `KPICard` | Pending count, revenue |
| Empty data state | `EmptyState` | No requests, no results |
| User role display | `Badge` + `getRoleBadgeClasses` | Employee role pills |
| Content container | `Card` | Dashboard panels |
| List with >20 items | `CompletePagination` | Employee list |
| KPI grid | `ResponsiveDashboardGrid` | Dashboard metrics |

### Common Patterns

```typescript
// Dashboard with KPIs
<ResponsiveDashboardGrid columns="2:2:4:4" gap="md">
  <KPICard role="HR_ADMIN" title="..." value={...} />
</ResponsiveDashboardGrid>

// Table with pagination
<ModernTable>...</ModernTable>
<CompletePagination ... />

// Empty state with action
<EmptyState
  icon={Icon}
  title="..."
  description="..."
  action={{ label: "...", href: "..." }}
/>

// Role badge
<Badge className={getRoleBadgeClasses(role)}>
  {roleLabel(role)}
</Badge>
```

---

**Document Owner:** Engineering Team
**Review Cadence:** Quarterly
**Last Audit:** 2025-11-13
