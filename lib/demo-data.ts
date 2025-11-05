/**
 * Demo data fallbacks for frontend components
 * Used when API returns empty results or during development
 */

export interface TeamOnLeaveMember {
  id: number;
  name: string;
  avatar: string;
  type: string;
  start: string;
  end: string;
}

export interface HeatmapBucket {
  date: string;
  count: number;
  types: string[];
}

export interface Insight {
  kind: string;
  text: string;
  meta?: Record<string, any>;
}

export interface RecentRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  duration: number;
}

// Demo team members on leave
export const demoTeamOnLeave: TeamOnLeaveMember[] = [
  {
    id: 1,
    name: "Ahmed Rahman",
    avatar: "/u/1.png",
    type: "CASUAL",
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
  {
    id: 2,
    name: "Fatima Khan",
    avatar: "/u/2.png",
    type: "EARNED",
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  },
];

// Demo heatmap data (last 3 months)
export const demoHeatmapData: HeatmapBucket[] = (() => {
  const buckets: HeatmapBucket[] = [];
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Generate 8 random leave days across the period
  const leaveDays = [
    5, 12, 18, 25, 32, 45, 58, 72,
  ]; // Days ago from today

  leaveDays.forEach((daysAgo) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    buckets.push({
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 3) + 1,
      types: ["EARNED", "CASUAL", "MEDICAL"].slice(
        0,
        Math.floor(Math.random() * 3) + 1
      ),
    });
  });

  return buckets.sort((a, b) => a.date.localeCompare(b.date));
})();

// Demo insights
export const demoInsights: Insight[] = [
  {
    kind: "EL_REMINDER",
    text: "You have 12 unused Earned Leave days. Consider planning your leave.",
    meta: { days: 12 },
  },
  {
    kind: "HOLIDAY_UPCOMING",
    text: "Eid-ul-Fitr holiday is coming up in 15 days. Plan your leave accordingly.",
    meta: { holidayDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  },
  {
    kind: "BALANCE_LOW",
    text: "Your Casual Leave balance is running low (4 days remaining).",
    meta: { type: "CASUAL", remaining: 4 },
  },
];

// Demo recent requests
export const demoRecentRequests: RecentRequest[] = [
  {
    id: 1,
    type: "EARNED",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "PENDING",
    duration: 5,
  },
  {
    id: 2,
    type: "CASUAL",
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "APPROVED",
    duration: 2,
  },
  {
    id: 3,
    type: "MEDICAL",
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "APPROVED",
    duration: 3,
  },
];

// Demo dashboard summary
export const demoDashboardSummary = {
  daysUsedThisYear: 12,
  totalUsed: 18,
  remaining: 26,
  leaveTypeDistribution: [
    { type: "EARNED", percentage: 50, days: 9 },
    { type: "CASUAL", percentage: 30, days: 5 },
    { type: "MEDICAL", percentage: 20, days: 4 },
  ],
};

// Helper function to check if we should use demo data
export function shouldUseDemoData(apiData: any): boolean {
  return (
    !apiData ||
    (Array.isArray(apiData) && apiData.length === 0) ||
    (typeof apiData === "object" && Object.keys(apiData).length === 0)
  );
}



