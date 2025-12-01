# Dashboard Refactoring Implementation Guide

## Overview

This guide provides step-by-step instructions for refactoring existing dashboards to use the new reusable component library.

## Created Components

### Summary

✅ **8 Reusable Components Created** (3,037 lines of code)

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| MetricCard | `MetricCard.tsx` | 271 | Display key statistics |
| ActionCenter | `ActionCenter.tsx` | 325 | Pending tasks widget |
| RecentActivityTable | `RecentActivityTable.tsx` | 359 | Activity table |
| LeaveBreakdownChart | `LeaveBreakdownChart.tsx` | 282 | Leave charts |
| TeamCapacityHeatmap | `TeamCapacityHeatmap.tsx` | 408 | Team capacity viz |
| ApprovalList | `ApprovalList.tsx` | 568 | Approval workflow |
| DocumentUploader | `DocumentUploader.tsx` | 427 | File upload |
| LeaveTimeline | `LeaveTimeline.tsx` | 571 | Leave history |

### File Location

```
/app/components/dashboard/
├── index.ts                    # Barrel exports
├── README.md                   # Component documentation
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

## Refactoring Strategy

### Phase 1: Import New Components

Add imports to each dashboard file:

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

### Phase 2: Replace Existing Components

Gradually replace existing custom components with standardized ones. Keep existing data fetching logic intact.

---

## Dashboard-Specific Refactoring

### 1. Employee Dashboard

**File:** `/app/dashboard/employee/page.tsx`

**Current State:** Uses `ModernEmployeeDashboard`

**Refactoring Plan:**

```tsx
// Before
import { ModernEmployeeDashboard } from "@/components/dashboards";

// After
import {
  MetricCard,
  MetricCardGrid,
  ActionCenter,
  LeaveBreakdownChart,
  LeaveTimeline,
} from '@/app/components/dashboard';

function EmployeeDashboard({ data }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard
          title="Days Used"
          value={data.used}
          unit="days"
          icon={Calendar}
          variant="default"
        />
        <MetricCard
          title="Remaining"
          value={data.remaining}
          unit="days"
          icon={Clock}
          variant="success"
        />
        <MetricCard
          title="Pending Requests"
          value={data.pending}
          icon={AlertCircle}
          variant="warning"
        />
        <MetricCard
          title="Next Leave"
          value={data.nextLeave}
          subtitle="5 days away"
          icon={Calendar}
        />
      </MetricCardGrid>

      {/* Actions */}
      <ActionCenter
        actions={data.pendingActions}
        onDismiss={handleDismiss}
        maxItems={5}
        showViewAll
      />

      {/* Chart */}
      <LeaveBreakdownChart
        data={data.leaveBreakdown}
        chartType="bar"
        title="Leave Distribution"
        showLegend
        interactive
      />

      {/* Timeline */}
      <LeaveTimeline
        leaves={data.leaveHistory}
        orientation="vertical"
        interactive
        showApprovalChain
        onLeaveClick={(leave) => router.push(`/leaves/${leave.id}`)}
      />
    </div>
  );
}
```

**Components Used:**
- ✅ MetricCard (4x)
- ✅ ActionCenter (1x)
- ✅ LeaveBreakdownChart (1x)
- ✅ LeaveTimeline (1x)

---

### 2. HR Admin Dashboard

**File:** `/app/dashboard/hr-admin/page.tsx`

**Current State:** Uses `HRAdminDashboard` and `HRAdminDashboardClient`

**Refactoring Plan:**

```tsx
import {
  MetricCard,
  MetricCardGrid,
  ActionCenter,
  ApprovalList,
  RecentActivityTable,
} from '@/app/components/dashboard';

