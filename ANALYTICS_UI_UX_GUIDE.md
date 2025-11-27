# Enhanced Analytics - UI/UX Design Guide
**Last Updated:** 2025-11-27
**System:** CDBL-LMS Analytics Module

## Design Philosophy

The Enhanced Reporting & Analytics system follows a **glassmorphic, Material 3-inspired design** that maintains consistency with the existing CDBL-LMS interface while introducing modern data visualization patterns.

### Core Principles

1. **Glass Aesthetics** - Translucent cards with backdrop blur
2. **Consistent Theming** - All colors use CSS variables for dark/light mode
3. **Progressive Disclosure** - Complex data revealed through interaction
4. **Accessibility First** - High contrast, keyboard navigation, screen reader support
5. **Performance-Aware** - Skeleton loading, optimistic updates, smooth animations

---

## Component Library

### 1. Shared Analytics Components

#### AnalyticsCard
**File:** `components/analytics/shared/AnalyticsCard.tsx`

**Purpose:** Standardized wrapper for all analytics displays

**Usage:**
```tsx
import { AnalyticsCard } from "@/components/analytics/shared/AnalyticsCard";

<AnalyticsCard
  title="Leave Trends"
  description="Monthly breakdown of leave requests"
  tooltip="Shows approved leaves by month for the current year"
  headerAction={<ExportButton />}
  variant="hover"
>
  <TrendChart data={data} />
</AnalyticsCard>
```

**Features:**
- Optional tooltip icon with helpful explanations
- Header action slot for buttons/filters
- Hover variant for interactive cards
- Consistent spacing and glass styling

#### EmptyState
**File:** `components/analytics/shared/EmptyState.tsx`

**Purpose:** User-friendly message when no data available

**Usage:**
```tsx
import { EmptyState } from "@/components/analytics/shared/EmptyState";

<EmptyState
  title="No Leave Data"
  description="No leave requests found for the selected period. Try adjusting your filters or date range."
  icon="search"
  action={{
    label: "Clear Filters",
    onClick: () => clearFilters()
  }}
/>
```

**Icons:**
- `alert` - For errors or warnings
- `database` - For system/data issues
- `search` - For no results found

#### AnalyticsSkeleton
**File:** `components/analytics/shared/AnalyticsSkeleton.tsx`

**Purpose:** Loading states that match final component shape

**Usage:**
```tsx
import { ChartSkeleton, MetricsSkeleton } from "@/components/analytics/shared/AnalyticsSkeleton";

{loading ? (
  <>
    <MetricsSkeleton count={4} />
    <ChartSkeleton height={300} />
  </>
) : (
  <ActualContent />
)}
```

**Variants:**
- `ChartSkeleton` - For charts (customizable height)
- `AnalyticsCardSkeleton` - For metric cards
- `TableSkeleton` - For data tables
- `MetricsSkeleton` - For KPI grids

---

## Color System

### Chart Colors

All charts use CSS variable-based colors for theme consistency:

```css
--chart-1: hsl(var(--chart-1)) /* Primary - Blue */
--chart-2: hsl(var(--chart-2)) /* Secondary - Green */
--chart-3: hsl(var(--chart-3)) /* Tertiary - Orange */
--chart-4: hsl(var(--chart-4)) /* Quaternary - Red */
--chart-5: hsl(var(--chart-5)) /* Quinary - Purple */
```

### Leave Type Colors

Consistent mapping across all visualizations:

| Leave Type | Variable | Color (Light) | Color (Dark) |
|------------|----------|---------------|--------------|
| EARNED | `--chart-2` | Green | Green |
| CASUAL | `--chart-1` | Blue | Blue |
| MEDICAL | `--chart-3` | Orange | Orange |
| SICK | `--chart-4` | Red | Red |
| Other | `--chart-5` | Purple | Purple |

### Intensity Colors (Heatmaps)

```typescript
const INTENSITY_COLORS = {
  0: "bg-muted/20",                          // No data
  1: "bg-emerald-100 dark:bg-emerald-900/30", // Low
  2: "bg-emerald-300 dark:bg-emerald-700/50", // Medium
  3: "bg-emerald-500 dark:bg-emerald-600",    // High
  4: "bg-emerald-700 dark:bg-emerald-500",    // Very High
};
```

### Status Colors

```typescript
const STATUS_COLORS = {
  approved: "text-emerald-600 dark:text-emerald-400",
  pending: "text-orange-600 dark:text-orange-400",
  rejected: "text-red-600 dark:text-red-400",
  draft: "text-muted-foreground",
};
```

