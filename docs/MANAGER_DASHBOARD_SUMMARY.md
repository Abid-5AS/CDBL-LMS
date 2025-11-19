# Manager/Dept Head Dashboard - Complete Feature Summary

## Current Implementation Analysis

### ✅ ALL Features to Preserve

#### 1. **Department Overview KPIs** (4 Cards)
- **Pending Approvals** - Count awaiting review, click to scroll to table
- **Forwarded** - Count sent to HR after approval
- **Sent Back/Returned** - Count returned to employees for correction
- **Cancelled** - Count withdrawn by employees
- Each KPI has:
  - Info tooltip explaining what it means
  - Icon (ClipboardList, CheckCircle, RotateCcw, XCircle)
  - Subtitle text
  - Click interaction (scroll to table for pending)

#### 2. **Smart Alerts Panel**
- Dynamic alerts based on queue size:
  - `counts.pending > 15` → "Large Approval Queue" (warning)
  - `counts.pending > 0` → "Pending Approvals" (info)
  - `counts.returned > 5` → "High Return Rate" (info)
  - No issues → "All Clear" (info)
- Alert tones: info / warning / critical
- Positioned on right sidebar

#### 3. **Approval Queue Table** (Ultra-Feature-Rich)
**Component:** `DeptHeadPendingTable.tsx`

**Features:**
- ✅ Search with debounce (250ms)
- ✅ Filters: Status, Type
- ✅ Scrolling pagination
- ✅ Batch selection (checkboxes)
- ✅ Bulk actions (approve/reject/forward/return)
- ✅ Individual row actions:
  - Approve (with dialog)
  - Reject (with dialog + reason)
  - Forward (with dialog + target role selection)
  - Return for modification (with dialog + comment)
  - Cancel (for admin)
- ✅ Leave comparison modal (if isModified=true)
- ✅ Loading states
  - `<PendingTableLoading />`
  - `<PendingTableError />`
  - `<PendingTableEmpty />`
  - `<PendingTableNoResults />`
- ✅ Status badges
- ✅ Processing indicators (spinner on buttons while API call)
- ✅ Link to details page

**Columns:**
1. Checkbox (batch select)
2. Employee Name (link to details)
3. Leave Type
4. Dates (Start - End)
5. Days
6. Status
7. Submitted Date
8. Actions (Approve/Reject/Forward/Return buttons)

**Action Dialogs:**
- `<ApprovalDialog />` - Confirm approval
- `<RejectDialog />` - Rejection with reason
- `<ForwardDialog />` - Forward to role
- `<ReturnDialog />` - Return with comment
- `<CancelDialog />` - Cancel request

#### 4. **Team Coverage Calendar**
**Component:** `TeamCoverageCalendar.tsx`

Features:
- Calendar view of team absences
- Visual representation of who is out when
- Conflict detection (overlapping leaves)

#### 5. **Quick Actions Panel**
**Component:** `DeptHeadQuickActions.tsx`

Actions:
- **Team Calendar** - Navigate to `/leaves?view=calendar`
- **Acting Approver** - Delegate approval authority (coming soon)
- **Export Report** - Download team leave report as CSV
  - Uses Papa Parse for CSV generation
  - Includes: Employee Name, Email, Type, Dates, Days, Status, Reason, Submitted
  - Filename: `team-leave-report-YYYY-MM-DD.csv`

#### 6. **Custom Hooks** (Business Logic)
- `useLeaveActions` - Handles approve/reject/forward/return actions
- `useLeaveDialogs` - Dialog state management
- Processing state tracking

#### 7. **Responsive Grid Layout**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns (Team Status, Approvals, Actions)
- Ultra-wide: 4 KPI cards in row

---

## Corporate Design Transformation Strategy

### Layout: "Compact" Density Mode
- Manager role needs data-heavy views
- Padding: `p-4` (not p-6)
- Text: `text-sm` (not text-base)
- Table rows: `py-2` (compact)

