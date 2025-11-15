# Quick Start Guide - Dashboard Components

## 5-Minute Setup

### Step 1: Import Components

```tsx
import {
  MetricCard,
  ActionCenter,
  RecentActivityTable,
  LeaveBreakdownChart,
  TeamCapacityHeatmap,
  ApprovalList,
  DocumentUploader,
  LeaveTimeline,
} from '@/app/components/dashboard';
```

### Step 2: Use in Your Dashboard

```tsx
export default function MyDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Simple Metric Card */}
      <MetricCard
        title="Pending Requests"
        value={12}
        icon={Clock}
      />
    </div>
  );
}
```

That's it! The component is responsive, accessible, and dark-mode ready.

---

## Component Cheat Sheet

### MetricCard - Show a Number

```tsx
<MetricCard
  title="Days Used"
  value={12}
  unit="days"
  icon={Calendar}
  variant="success"
  onClick={() => navigate('/leaves')}
/>
```

**When to use:** Display any numeric metric

---

### ActionCenter - Show Tasks

```tsx
<ActionCenter
  actions={[
    {
      id: '1',
      title: 'Upload certificate',
      description: 'Required for leave #123',
      priority: 'high',
      actionType: 'certificate_missing',
      link: '/leaves/123'
    }
  ]}
/>
```

**When to use:** Show pending actions/tasks

---

### RecentActivityTable - Show List

```tsx
<RecentActivityTable
  rows={leaves}
  columns={[
    { key: 'name', label: 'Employee', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' }
  ]}
  onRowClick={(row) => viewDetails(row)}
/>
```

**When to use:** Display tabular data with sorting

---

### LeaveBreakdownChart - Show Chart

```tsx
<LeaveBreakdownChart
  data={[
    { type: 'Casual', used: 2, available: 3, total: 5 },
    { type: 'Earned', used: 18, available: 6, total: 24 }
  ]}
  chartType="bar"
/>
```

**When to use:** Visualize leave distribution

---

### TeamCapacityHeatmap - Show Team

```tsx
<TeamCapacityHeatmap
  teamData={[
    {
      employeeId: '1',
      employeeName: 'John Doe',
      leaveCount: 3,
      riskLevel: 'medium'
    }
  ]}
/>
```

**When to use:** Show team availability/capacity

---

### ApprovalList - Show Approvals

```tsx
<ApprovalList
  approvals={pendingApprovals}
  onApprove={(id) => handleApprove(id)}
  onReject={(id, reason) => handleReject(id, reason)}
  userRole="HR_ADMIN"
/>
```

**When to use:** Manage approval workflows

---

### DocumentUploader - Upload Files

```tsx
<DocumentUploader
  type="certificate"
  onUpload={async (file) => {
    await uploadFile(file);
  }}
  maxSize={5}
  allowedTypes={['pdf', 'jpg', 'png']}
/>
```

**When to use:** Upload documents/certificates

---

### LeaveTimeline - Show History

```tsx
<LeaveTimeline
  leaves={leaveHistory}
  showApprovalChain
  onLeaveClick={(leave) => viewLeave(leave)}
/>
```

**When to use:** Display chronological leave history

---

## Common Patterns

### Loading State

```tsx
{isLoading ? (
  <MetricCardSkeleton />
) : (
  <MetricCard title="Test" value={data.value} />
)}
```

### Grid Layout

```tsx
import { MetricCardGrid } from '@/app/components/dashboard';

<MetricCardGrid>
  <MetricCard title="A" value={1} />
  <MetricCard title="B" value={2} />
  <MetricCard title="C" value={3} />
  <MetricCard title="D" value={4} />
</MetricCardGrid>
```

### Empty State

All components handle empty data gracefully:

```tsx
<ActionCenter actions={[]} />
// Shows "All caught up!" message
```

---

## Full Dashboard Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  MetricCard,
  MetricCardGrid,
  ActionCenter,
  LeaveTimeline,
} from '@/app/components/dashboard';
import { Calendar, Clock } from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch your data
    fetch('/api/employee/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      {/* KPI Cards */}
      <MetricCardGrid>
        <MetricCard
          title="Days Used"
          value={data.daysUsed}
          unit="days"
          icon={Calendar}
        />
        <MetricCard
          title="Remaining"
          value={data.daysRemaining}
          unit="days"
          icon={Clock}
          variant="success"
        />
      </MetricCardGrid>

      {/* Pending Actions */}
      <ActionCenter
        actions={data.pendingActions}
        maxItems={5}
      />

      {/* Leave History */}
      <LeaveTimeline
        leaves={data.leaveHistory}
        interactive
        onLeaveClick={(leave) => router.push(`/leaves/${leave.id}`)}
      />
    </div>
  );
}
```

---

## Styling Tips

### Custom Colors

```tsx
<MetricCard
  title="Custom"
  value={42}
  className="bg-purple-50 dark:bg-purple-950 border-purple-200"
/>
```

### Custom Sizing

```tsx
<LeaveBreakdownChart
  data={chartData}
  height={400}  // Custom height
  className="max-w-4xl mx-auto"
/>
```

---

## TypeScript Tips

### Import Types

```tsx
import type {
  MetricCardProps,
  ActionItem,
  LeaveTimelineItem,
} from '@/app/components/dashboard';

const myMetric: MetricCardProps = {
  title: 'Test',
  value: 42
};
```

### Type-Safe Data Transformation

```tsx
const transformToTimeline = (apiData: any[]): LeaveTimelineItem[] => {
  return apiData.map(item => ({
    id: item.id,
    type: item.leaveType,
    status: item.status,
    startDate: new Date(item.fromDate),
    endDate: new Date(item.toDate),
    days: item.totalDays
  }));
};
```

---

## Troubleshooting

### Component not rendering?

Check import path:
```tsx
// ✅ Correct
import { MetricCard } from '@/app/components/dashboard';

// ❌ Wrong
import { MetricCard } from '@/components/dashboard';
```

### TypeScript errors?

Import types explicitly:
```tsx
import type { ActionItem } from '@/app/components/dashboard';
```

### Dark mode not working?

Ensure Tailwind dark mode is configured in `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class',
  // ...
}
```

---

## Next Steps

1. **Read Full Docs:** Check `/app/components/dashboard/README.md`
2. **See Examples:** Review `/DASHBOARD_REFACTOR_GUIDE.md`
3. **Start Building:** Use components in your dashboard
4. **Get Help:** Check examples or create an issue

---

## Keyboard Shortcuts (when interactive=true)

- **Enter/Space:** Activate clickable items
- **Tab:** Navigate between interactive elements
- **Escape:** Close expanded items (where applicable)

---

## Accessibility Features

All components include:
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA)

---

**Happy Coding!** 🚀
