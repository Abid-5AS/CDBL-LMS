# Dashboard Shared Components

Material 3 inspired shared components for role-based dashboards.

## Components

### `KPICard`
Enhanced KPI card with icons, accent bars, and animations.

```tsx
import { KPICard } from "@/app/dashboard/shared/KPICard";
import { Calendar } from "lucide-react";

<KPICard
  title="Earned Leave"
  value="24"
  subtext="Available days"
  icon={Calendar}
  iconColor="text-data-info"
  progress={{ used: 5, total: 24 }}
  status="healthy"
  accentColor="bg-data-info"
/>
```

### `QuickActions`
Horizontal pill-style action buttons with icons and animations.

```tsx
import { QuickActions } from "@/app/dashboard/shared/QuickActions";
import { Plus, Calendar, FileText } from "lucide-react";

<QuickActions
  actions={[
    {
      label: "Apply Leave",
      icon: Plus,
      onClick: () => router.push("/leaves/apply"),
      variant: "default",
      ariaLabel: "Apply for leave",
    },
    {
      label: "View Calendar",
      icon: Calendar,
      onClick: () => router.push("/holidays"),
      variant: "outline",
    },
  ]}
/>
```

### `Table`
Data table with tab-chip filtering, sticky header, and hover effects.

```tsx
import { Table } from "@/app/dashboard/shared/Table";

<Table
  data={leaves}
  columns={[
    {
      key: "name",
      header: "Employee",
      render: (row) => row.requester.name,
    },
    {
      key: "type",
      header: "Type",
      render: (row) => leaveTypeLabel[row.type],
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]}
  filters={[
    { value: "all", label: "All", count: 10 },
    { value: "pending", label: "Pending", count: 5 },
    { value: "approved", label: "Approved", count: 3 },
  ]}
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
  summary="Showing 10 of 25 requests"
  stickyHeader
  onRowClick={(row) => router.push(`/leaves/${row.id}`)}
/>
```

### `BarChartCard`, `LineChartCard`, `PieChartCard`
Chart components using Recharts with Material 3 styling.

```tsx
import { BarChartCard, LineChartCard, PieChartCard } from "@/app/dashboard/shared/Charts";

// Bar Chart
<BarChartCard
  title="Leave Usage"
  description="Monthly leave trends"
  data={[
    { name: "Jan", value: 12 },
    { name: "Feb", value: 19 },
    { name: "Mar", value: 15 },
  ]}
  dataKey="value"
  color="#3b82f6"
  height={300}
/>

// Line Chart
<LineChartCard
  title="Balance Trend"
  data={trendData}
  dataKey="balance"
  color="#10b981"
/>

// Pie Chart
<PieChartCard
  title="Leave Distribution"
  data={[
    { name: "Earned", value: 40, color: "#3b82f6" },
    { name: "Casual", value: 30, color: "#10b981" },
    { name: "Medical", value: 30, color: "#f59e0b" },
  ]}
/>
```

### `DashboardLayout`
Layout wrapper with consistent spacing and optional title/description.

```tsx
import { DashboardLayout } from "@/app/dashboard/shared/DashboardLayout";

<DashboardLayout
  title="Employee Dashboard"
  description="Overview of your leave balance and requests"
>
  {/* Dashboard content */}
</DashboardLayout>
```

### `DashboardGrid`
Responsive grid container (1 col mobile → 2 cols tablet → 3 cols desktop).

```tsx
import { DashboardGrid } from "@/app/dashboard/shared/DashboardLayout";

<DashboardGrid>
  <KPICard title="EL" value="24" />
  <KPICard title="CL" value="10" />
  <KPICard title="ML" value="14" />
</DashboardGrid>
```

### `DashboardSection`
Section wrapper with title, description, and optional action button.

```tsx
import { DashboardSection } from "@/app/dashboard/shared/DashboardLayout";
import { Button } from "@/components/ui/button";

<DashboardSection
  title="Recent Requests"
  description="Your latest leave applications"
  action={<Button variant="outline">View All</Button>}
>
  <Table data={recentLeaves} columns={columns} />
</DashboardSection>
```

## Design Tokens

All components use Material 3 design tokens from `lib/design-tokens.ts`:

- **Border radius**: `rounded-2xl` (16px)
- **Spacing**: `px-6 py-4` standard
- **Shadows**: `shadow-sm hover:shadow-md` with transitions
- **Colors**: Semantic CSS variables (`bg-surface`, `text-on-surface`, etc.)

## Animations

Components use Framer Motion for smooth animations:
- **Cards**: Fade in with slight upward motion
- **Hover**: Subtle lift effect (`y: -2`)
- **Buttons**: Scale feedback on press
- **Tables**: Staggered row animations

## Responsive Behavior

- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid, scrollable tables
- **Desktop**: 3-column grid, full-width tables with sticky headers