### 3-Column Grid (As per Master Plan)
```
┌─────────────┬─────────────┬─────────────┐
│ Left Col    │ Mid Col     │ Right Col   │
│ (KPIs +     │ (Approval   │ (Alerts +   │
│  Team Cal)  │  Queue)     │  Actions)   │
└─────────────┴─────────────┴─────────────┘
```

### What Changes (Visual Only)
- ❌ Remove: Animations
- ❌ Remove: Gradients
- ✅ Replace: Cards with white + slate-200 borders
- ✅ Replace: KPI cards with corporate MetricCard
- ✅ Update: Status badges with corporate StatusBadge
- ✅ Update: Buttons to corporate style
- ✅ Update: Table to ultra-dense corporate table

### What Stays (100% Functionality)
- ✅ ALL API calls
- ✅ ALL search/filter logic
- ✅ ALL batch selection
- ✅ ALL action dialogs
- ✅ ALL custom hooks
- ✅ ALL tooltips
- ✅ ALL error/loading states
- ✅ CSV export functionality
- ✅ Calendar component

---

## Implementation Files

### Main Dashboard
`components/dashboards/dept-head/CorporateManagerDashboard.tsx`

### Components to Restyle (Keep Logic)
1. `KPICard` → Use corporate `MetricCard`
2. `PendingTable` → Apply ultra-dense corporate table styling
3. `SmartAlert` → Corporate alert cards
4. `QuickActions` → Corporate action buttons
5. `TeamCoverageCalendar` → Corporate calendar styling

### Reusable Components (Already Created)
- ✅ `MetricCard` - For KPIs
- ✅ `StatusBadge` - For status display
- ✅ `BalanceCard` - (not used in manager dashboard)

### New Components Needed
- Corporate `AlertCard` - For smart alerts
- Corporate `ActionButton` - For quick actions
- Ultra-dense `DataTable` wrapper - For approval queue

---

## Corporate Manager Dashboard Specification

### Header
```
Manager Dashboard
Review and approve leave requests from your department

[Refresh] [Export All]
```

### Section 1: Department Metrics (Top Row - 4 Columns)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Pending: 12  │ Forwarded: 8 │ Returned: 3  │ Cancelled: 2 │
│ Click to     │ Sent to HR   │ Need resub.  │ Withdrawn    │
│ view queue   │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Section 2: Main Grid (3 Columns)
```
┌────────────┬──────────────────────┬─────────────┐
│ LEFT COL   │ MIDDLE COL (WIDE)    │ RIGHT COL   │
├────────────┼──────────────────────┼─────────────┤
│ Team       │ Approval Queue       │ Alerts      │
│ Coverage   │                      │ • Pending:  │
│ Calendar   │ [Search] [Filters]   │   12 req.   │
│            │                      │             │
│ Mini       │ ┌──────────────────┐ │ Actions     │
│ Calendar   │ │ Table with:      │ │ • Team Cal  │
│ with team  │ │ - Checkboxes     │ │ • Export    │
│ absences   │ │ - Employee       │ │ • Delegate  │
│            │ │ - Type           │ │             │
│            │ │ - Dates          │ │             │
│            │ │ - Actions        │ │             │
│            │ └──────────────────┘ │             │
│            │                      │             │
│            │ [Bulk Actions]       │             │
└────────────┴──────────────────────┴─────────────┘
```

### Dense Table Design
- Row height: ~40px
- Font size: text-sm
- Compact action buttons (icon-only with tooltips)
- Hover: bg-slate-50
- Selected: bg-slate-100

---

## Priority: HIGH
This is the most complex dashboard with the most features.
All functionality MUST be preserved while applying corporate styling.

---

## Next Steps
1. Create `CorporateManagerDashboard.tsx`
2. Restyle `PendingTable` to ultra-dense corporate
3. Create corporate `AlertCard` component
4. Update `QuickActions` to corporate buttons
5. Restyle `TeamCoverageCalendar` (corporate calendar)
