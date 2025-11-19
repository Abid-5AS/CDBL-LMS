# LeaveCharts - Unified Chart Components

Consolidated chart components for the CDBL Leave Management System. All charts use consistent styling, accessibility, and data adapters.

## Components

### ChartContainer

Wrapper component that handles loading states, empty states, and consistent card styling.

```tsx
import { ChartContainer } from "@/components/shared/LeaveCharts";

<ChartContainer
  title="Monthly Leave Trend"
  subtitle="Approved leaves per month"
  loading={isLoading}
  empty={data.length === 0}
  height={300}
>
  <TrendChart data={trendData} />
</ChartContainer>
```

**Props:**
- `title: string` - Chart title
- `subtitle?: string` - Optional subtitle
- `actionsSlot?: ReactNode` - Optional action buttons
- `loading?: boolean` - Show loading skeleton
- `empty?: boolean` - Show empty state
- `emptyTitle?: string` - Custom empty state title
- `emptyDescription?: string` - Custom empty state description
- `height?: number` - Chart height in pixels (default: 300)
- `className?: string` - Additional CSS classes

### TrendChart

Monthly leave trend bar chart. Supports stacked and non-stacked modes.

```tsx
import { TrendChart } from "@/components/shared/LeaveCharts";

<TrendChart
  data={trendData}
  stacked={false}
  height={240}
  onBarClick={(month) => setFilter({ month })}
/>
```

**Props:**
- `data: TrendPoint[]` - Array of trend points
- `stacked?: boolean` - Enable stacked bars (default: false)
- `height?: number` - Chart height (default: 240)
- `onBarClick?: (month: string) => void` - Click handler for filtering
- `className?: string` - Additional CSS classes

**TrendPoint Type:**
```typescript
type TrendPoint = {
  month: string;      // "Jan", "Feb", etc.
  approved: number;   // Required
  pending?: number;   // Optional
  returned?: number;  // Optional
};
```

**Features:**
- All 12 months displayed (Jan→Dec), even with zero values
- Dark mode support with proper contrast
- Keyboard accessible
- Click handlers for filtering

### TypePie

Leave type distribution pie/donut chart.

```tsx
import { TypePie } from "@/components/shared/LeaveCharts";

<TypePie
  data={slices}
  donut={true}
  height={240}
  showLegend={true}
  onSliceClick={(type) => setFilter({ type })}
/>
```

**Props:**
- `data: Slice[]` - Array of leave type slices
- `donut?: boolean` - Use donut chart (default: true)
- `height?: number` - Chart height (default: 240)
- `showLegend?: boolean` - Show legend (default: true)
- `onSliceClick?: (type: Slice["type"]) => void` - Click handler for filtering
- `className?: string` - Additional CSS classes

**Slice Type:**
```typescript
type Slice = {
  type: "CASUAL" | "EARNED" | "MEDICAL";
  value: number;  // Counts (percentages computed internally)
};
```

**Features:**
- Percentages computed internally (never pass percentages)
- Color tokens from leave type palette
- Legend shows totals and percentages
- Keyboard accessible
- Click handlers for filtering

## Adapters

Convert various data formats to chart-ready data structures.

### fromReportsSummary

Converts reports API response to chart data.

```tsx
import { fromReportsSummary } from "@/components/shared/LeaveCharts/adapters";

const { trend, slices } = fromReportsSummary({
  monthlyTrend: [{ month: "Jan", leaves: 10 }, ...],
  typeDistribution: [{ name: "Earned Leave", value: 50 }, ...],
});
```

### fromDashboardAgg

Converts dashboard aggregation data to chart data.

```tsx
import { fromDashboardAgg } from "@/components/shared/LeaveCharts/adapters";

const { trend, slices } = fromDashboardAgg({
  monthlyTrend: [{ month: "Jan", approved: 10, pending: 2 }, ...],
  typeDistribution: [{ type: "EARNED", count: 50 }, ...],
});
```

### computeFromHistory

Fallback: computes chart data from leave history.

```tsx
import { computeFromHistory } from "@/components/shared/LeaveCharts/adapters";

const { trend, slices } = computeFromHistory(leaves, 2024);
```

## Usage Examples

### Reports Page

```tsx
import { ChartContainer, TrendChart, TypePie } from "@/components/shared/LeaveCharts";
import { fromReportsSummary } from "@/components/shared/LeaveCharts/adapters";

function ReportsCharts({ monthlyTrend, typeDistribution, isLoading }) {
  const { trend, slices } = fromReportsSummary({
    monthlyTrend,
    typeDistribution,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartContainer
        title="Monthly Leave Trend"
        loading={isLoading}
        empty={trend.length === 0}
      >
        <TrendChart data={trend} />
      </ChartContainer>

      <ChartContainer
        title="Leave Type Distribution"
        loading={isLoading}
        empty={slices.length === 0}
      >
        <TypePie data={slices} />
      </ChartContainer>
    </div>
  );
}
```

### With Filter Handlers

```tsx
function ChartsWithFilters({ data, onFilterChange }) {
  const { trend, slices } = fromReportsSummary(data);

  return (
    <>
      <TrendChart
        data={trend}
        onBarClick={(month) => onFilterChange({ month })}
      />
      <TypePie
        data={slices}
        onSliceClick={(type) => onFilterChange({ type })}
      />
    </>
  );
}
```

## Accessibility

- All charts have `aria-label` attributes
- Keyboard navigation supported (Tab, Enter)
- Focus indicators visible
- Color contrast meets WCAG AA (≥4.5:1)
- Screen reader friendly tooltips

## Performance

- Charts are client-only components
- Adapters are memoized when possible
- Lazy loading supported via dynamic imports
- Tree-shaking friendly (no duplicate chart libs)

## Color Tokens

Charts use consistent color tokens from the leave type palette:

- **EARNED**: `rgb(245, 158, 11)` (amber-500)
- **CASUAL**: `rgb(37, 99, 235)` (blue-600)
- **MEDICAL**: `rgb(34, 197, 94)` (green-500)

No hardcoded hex values - all colors come from design tokens.

## Migration Guide

### Replacing LeaveTrendChart

**Before:**
```tsx
import { LeaveTrendChart } from "@/components/dashboard/LeaveTrendChart";

<LeaveTrendChart data={[{ month: "Jan", leaves: 10 }]} />
```

**After:**
```tsx
import { TrendChart } from "@/components/shared/LeaveCharts";
import { fromReportsSummary } from "@/components/shared/LeaveCharts/adapters";

const { trend } = fromReportsSummary({ monthlyTrend: data });
<TrendChart data={trend} />
```

### Replacing LeaveTypePieChart

**Before:**
```tsx
import { LeaveTypePieChart } from "@/components/dashboard/LeaveTypePieChart";

<LeaveTypePieChart data={[{ name: "Earned Leave", value: 50 }]} />
```

**After:**
```tsx
import { TypePie } from "@/components/shared/LeaveCharts";
import { fromReportsSummary } from "@/components/shared/LeaveCharts/adapters";

const { slices } = fromReportsSummary({ typeDistribution: data });
<TypePie data={slices} />
```

> **Note:** The old `components/dashboard/` paths are deprecated and will be blocked by ESLint. Use `@shared/*` or `@dash/*` path aliases instead.

## Testing

See test files:
- `__tests__/LeaveCharts/TrendChart.test.tsx`
- `__tests__/LeaveCharts/TypePie.test.tsx`
- `__tests__/LeaveCharts/adapters.test.ts`

## Storybook

Stories available:
- `TrendChart.stories.tsx` - Default, stacked, empty, dark
- `TypePie.stories.tsx` - Default, donut, empty, dark

