# Apple Activity Card Integration Examples

## 🎯 Places Where Apple Activity Card Can Save Space & Improve Visualization

### **1. Employee Dashboard - Leave Balance Replacement**

**Before (Current):**

```tsx
// Current LeaveOverviewCard with tabs and multiple sections
<LeaveOverviewCard
  balanceData={balanceData}
  leavesData={leavesData}
  isLoadingBalance={isLoadingBalance}
  isLoadingLeaves={isLoadingLeaves}
/>
```

**After (With Apple Activity Card):**

```tsx
import {
  LeaveActivityCard,
  createLeaveActivityData,
} from "@/components/shared";

// In your component
const activityData = createLeaveActivityData({
  earnedUsed: balanceData?.earnedUsed || 0,
  earnedTotal: 20,
  casualUsed: balanceData?.casualUsed || 0,
  casualTotal: 10,
  medicalUsed: balanceData?.medicalUsed || 0,
  medicalTotal: 14,
});

<LeaveActivityCard
  title="My Leave Balance"
  activities={activityData}
  className="max-w-md"
/>;
```

**Space Saved:** ~60% less vertical space while showing same information more visually

---

### **2. HR Admin Dashboard - Analytics Overview**

**Before (Multiple separate cards):**

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <KPICard title="Pending Approvals" value={25} />
  <KPICard title="Processed Today" value={12} />
  <KPICard title="Team Utilization" value="85%" />
  <KPICard title="Compliance Score" value="94%" />
</div>
```

**After (Single Activity Card):**

```tsx
import { HRAnalyticsCard, createHRAnalyticsData } from "@/components/shared";

const analyticsData = createHRAnalyticsData({
  pendingApprovals: 25,
  maxPendingTarget: 30,
  processedToday: 12,
  dailyTarget: 15,
  teamUtilization: 85,
  utilizationTarget: 90,
  complianceScore: 94,
  complianceTarget: 100,
});

<HRAnalyticsCard
  title="HR Dashboard"
  subtitle="Real-time metrics overview"
  metrics={analyticsData}
/>;
```

**Benefits:**

- 75% less horizontal space
- Better visual correlation between metrics
- Animated progress indicators
- Trend indicators

---

### **3. Department Head Dashboard - Team Status**

```tsx
// Create team activity metrics
const teamMetrics = [
  {
    label: "Available",
    current: 12,
    target: 15,
    color: "#22C55E",
    size: 100,
    unit: "members",
    trend: "stable" as const,
  },
  {
    label: "On Leave",
    current: 3,
    target: 5,
    color: "#F59E0B",
    size: 80,
    unit: "members",
    trend: "down" as const,
  },
  {
    label: "Pending Reviews",
    current: 2,
    target: 3,
    color: "#EF4444",
    size: 70,
    unit: "requests",
    trend: "up" as const,
  },
];

<HRAnalyticsCard
  title="Team Status"
  subtitle="Department overview"
  metrics={teamMetrics}
  className="max-w-lg"
/>;
```

---

### **4. CEO Dashboard - Company-Wide Metrics**

```tsx
const companyMetrics = createHRAnalyticsData({
  pendingApprovals: 45,
  maxPendingTarget: 50,
  processedToday: 28,
  dailyTarget: 30,
  teamUtilization: 78,
  utilizationTarget: 85,
  complianceScore: 96,
  complianceTarget: 100,
});

<HRAnalyticsCard
  title="Company Overview"
  subtitle="Enterprise-wide leave metrics"
  metrics={companyMetrics}
  className="max-w-2xl"
/>;
```

---

### **5. Reports Dashboard - Monthly Summary**

```tsx
// Monthly leave utilization across departments
const monthlyData = [
  {
    label: "IT Dept",
    current: 45,
    target: 60,
    color: "#8B5CF6",
    size: 90,
    unit: "days used",
    trend: "up" as const,
  },
  {
    label: "Finance",
    current: 32,
    target: 45,
    color: "#06B6D4",
    size: 90,
    unit: "days used",
    trend: "stable" as const,
  },
  {
    label: "Operations",
    current: 38,
    target: 50,
    color: "#10B981",
    size: 90,
    unit: "days used",
    trend: "down" as const,
  },
];

<HRAnalyticsCard
  title="Department Utilization"
  subtitle="Monthly leave usage by department"
  metrics={monthlyData}
/>;
```

---

## **Implementation Plan**

### **Phase 1: Employee Dashboard**

1. Replace `LeaveBalancePanel` with `LeaveActivityCard`
2. Update employee overview sections
3. Test responsiveness and animations

### **Phase 2: HR Dashboards**

1. Replace multiple KPI cards with `HRAnalyticsCard`
2. Consolidate dashboard metrics
3. Add trend indicators

### **Phase 3: Management Dashboards**

1. Update Department Head dashboard
2. Enhance CEO overview
3. Improve reports visualization

### **Benefits Summary**

- **Space Efficiency**: 50-75% less screen real estate
- **Visual Appeal**: Beautiful circular progress animations
- **Better UX**: Cleaner, more focused interface
- **Consistency**: Unified component across all dashboards
- **Mobile Friendly**: Better responsive behavior