---

## Typography

### Headings

- **Page Title:** `text-2xl font-bold tracking-tight`
- **Card Title:** `text-sm font-medium` (GlassCardTitle)
- **Section Header:** `text-lg font-semibold`
- **Metric Value:** `text-3xl font-bold` or `text-2xl font-semibold`

### Body Text

- **Description:** `text-sm text-muted-foreground`
- **Metric Label:** `text-xs text-muted-foreground uppercase tracking-wide`
- **Table Text:** `text-sm text-text-secondary`
- **Tooltip Text:** `text-xs`

---

## Spacing & Layout

### Grid Patterns

**Metrics Grid:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* 4 metric cards */}
</div>
```

**Dashboard Layout:**
```tsx
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div className="lg:col-span-1">{/* Sidebar */}</div>
</div>
```

**Chart Grid:**
```tsx
<div className="grid gap-6 md:grid-cols-2">
  {/* 2 charts side by side */}
</div>
```

### Spacing Scale

- **Card Padding:** `p-6`
- **Section Spacing:** `space-y-8` or `space-y-6`
- **Component Gap:** `gap-4` or `gap-6`
- **Icon Margin:** `mr-2` or `ml-2`

---

## Interactive Elements

### Tooltips

**Standard Tooltip (Glass Style):**
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Info className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>Helpful explanation here</p>
  </TooltipContent>
</Tooltip>
```

**Styling:**
- Background: `bg-card/80`
- Backdrop Blur: `backdrop-blur-xl`
- Border: `border border-border/50`
- Shadow: `shadow-lg`
- Rounded: `rounded-xl`
- Padding: `px-4 py-3`

### Hover States

**Cards:**
```tsx
className="transition-shadow hover:shadow-lg"
```

**Chart Elements:**
```tsx
className="transition-opacity hover:opacity-80 cursor-pointer"
```

**Buttons:**
- Use built-in button variants
- Add loading states with Loader2 icon

### Click Interactions

**Charts:**
```tsx
onClick={(e) => {
  const dataPoint = e.activePayload?.[0];
  if (dataPoint) {
    onDataClick(dataPoint);
  }}
}
```

**Calendar Days:**
```tsx
onClick={() => onDateClick?.(format(date, "yyyy-MM-dd"), dateData)}
```

---

## Animation

### Loading Animations

**Skeleton:**
```tsx
className="animate-pulse"
```

**Spinner:**
```tsx
<Loader2 className="h-8 w-8 animate-spin text-primary" />
```

### Entrance Animations

**Fade In:**
```tsx
className="animate-in fade-in-0 duration-200 ease-out"
```

**Slide In:**
```tsx
className="data-[side=bottom]:slide-in-from-top-1"
```

### Transition Timing

- **Fast:** 150ms (fade out, hover)
- **Standard:** 200ms (fade in, scale)
- **Slow:** 300ms (complex transitions)

---

## Responsive Breakpoints

### Mobile (<768px)

- Single column layout
- Stacked charts
- Simplified tables (horizontal scroll)
- Collapsed filters

### Tablet (768px-1024px)

- 2-column grid for metrics
- Side-by-side charts
- Expanded navigation

### Desktop (>1024px)

- 3-4 column grids
- Dashboard sidebar layouts
- Full chart interactions

---

## Accessibility

### Keyboard Navigation

- All interactive elements focusable
- Tab order follows visual flow
- Escape closes modals/tooltips
- Enter/Space activates buttons

### Screen Readers

**ARIA Labels:**
```tsx
aria-label="Leave type distribution chart showing 3 categories with total of 45 items"
```

**Live Regions:**
```tsx
<div role="status" aria-live="polite">
  {loading ? "Loading data..." : "Data loaded"}
</div>
```

### Color Contrast

- Text: 4.5:1 minimum (WCAG AA)
- Interactive elements: 3:1 minimum
- Chart colors: Distinct for colorblindness

---

## Chart Specifications

### HeatmapCalendar

**Dimensions:** 7x6 grid (42 cells for full month)
**Cell Size:** `aspect-square`
**Tooltip:** Bottom-aligned, glass styled
**Legend:** Bottom-right, 5-level intensity scale

### Pie/Donut Charts

**Size:** Configurable height (default 240px)
**Inner Radius:** 60 (donut) or 0 (pie)
**Outer Radius:** 90 (donut) or 110 (pie)
**Label Threshold:** Hide if <5%
**Label Format:** `percent.toFixed(1)%`

