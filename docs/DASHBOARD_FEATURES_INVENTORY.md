# Dashboard Features Inventory
**Purpose:** Document ALL existing features across dashboards to ensure nothing is lost during UI/UX refactor

---

## Employee Dashboard Features

### Current Implementation
**File:** `components/dashboards/employee/ModernEmployeeDashboard.tsx`

#### ✅ Features to PRESERVE

1. **Balance Overview (3 Cards)**
   - Casual Leave balance
   - Sick/Medical Leave balance
   - Earned Leave balance
   - Shows: Available / Total
   - Color-coded indicators

2. **Active Request Tracker**
   - Shows most recent PENDING/SUBMITTED/FORWARDED request
   - Horizontal timeline visualization
   - Approval chain display with steps
   - Status for each approval step
   - Approver names and timestamps
   - **Component:** `ActiveRequestTracker.tsx`

3. **My Requests Table** (with Filters)
   - Filter tabs: ALL / PENDING / PAST
   - Columns: Type, Dates, Status, Days
   - Shows last 10 for ALL
   - Status-specific filtering
   - "View Full History" link
   - **Component:** `EmployeeRecentActivity.tsx`

4. **Team Status Summary** ("Who's Out Today")
   - Count of team members on leave today
   - Avatar stack (up to 4 visible)
   - "+N more" indicator
   - Click to expand modal
   - Modal shows full list with:
     - Names
     - Leave type
     - Date range
   - **Component:** `TeamStatusSummary.tsx`

5. **Upcoming Holidays Panel**
   - List of upcoming holidays
   - Holiday name and date
   - **Component:** `UpcomingHolidaysPanel.tsx`

6. **Quick Actions (Header)**
   - "My History" button → `/leaves`
   - "Apply for Leave" button → `/leaves/apply`

7. **Page Header**
   - Greeting: "Welcome back, {FirstName}"
   - Role indicator: "EMPLOYEE"

### Features from Other Components (Not Currently in Main Dashboard)

#### From `EmployeeActionCenter.tsx`
- Policy links
- FAQ links
- Guidelines access

#### From `FloatingQuickActions.tsx` (Currently disabled)
- Floating action buttons
- Quick navigation

---

## Manager/Dept Head Dashboard Features

### To Be Analyzed
**File:** `components/dashboards/dept-head/Overview.tsx`

#### Known Features (from requirements):
1. **Action Required Banner**
   - Pending approvals count
   - Alert if > 0

2. **Team Availability** ("Who is out today?")
   - List with avatars
   - "Back on [Date]"

3. **Approval Queue** (Pending Requests)
   - Dense cards or feed
   - Quick Approve/Reject buttons
   - Conflict warnings

4. **Team Calendar**
   - Mini-calendar
   - Team member leave visualization
   - Overlap detection

---

## HR Admin Dashboard Features

### To Be Analyzed
**File:** `components/dashboards/hr-admin/HRAdminDashboardClient.tsx`

#### Known Features (from requirements):
1. **Stats Ticker**
   - Pending count
   - Approved today
   - On leave count

2. **Master Request Table**
   - All incoming requests
   - Filters: Department, Status, Date
   - Bulk actions
   - Ultra-dense (40px rows)

3. **Quick Links Sidebar**
   - Add Employee
   - Manage Holidays
   - Generate Reports

---

## HR Head Dashboard Features

### To Be Analyzed
**File:** `components/dashboards/hr-head/HRHeadDashboardClient.tsx`

#### Known Features (from requirements):
1. **Org Health Metrics**
   - Absenteeism rate
   - Leave utilization %
   - Charts (line/bar)

2. **Policy Violations List**
   - High leave balance warnings
   - Frequent sick leave flags
   - Irregularities

3. **Department Breakdown**
   - Leave taken by department
   - Horizontal bar chart

4. **Export to Excel** button

---

## CEO Dashboard Features

### To Be Analyzed
**File:** `components/dashboards/ceo/CEODashboard.tsx`

#### Known Features (from requirements):
1. **Headcount Status**
   - Total employees
   - On leave
   - Active

2. **Critical Approvals**
   - Requests needing CEO sign-off
   - Count badge

3. **Leave Trends**
   - Year-over-year comparison
   - "This Year" vs "Last Year"
   - Line chart

---

## Shared/Common Features

### Components Used Across Dashboards

1. **LeaveTimeline** (`shared/LeaveTimeline.tsx`)
   - Horizontal/Vertical orientation
   - Approval chain visualization
   - Interactive mode

2. **WhosOutToday** (`shared/WhosOutToday.tsx`)
   - Team member list
   - Date ranges

3. **KPICard / MetricCard**
   - Number display
   - Label
   - Trend indicators

4. **AnalyticsChart** (`shared/AnalyticsChart.tsx`)
   - Chart.js integration
   - Line/Bar/Pie charts

5. **ExportButton** (`shared/ExportButton.tsx`)
   - Excel export functionality

---