function HRAdminDashboard({ stats, approvals }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard
          title="Employees on Leave"
          value={stats.employeesOnLeave}
          icon={Users}
        />
        <MetricCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Avg Approval Time"
          value={`${stats.avgApprovalTime}d`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Leaves (YTD)"
          value={stats.totalLeavesThisYear}
          icon={Calendar}
        />
      </MetricCardGrid>

      {/* Actions */}
      <ActionCenter
        actions={[
          ...stats.missingCertificates,
          ...stats.infoRequests,
        ]}
        maxItems={5}
        showViewAll
      />

      {/* Approvals */}
      <ApprovalList
        approvals={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        onForward={handleForward}
        userRole="HR_ADMIN"
        title="Pending Leave Requests"
      />

      {/* Recent Activity */}
      <RecentActivityTable
        title="Recent Approvals"
        rows={stats.recentApprovals}
        columns={[
          { key: 'employeeName', label: 'Employee', sortable: true },
          { key: 'type', label: 'Type', render: renderTypeBadge },
          { key: 'action', label: 'Action', sortable: true },
          { key: 'timestamp', label: 'Date', render: renderDate },
        ]}
        pageSize={10}
      />
    </div>
  );
}
```

**Components Used:**
- ✅ MetricCard (4x)
- ✅ ActionCenter (1x)
- ✅ ApprovalList (1x)
- ✅ RecentActivityTable (1x)

---

### 3. Department Head Dashboard

**File:** `/app/dashboard/dept-head/page.tsx`

**Current State:** Uses `DeptHeadDashboardWrapper`

**Refactoring Plan:**

```tsx
import {
  MetricCard,
  MetricCardGrid,
  TeamCapacityHeatmap,
  ApprovalList,
  RecentActivityTable,
} from '@/app/components/dashboard';

function DeptHeadDashboard({ teamData, approvals }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard
          title="Team Size"
          value={teamData.totalMembers}
          icon={Users}
        />
        <MetricCard
          title="On Leave Today"
          value={teamData.onLeaveToday}
          icon={Calendar}
          variant={teamData.onLeaveToday > 3 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Pending Approvals"
          value={approvals.length}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Utilization Rate"
          value={`${teamData.utilizationRate}%`}
          icon={Activity}
          variant="success"
        />
      </MetricCardGrid>

      {/* Team Capacity */}
      <TeamCapacityHeatmap
        teamData={teamData.members}
        onCellClick={(employee) => showEmployeeDetails(employee)}
        title="Team Leave Overview"
      />

      {/* Approvals */}
      <ApprovalList
        approvals={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole="DEPT_HEAD"
        title="Team Leave Requests"
      />

      {/* Team Activity */}
      <RecentActivityTable
        title="Team Activity"
        rows={teamData.recentActivity}
        columns={teamColumns}
        onRowClick={(row) => router.push(`/leaves/${row.id}`)}
      />
    </div>
  );
}
```

**Components Used:**
- ✅ MetricCard (4x)
- ✅ TeamCapacityHeatmap (1x)
- ✅ ApprovalList (1x)
- ✅ RecentActivityTable (1x)

---

### 4. HR Head Dashboard

**File:** `/app/dashboard/hr-head/page.tsx`

**Current State:** Uses `HRHeadDashboardClient`

**Refactoring Plan:**

```tsx
import {
  MetricCard,
  MetricCardGrid,
  ActionCenter,
  ApprovalList,
  LeaveBreakdownChart,
} from '@/app/components/dashboard';

function HRHeadDashboard({ stats, approvals }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <MetricCardGrid>
        <MetricCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
        />
        <MetricCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Compliance Score"
          value={`${stats.complianceScore}%`}
          icon={Shield}
          variant="success"
        />
        <MetricCard
          title="YTD Leaves"
          value={stats.totalLeavesYTD}
          icon={Calendar}
        />
      </MetricCardGrid>

      {/* Critical Actions */}
      <ActionCenter
        actions={stats.criticalActions}
        maxItems={5}
        title="Critical Actions Required"
      />

      {/* Department Overview */}
      <LeaveBreakdownChart
        data={stats.departmentBreakdown}
        chartType="bar"
        title="Leave by Department"
        height={350}
      />

      {/* Approvals */}
      <ApprovalList
        approvals={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole="HR_HEAD"
        title="Pending Approvals (HR Head Level)"
      />
    </div>
  );
}
```

**Components Used:**
- ✅ MetricCard (4x)
- ✅ ActionCenter (1x)
- ✅ LeaveBreakdownChart (1x)
- ✅ ApprovalList (1x)

---

### 5. CEO Dashboard

**File:** `/app/dashboard/ceo/page.tsx`

**Current State:** Uses `SuperAdminDashboard` and `CEODashboardClient`

**Refactoring Plan:**

```tsx
import {
  MetricCard,
  MetricCardGrid,
  LeaveBreakdownChart,
  ApprovalList,
} from '@/app/components/dashboard';

function CEODashboard({ stats, criticalApprovals }) {
  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <MetricCardGrid>
        <MetricCard
          title="Total Workforce"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} active`}
          icon={Users}
        />
        <MetricCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          subtitle={`${stats.utilizationRate}% available`}
          icon={Activity}
        />
        <MetricCard
          title="YoY Growth"
          value={`${stats.yoyGrowth}%`}
          icon={TrendingUp}
          trend={{ direction: stats.yoyGrowth > 0 ? 'up' : 'down', change: stats.yoyGrowth }}
        />
        <MetricCard
          title="Est. Cost"
          value={`$${(stats.estimatedCost / 1000).toFixed(1)}K`}
          subtitle="Year to date"
          icon={DollarSign}
        />
      </MetricCardGrid>

      {/* Company-wide Overview */}
      <LeaveBreakdownChart
        data={stats.companyWideBreakdown}
        chartType="pie"
        title="Company-wide Leave Distribution"
        showLegend
        height={400}
      />

      {/* Critical Approvals Only */}
      <ApprovalList
        approvals={criticalApprovals}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole="CEO"
        title="Critical Approvals (CEO Level)"
        maxItems={10}
      />
    </div>
  );
}
```

**Components Used:**
- ✅ MetricCard (4x)
- ✅ LeaveBreakdownChart (1x)
- ✅ ApprovalList (1x)

---

## Data Transformation Examples

### Example 1: Converting API Data to MetricCard Props

```tsx
// API Response
const apiStats = {
  employeesOnLeave: 8,
  pendingRequests: 12,
  avgApprovalTime: 2.3,
  totalLeavesThisYear: 145
};

// Transform to MetricCard
<MetricCardGrid>
  <MetricCard
    title="Employees on Leave"
    value={apiStats.employeesOnLeave}
    icon={Users}
  />
  <MetricCard
    title="Pending Requests"
    value={apiStats.pendingRequests}
    icon={Clock}
    variant={apiStats.pendingRequests > 10 ? 'warning' : 'default'}
  />
  <MetricCard
    title="Avg Approval Time"
    value={`${apiStats.avgApprovalTime.toFixed(1)}d`}
    icon={TrendingUp}
  />
</MetricCardGrid>
```

### Example 2: Converting Leave Data to Timeline Format

```tsx
// API Response
const apiLeaves = [
  {
    id: 1,
    leaveType: 'CASUAL',
    status: 'APPROVED',
    fromDate: '2024-01-15',
    toDate: '2024-01-17',
    totalDays: 3,
    reason: 'Personal',
    approvals: [...]
  }
];

// Transform to LeaveTimeline
const timelineData = apiLeaves.map(leave => ({
  id: leave.id,
  type: leave.leaveType,
  status: leave.status,
  startDate: new Date(leave.fromDate),
  endDate: new Date(leave.toDate),
  days: leave.totalDays,
  reason: leave.reason,
  approvalChain: leave.approvals.map((a, i) => ({
    step: i + 1,
    role: a.role,
    status: a.status,
    approver: a.approverName,
    timestamp: a.timestamp
  }))
}));

<LeaveTimeline
  leaves={timelineData}
  showApprovalChain
  interactive
/>
```

### Example 3: Converting Team Data to Heatmap Format

```tsx
// API Response
const apiTeamData = [
  {
    employeeId: '1',
    name: 'John Doe',
    department: 'Engineering',
    leavesThisMonth: 3,
    leaves: [...]
  }
];

// Transform to TeamCapacityHeatmap
const heatmapData = apiTeamData.map(emp => ({
  employeeId: emp.employeeId,
  employeeName: emp.name,
  department: emp.department,
  leaveCount: emp.leavesThisMonth,
  riskLevel: emp.leavesThisMonth > 5 ? 'high' :
              emp.leavesThisMonth > 2 ? 'medium' : 'low',
  leaves: emp.leaves
}));

<TeamCapacityHeatmap
  teamData={heatmapData}
  onCellClick={(employee) => showDetails(employee)}
/>
```

---

## Migration Checklist

### Pre-Migration

- [ ] Review existing dashboard code
- [ ] Identify which components to replace
- [ ] Map data structures to new component props
- [ ] Create data transformation functions
- [ ] Test in development environment

### Migration Steps

For each dashboard:

1. [ ] Import new components
2. [ ] Keep existing data fetching (don't modify API calls)
3. [ ] Replace UI components one at a time
4. [ ] Test functionality after each replacement
5. [ ] Verify responsive behavior
6. [ ] Check dark mode compatibility
7. [ ] Test accessibility (keyboard nav, screen readers)
8. [ ] Remove old component imports
9. [ ] Clean up unused code

### Post-Migration

- [ ] Verify all dashboards work correctly
- [ ] Test on mobile devices
- [ ] Check performance (loading times)
- [ ] Review bundle size
- [ ] Update tests
- [ ] Document any issues
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Common Issues & Solutions

### Issue 1: Data Format Mismatch

**Problem:** API returns different field names than component expects

**Solution:** Create transformation functions

```tsx
const transformLeaveData = (apiData) => ({
  id: apiData.leaveId,
  type: apiData.leaveType,
  status: apiData.currentStatus,
  startDate: new Date(apiData.fromDate),
  endDate: new Date(apiData.toDate),
  days: apiData.totalDays
});
```

### Issue 2: Missing Dependencies

**Problem:** Component uses libraries not installed

**Solution:** Check package.json and install if needed

```bash
npm install recharts date-fns framer-motion lucide-react
```

### Issue 3: Type Errors

**Problem:** TypeScript errors due to type mismatches

**Solution:** Use provided interfaces

```tsx
import type { MetricCardProps, ActionItem } from '@/app/components/dashboard';
```

### Issue 4: Styling Conflicts

**Problem:** New components clash with existing styles

**Solution:** Use className prop to override

```tsx
<MetricCard
  {...props}
  className="custom-metric-override"
/>
```

---

## Testing Strategy

### Unit Tests

Test each component with different props:

```tsx
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/app/components/dashboard';

describe('MetricCard', () => {
  it('renders value and title', () => {
    render(<MetricCard title="Test" value={42} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<MetricCard title="Test" value={42} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test dashboard with real data:

```tsx
describe('EmployeeDashboard', () => {
  it('displays all metrics correctly', async () => {
    render(<EmployeeDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Days Used')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });
  });
});
```

### Visual Regression Tests

Use tools like Chromatic or Percy to catch visual changes.

---

## Performance Optimization

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const LeaveBreakdownChart = dynamic(
  () => import('@/app/components/dashboard').then(mod => mod.LeaveBreakdownChart),
  { loading: () => <LeaveBreakdownChartSkeleton /> }
);
```

### Memoization

```tsx
import { useMemo } from 'react';

const transformedData = useMemo(
  () => transformLeaveData(apiData),
  [apiData]
);
```

### Code Splitting

Components are already split by file. Import only what you need:

```tsx
// Good - imports only what's needed
import { MetricCard, ActionCenter } from '@/app/components/dashboard';

// Avoid - imports everything
import * as Dashboard from '@/app/components/dashboard';
```

---

## Next Steps

1. **Start with Employee Dashboard** - Simplest dashboard, good for testing
2. **Move to HR Admin Dashboard** - More complex, tests approval workflows
3. **Refactor Dept Head Dashboard** - Tests team capacity features
4. **Update HR Head Dashboard** - Tests advanced features
5. **Finish with CEO Dashboard** - Most executive-level view

## Support

For questions or issues:
- Check `/app/components/dashboard/README.md` for component docs
- Review examples in this guide
- Test components in isolation first
- Create issues for bugs or feature requests

---

**Last Updated:** November 15, 2025
**Version:** 1.0.0
**Status:** Ready for Implementation