### Area/Line Charts

**Height:** 240-300px default
**Margins:** `{ top: 10, right: 10, left: 0, bottom: 5 }`
**Grid:** Horizontal lines only, `strokeDasharray="3 3"`
**Gradient Fill:** From 80% opacity to 5%

### Bar Charts

**Height:** 300px default
**Bar Spacing:** `paddingAngle={2}`
**Stacked:** Use `stackId="1"` for all series
**Hover Effect:** Opacity change to 80%

---

## Best Practices

### 1. Always Use Shared Components

❌ **Don't:**
```tsx
<div className="rounded-lg border bg-white p-6">
  <h3>My Chart</h3>
  <MyChart />
</div>
```

✅ **Do:**
```tsx
<AnalyticsCard title="My Chart">
  <MyChart />
</AnalyticsCard>
```

### 2. Implement Loading States

❌ **Don't:**
```tsx
{data && <MyChart data={data} />}
```

✅ **Do:**
```tsx
{loading ? (
  <ChartSkeleton height={300} />
) : data ? (
  <MyChart data={data} />
) : (
  <EmptyState title="No Data" description="..." />
)}
```

### 3. Use Theme Variables

❌ **Don't:**
```tsx
fill="#10b981"
```

✅ **Do:**
```tsx
fill="hsl(var(--chart-2))"
```

### 4. Add Tooltips to Metrics

❌ **Don't:**
```tsx
<AnalyticsCard title="Utilization Rate">
  <div>{rate}%</div>
</AnalyticsCard>
```

✅ **Do:**
```tsx
<AnalyticsCard
  title="Utilization Rate"
  tooltip="Percentage of total available leave days used by employees"
>
  <div>{rate}%</div>
</AnalyticsCard>
```

### 5. Handle Empty States

❌ **Don't:**
```tsx
{data.length === 0 && <p>No data</p>}
```

✅ **Do:**
```tsx
{data.length === 0 ? (
  <EmptyState
    title="No Leave Data"
    description="Adjust your filters to see results"
    icon="search"
    action={{ label: "Clear Filters", onClick: clearFilters }}
  />
) : (
  <DataDisplay data={data} />
)}
```

---

## Performance Guidelines

### 1. Memoize Heavy Computations

```tsx
const chartData = useMemo(() => {
  return processData(rawData);
}, [rawData]);
```

### 2. Use SWR for Data Fetching

```tsx
const { data, error, isLoading } = useSWR(
  `/api/analytics/employee/${id}/patterns`,
  fetcher,
  { refreshInterval: 60000 } // 1 minute
);
```

### 3. Virtualize Long Lists

```tsx
// For tables with >50 rows, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual';
```

### 4. Lazy Load Heavy Charts

```tsx
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

---

## Testing Checklist

### Visual Testing

- [ ] All charts render correctly in light mode
- [ ] All charts render correctly in dark mode
- [ ] Tooltips appear on hover
- [ ] Loading skeletons match final layout
- [ ] Empty states display properly
- [ ] Responsive breakpoints work

### Interaction Testing

- [ ] Charts are clickable where expected
- [ ] Filters update data correctly
- [ ] Date range selectors work
- [ ] Export buttons function
- [ ] Real-time updates reflect

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present

---

## Future Enhancements

### Planned Features

1. **Dark Mode Refinements**
   - Auto-adjust chart gradients based on theme
   - Higher contrast in dark mode for accessibility

2. **Chart Interactions**
   - Zoom in/out for time-series
   - Pan across large datasets
   - Select multiple data points

3. **Export Enhancements**
   - PNG/SVG download for charts
   - PDF reports with custom branding
   - Scheduled email delivery

4. **Customization**
   - User-configurable dashboard layouts
   - Saved chart configurations
   - Personal color preferences

---

## Support & Maintenance

### Component Updates

When updating analytics components:

1. Check all usages with global search
2. Test in both light and dark modes
3. Verify responsive behavior
4. Update this guide if patterns change
5. Add migration notes if breaking changes

### Adding New Charts

When adding a new chart type:

1. Use `AnalyticsCard` wrapper
2. Implement `ChartSkeleton` loading state
3. Add `EmptyState` for no data
4. Use theme variables for colors
5. Add tooltip with explanation
6. Document in this guide

---

**Last Updated:** 2025-11-27
**Maintained By:** CDBL-LMS Development Team
