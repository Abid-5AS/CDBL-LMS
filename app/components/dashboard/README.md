# Dashboard Components Library

A collection of 8 reusable, standardized components for building role-based dashboards in the CDBL Leave Management System.

## Table of Contents

1. [MetricCard](#1-metriccard)
2. [ActionCenter](#2-actioncenter)
3. [RecentActivityTable](#3-recentactivitytable)
4. [LeaveBreakdownChart](#4-leavebreakdownchart)
5. [TeamCapacityHeatmap](#5-teamcapacityheatmap)
6. [ApprovalList](#6-approvallist)
7. [DocumentUploader](#7-documentuploader)
8. [LeaveTimeline](#8-leavetimeline)

---

## 1. MetricCard

Display key statistics with optional trend indicators and icons.

### Features
- Large number display with subtitle
- Trend indicators (up/down/stable)
- Clickable navigation
- Loading states
- Color variants (default, warning, success, error)
- Responsive sizing
- Dark mode support

### Usage

```tsx
import { MetricCard } from '@/app/components/dashboard';

<MetricCard
  title="Pending Requests"
  value={12}
  unit="requests"
  icon={Clock}
  variant="warning"
  trend={{ direction: "up", change: 5 }}
  onClick={() => navigate('/requests')}
  isLoading={false}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Card title/label |
| `value` | `number \| string` | required | Main metric value |
| `unit` | `string` | optional | Unit (e.g., "days") |
| `trend` | `{ direction, change }` | optional | Trend indicator |
| `onClick` | `() => void` | optional | Click handler |
| `icon` | `LucideIcon` | optional | Icon component |
| `variant` | `'default' \| 'warning' \| 'success' \| 'error'` | `'default'` | Color variant |
| `isLoading` | `boolean` | `false` | Loading state |

### Use Cases
- Employee: "Days Used: 12/24"
- HR Admin: "Pending Approvals: 8"
- CEO: "Team Utilization: 92%"

---

## 2. ActionCenter

Widget showing pending tasks and actions needed from the user.

### Features
- List of actionable items
- Priority badges (High/Medium/Low)
- Action type badges
- Dismissible items
- Click to navigate
- Empty state
- Count badge

### Usage

```tsx
import { ActionCenter } from '@/app/components/dashboard';

<ActionCenter
  actions={[
    {
      id: '1',
      title: 'Missing medical certificate',
      description: 'Please upload certificate for leave #123',
      priority: 'high',
      actionType: 'certificate_missing',
      link: '/leaves/123',
      timestamp: new Date()
    }
  ]}
  onDismiss={(id) => handleDismiss(id)}
  maxItems={5}
  showViewAll
  viewAllLink="/actions"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `ActionItem[]` | required | Array of actions |
| `onDismiss` | `(id) => void` | optional | Dismiss callback |
| `maxItems` | `number` | `5` | Max items to show |
| `showViewAll` | `boolean` | `true` | Show "View All" link |
| `viewAllLink` | `string` | `'/actions'` | View all URL |
| `isLoading` | `boolean` | `false` | Loading state |

### Action Types
- `info_needed` - Information request
- `approval_required` - Approval pending
- `certificate_missing` - Document needed
- `other` - General action

---

## 3. RecentActivityTable

Standardized table for displaying recent activities with sorting and pagination.

### Features
- Sortable columns
- Pagination
- Row click handlers
- Status badges
- Custom column rendering
- Loading/Empty states
- Responsive design

### Usage

```tsx
import { RecentActivityTable } from '@/app/components/dashboard';

<RecentActivityTable
  title="Recent Leave Requests"
  description="Last 30 days"
  rows={leaves}
  columns={[
    { key: 'employeeName', label: 'Employee', sortable: true },
    {
      key: 'type',
      label: 'Type',
      render: (val) => <Badge>{val}</Badge>
    },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'days',
      label: 'Days',
      render: (val) => `${val} days`,
      className: 'text-right'
    }
  ]}
  onRowClick={(row) => navigate(`/leaves/${row.id}`)}
  pageSize={10}
  sortBy="createdAt"
  sortDirection="desc"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `ActivityRow[]` | required | Data rows |
| `columns` | `ColumnDefinition[]` | required | Column config |
| `onRowClick` | `(row) => void` | optional | Row click handler |
| `isLoading` | `boolean` | `false` | Loading state |
| `emptyMessage` | `string` | optional | Empty state text |
| `pageSize` | `number` | `10` | Items per page |
| `sortBy` | `string` | optional | Initial sort column |
| `sortDirection` | `'asc' \| 'desc'` | `'desc'` | Sort direction |

---

## 4. LeaveBreakdownChart

Visual representation of leave usage/distribution with multiple chart types.

### Features
- Multiple chart types (bar, pie, doughnut)
- Color-coded by leave type
- Interactive tooltips
- Legend display
- Summary statistics
- Responsive sizing
- Accessibility

### Usage

```tsx
import { LeaveBreakdownChart } from '@/app/components/dashboard';

<LeaveBreakdownChart
  data={[
    { type: 'Casual', used: 2, available: 3, total: 5 },
    { type: 'Earned', used: 18, available: 6, total: 24 },
    { type: 'Medical', used: 5, available: 9, pending: 2, total: 14 }
  ]}
  chartType="bar"
  title="Leave Distribution"
  showLegend
  interactive
  height={300}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `LeaveChartData[]` | required | Chart data |
| `chartType` | `'bar' \| 'pie' \| 'doughnut'` | `'bar'` | Chart type |
| `title` | `string` | optional | Chart title |
| `showLegend` | `boolean` | `true` | Display legend |
| `interactive` | `boolean` | `true` | Enable tooltips |
| `height` | `number` | `300` | Chart height (px) |

---

## 5. TeamCapacityHeatmap

Visual representation of team's leave coverage and availability.

### Features
- Color-coded risk levels
- Team member cards
- Leave count display
- Summary statistics
- Interactive cells
- Risk indicators
- Responsive grid

### Usage

```tsx
import { TeamCapacityHeatmap } from '@/app/components/dashboard';

<TeamCapacityHeatmap
  teamData={[
    {
      employeeId: '1',
      employeeName: 'John Doe',
      leaveCount: 3,
      riskLevel: 'medium',
      department: 'Engineering'
    }
  ]}
  onCellClick={(employee, date) => console.log(employee)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `teamData` | `TeamMemberData[]` | required | Team members |
| `dateRange` | `{ start, end }` | optional | Date range |
| `groupBy` | `'week' \| 'month' \| 'none'` | `'none'` | Grouping |
| `onCellClick` | `(employee, date?) => void` | optional | Click handler |

### Risk Levels
- **Low** (Green): 0-2 leaves
- **Medium** (Yellow): 3-5 leaves
- **High** (Red): 6+ leaves

---

## 6. ApprovalList

List of pending approvals with approval chain status and action buttons.

### Features
- Approval chain visualization
- Step-by-step progress
- Approve/Reject/Forward actions
- Expandable details
- Employee information
- Leave type badges
- Pagination

### Usage

```tsx
import { ApprovalList } from '@/app/components/dashboard';

<ApprovalList
  approvals={[
    {
      id: '1',
      employeeName: 'Jane Smith',
      leaveType: 'CASUAL',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-03'),
      days: 3,
      currentStep: 2,
      totalSteps: 3,
      chain: [
        { step: 1, role: 'Dept Head', status: 'approved' },
        { step: 2, role: 'HR Admin', status: 'current' },
        { step: 3, role: 'HR Head', status: 'pending' }
      ],
      reason: 'Family event'
    }
  ]}
  onApprove={(id) => handleApprove(id)}
  onReject={(id, reason) => handleReject(id, reason)}
  onForward={(id) => handleForward(id)}
  userRole="HR_ADMIN"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `approvals` | `ApprovalItem[]` | required | Approval items |
| `onApprove` | `(id) => void` | required | Approve callback |
| `onReject` | `(id, reason?) => void` | required | Reject callback |
| `onForward` | `(id) => void` | optional | Forward callback |
| `userRole` | `AppRole` | required | Current user role |
| `maxItems` | `number` | optional | Max items to show |

---

## 7. DocumentUploader

Unified file upload component with drag-and-drop support.

### Features
- Drag-and-drop interface
- File type validation
- File size validation
- Upload progress
- Success/Error states
- Preview for images
- Multiple file support
- Accessibility

### Usage

```tsx
import { DocumentUploader } from '@/app/components/dashboard';

<DocumentUploader
  type="certificate"
  label="Upload Medical Certificate"
  onUpload={async (file) => {
    // Upload logic
    await uploadToServer(file);
  }}
  maxSize={5}
  allowedTypes={['pdf', 'jpg', 'png']}
  required
  documentId={leaveId}
  multiple={false}
  onRemove={(file) => handleRemove(file)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'certificate' \| 'fitness' \| 'attachment' \| 'other'` | required | Document type |
| `onUpload` | `(file: File) => Promise<void>` | required | Upload handler |
| `maxSize` | `number` | `5` | Max size (MB) |
| `allowedTypes` | `string[]` | `['pdf','jpg','png']` | Allowed types |
| `required` | `boolean` | `false` | Is required |
| `label` | `string` | optional | Custom label |
| `documentId` | `number` | optional | Associated ID |
| `multiple` | `boolean` | `false` | Multiple files |
| `onRemove` | `(file) => void` | optional | Remove callback |

---

## 8. LeaveTimeline

Visual timeline showing leave history and status chronologically.

### Features
- Chronological timeline
- Color-coded by status
- Status indicators
- Approval chain display
- Date labels
- Expandable items
- Vertical/Horizontal layout
- Interactive mode

### Usage

```tsx
import { LeaveTimeline } from '@/app/components/dashboard';

<LeaveTimeline
  leaves={[
    {
      id: 1,
      type: 'CASUAL',
      status: 'APPROVED',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-17'),
      days: 3,
      reason: 'Personal work',
      approvalChain: [
        { step: 1, role: 'Dept Head', status: 'approved' },
        { step: 2, role: 'HR Admin', status: 'approved' }
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12')
    }
  ]}
  orientation="vertical"
  interactive
  showApprovalChain
  onLeaveClick={(leave) => navigate(`/leaves/${leave.id}`)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `leaves` | `LeaveTimelineItem[]` | required | Leave records |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout |
| `interactive` | `boolean` | `true` | Enable clicks |
| `onLeaveClick` | `(leave) => void` | optional | Click handler |
| `showApprovalChain` | `boolean` | `false` | Show chain |

### Leave Statuses
- `PENDING` - Yellow, Clock icon
- `APPROVED` - Green, CheckCircle icon
- `REJECTED` - Red, XCircle icon
- `CANCELLED` - Gray, XCircle icon
- `COMPLETED` - Blue, CheckCircle icon

---

## Common Patterns

### Loading States

All components support loading states:

```tsx
<MetricCard
  title="Loading..."
  value={0}
  isLoading={true}
/>
```

Or use skeleton components:

```tsx
import { MetricCardSkeleton } from '@/app/components/dashboard';

{isLoading ? <MetricCardSkeleton /> : <MetricCard {...props} />}
```

### Dark Mode

All components are fully dark mode compatible using Tailwind's dark mode classes:

```tsx
// Dark mode colors are handled automatically
className="bg-white dark:bg-slate-900"
```

### Responsive Design

Components use Tailwind's responsive utilities:

```tsx
<MetricCardGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard {...props} />
</MetricCardGrid>
```

### Accessibility

All components include:
- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support

```tsx
<MetricCard
  onClick={handleClick}
  aria-label="Pending requests: 12"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleClick();
  }}
/>
```

---

## Integration Examples

### Employee Dashboard

```tsx
import {
  MetricCard,
  ActionCenter,
  LeaveBreakdownChart,
  LeaveTimeline
} from '@/app/components/dashboard';

export function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard title="Days Used" value={12} unit="days" />
        <MetricCard title="Remaining" value={12} unit="days" />
        <MetricCard title="Pending" value={2} variant="warning" />
      </MetricCardGrid>

      {/* Action Center */}
      <ActionCenter actions={pendingActions} />

      {/* Chart */}
      <LeaveBreakdownChart data={leaveData} />

      {/* Timeline */}
      <LeaveTimeline leaves={leaveHistory} />
    </div>
  );
}
```

### HR Admin Dashboard

```tsx
import {
  MetricCard,
  ApprovalList,
  RecentActivityTable
} from '@/app/components/dashboard';

export function HRAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard title="Pending Approvals" value={15} />
        <MetricCard title="On Leave Today" value={8} />
      </MetricCardGrid>

      {/* Approvals */}
      <ApprovalList
        approvals={pendingApprovals}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole="HR_ADMIN"
      />

      {/* Recent Activity */}
      <RecentActivityTable
        rows={recentActivity}
        columns={columns}
      />
    </div>
  );
}
```

### Department Head Dashboard

```tsx
import {
  MetricCard,
  TeamCapacityHeatmap,
  ApprovalList
} from '@/app/components/dashboard';

export function DeptHeadDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard title="Team Size" value={25} />
        <MetricCard title="On Leave" value={3} />
      </MetricCardGrid>

      {/* Team Capacity */}
      <TeamCapacityHeatmap teamData={teamMembers} />

      {/* Approvals */}
      <ApprovalList
        approvals={teamApprovals}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole="DEPT_HEAD"
      />
    </div>
  );
}
```

---

## File Structure

```
app/components/dashboard/
├── index.ts                    # Barrel exports
├── README.md                   # This file
├── MetricCard.tsx
├── ActionCenter.tsx
├── RecentActivityTable.tsx
├── LeaveBreakdownChart.tsx
├── TeamCapacityHeatmap.tsx
├── ApprovalList.tsx
├── DocumentUploader.tsx
└── LeaveTimeline.tsx
```

---

## Best Practices

1. **Always use TypeScript interfaces** for type safety
2. **Provide loading states** for async data
3. **Handle empty states** gracefully
4. **Use skeleton loaders** for better UX
5. **Keep components pure** - no side effects
6. **Make components accessible** - ARIA labels, keyboard nav
7. **Support dark mode** - use Tailwind dark: utilities
8. **Test responsive behavior** - mobile, tablet, desktop
9. **Document prop types** - JSDoc comments
10. **Handle errors gracefully** - error states and messages

---

## Dependencies

- React 18+
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Recharts (charts)
- date-fns (date formatting)
- shadcn/ui components (Card, Badge, Button, etc.)

---

## License

Internal use only - CDBL Leave Management System
