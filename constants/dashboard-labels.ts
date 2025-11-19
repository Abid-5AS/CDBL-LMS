/**
 * Dashboard Label Constants
 * Standardized terminology across all dashboards to ensure consistency
 */

export const STATUS_LABELS = {
  // Leave Request Statuses
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  RETURNED: "Sent Back for Updates", // Standardized from "Returned" / "Returned for Modification"
  CANCELLATION_REQUESTED: "Cancellation Requested",
  RECALLED: "Recalled",
} as const;

export const METRIC_LABELS = {
  // Common Dashboard Metrics
  PENDING_REQUESTS: "Pending Requests",
  PENDING_APPROVALS: "Pending Approvals",
  ON_LEAVE: "On Leave",
  TEAM_ON_LEAVE: "Team Members on Leave",
  UPCOMING_LEAVES: "Upcoming Leaves",
  DAYS_USED: "Days Used",
  DAYS_AVAILABLE: "Days Available",
  TOTAL_BALANCE: "Total Balance",
  
  // Manager/Dept Head Specific
  FORWARDED: "Forwarded to Next Approver",
  SENT_BACK: "Sent Back for Updates", // Standardized
  
  // HR/CEO Specific
  WORKFORCE_AVAILABILITY: "Workforce Availability", // Renamed from "Utilization Rate"
  TOTAL_WORKFORCE: "Total Workforce",
  ACTIVE_EMPLOYEES: "Active Employees",
  CANCELLED_REQUESTS: "Cancellation Requests",
} as const;

export const SECTION_TITLES = {
  MY_REQUESTS: "My Requests",
  MY_TEAM: "My Team",
  APPROVAL_QUEUE: "Approval Queue",
  LEAVE_BALANCE: "Leave Balance",
  RECENT_ACTIVITY: "Recent Activity",
  TEAM_CALENDAR: "Team Calendar",
  PENDING_APPROVALS: "Pending Approvals",
  SYSTEM_OVERVIEW: "System Overview",
} as const;

export const EMPTY_STATE_MESSAGES = {
  NO_PENDING_REQUESTS: "You have no pending requests",
  NO_UPCOMING_LEAVE: "No upcoming leave scheduled",
  NO_TEAM_ON_LEAVE: "All team members are available",
  NO_APPROVALS_PENDING: "No approvals pending",
  ALL_CAUGHT_UP: "You're all caught up!",
} as const;

export const TOOLTIPS = {
  PENDING_REQUESTS: "Your submitted requests awaiting decision. Click to view details.",
  SENT_BACK: "Requests that need employee updates before resubmission",
  TEAM_SCOPE: "Shows leave status for your direct team members",
  WORKFORCE_AVAILABILITY: "Percentage of employees currently available (not on leave)",
} as const;
