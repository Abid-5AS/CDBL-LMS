// Admin Dashboard
export { SystemAdminDashboard } from "./admin/Overview";

// CEO Dashboard
export { SuperAdminDashboard } from "./ceo/SuperAdminDashboard";

// Dept Head Dashboard
export { DeptHeadDashboardWrapper } from "./dept-head/Overview";

// Employee Dashboard
export { ModernEmployeeDashboard } from "./employee/ModernEmployeeDashboard";
export { EmployeeDashboardContent as EmployeeDashboard } from "./employee/Overview";

// HR Admin Dashboard
export { HRAdminDashboard } from "./hr-admin/Overview";
export { PendingApprovals, CancellationRequests } from "./hr-admin/sections";

// HR Head Dashboard
export { HRDashboard as HRHeadDashboard } from "./hr-head/Overview";
export { ReturnedRequests } from "./hr-head/sections";

// Shared Components
export * from "./shared";

// Common Components
export { HeroStrip } from "./common/HeroStrip";
export { InsightsWidget } from "./common/InsightsWidget";

// Hooks
export * from "./dept-head/hooks";