## Design Transformation Strategy

### What Changes (Corporate Design)
- ❌ Remove: Framer Motion animations
- ❌ Remove: Gradients and glows
- ❌ Remove: Colored card backgrounds (except status indicators)
- ✅ Replace: Rounded corners (rounded-xl → rounded-md)
- ✅ Replace: Shadow effects (shadow-lg → shadow-sm)
- ✅ Update: Color palette (primary → slate-900)
- ✅ Update: Border colors (subtle slate-200)
- ✅ Update: Typography (Inter font, corporate scale)

### What STAYS (All Functionality)
- ✅ ALL data fetching logic
- ✅ ALL API integrations
- ✅ ALL filter/tab functionality
- ✅ ALL click handlers and navigation
- ✅ ALL modals and popovers
- ✅ ALL charts (just restyled)
- ✅ ALL tables (with corporate density)
- ✅ ALL interactive elements

### How to Preserve Features While Transforming

#### Pattern: Component Refactor
```tsx
// BEFORE (Current)
<motion.div
  variants={itemVariants}
  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6"
>
  <BalanceCard colorClass="bg-blue-500" />
</motion.div>

// AFTER (Corporate)
<div className="bg-white border border-slate-200 rounded-md shadow-sm p-6">
  <BalanceCard
    // Use new corporate BalanceCard with top-border color indicator
  />
</div>
```

#### Pattern: Keep All Props, Change Styling
```tsx
// BEFORE
<TeamStatusSummary
  data={teamData}
  onMemberClick={handleClick}
  showModal={true}
/>

// AFTER (same props, different internal styling)
<TeamStatusSummary
  data={teamData}           // ✅ Keep
  onMemberClick={handleClick} // ✅ Keep
  showModal={true}          // ✅ Keep
  density="comfortable"      // ➕ Add for corporate density
/>
```

---

## Implementation Checklist

### Employee Dashboard
- [ ] Replace LeaveBalanceCard with corporate BalanceCard (preserve all data)
- [ ] Restyle ActiveRequestTracker (keep timeline, remove blue gradient)
- [ ] Update EmployeeRecentActivity table (corporate density)
- [ ] Restyle TeamStatusSummary (keep modal, update colors)
- [ ] Update UpcomingHolidaysPanel (simple list, corporate)
- [ ] Replace header buttons (corporate button style)
- [ ] Remove motion animations, keep layout transitions
- [ ] Apply density mode: "comfortable"

### Manager Dashboard
- [ ] Create Action Required banner (corporate alert)
- [ ] Implement Team Availability list (corporate card)
- [ ] Create Approval Feed (dense corporate cards)
- [ ] Build Team Calendar (corporate calendar component)
- [ ] Apply density mode: "compact"

### HR Admin Dashboard
- [ ] Create Stats Ticker (compact metric cards)
- [ ] Build Master Request Table (ultra-dense, corporate)
- [ ] Implement Popover filters (corporate popover)
- [ ] Add Bulk action controls
- [ ] Create Quick Links sidebar
- [ ] Apply density mode: "compact"

### HR Head Dashboard
- [ ] Build Org Health section (corporate charts)
- [ ] Create Policy Violations list (corporate alert cards)
- [ ] Implement Department Breakdown chart
- [ ] Add Export button (corporate styled)
- [ ] Apply density mode: "compact"

### CEO Dashboard
- [ ] Create Headcount Status (large metric card)
- [ ] Build Critical Approvals section (corporate badge)
- [ ] Implement Leave Trends chart (simple line chart)
- [ ] Apply density mode: "comfortable"

---

## Feature Matrix

| Feature | Employee | Manager | HR Admin | HR Head | CEO |
|---------|----------|---------|----------|---------|-----|
| Balance Cards | ✅ | ❌ | ❌ | ❌ | ❌ |
| My Requests | ✅ | ❌ | ❌ | ❌ | ❌ |
| Active Request Tracker | ✅ | ❌ | ❌ | ❌ | ❌ |
| Team Status | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upcoming Holidays | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approval Queue | ❌ | ✅ | ❌ | ❌ | ❌ |
| Team Calendar | ❌ | ✅ | ❌ | ❌ | ❌ |
| Master Request Table | ❌ | ❌ | ✅ | ❌ | ❌ |
| Stats Ticker | ❌ | ❌ | ✅ | ✅ | ❌ |
| Org Health Metrics | ❌ | ❌ | ❌ | ✅ | ✅ |
| Policy Violations | ❌ | ❌ | ❌ | ✅ | ❌ |
| Dept Breakdown | ❌ | ❌ | ❌ | ✅ | ❌ |
| Headcount Status | ❌ | ❌ | ❌ | ❌ | ✅ |
| Critical Approvals | ❌ | ❌ | ❌ | ❌ | ✅ |
| Leave Trends | ❌ | ❌ | ❌ | ✅ | ✅ |

---

**Key Principle:** Every feature stays, only the visual presentation changes to match corporate standards.
