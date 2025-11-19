// Barrel export for shared components
// This allows: import { StatusBadge, FilterBar } from "@/components/shared"

export { StatusBadge } from "./StatusBadge";
// KPICard and KPIGrid moved to cards/
export { QuickActions } from "./QuickActions";
export { FilterBar } from "./FilterBar";
export { ApprovalActionButtons } from "./ApprovalActionButtons";
export type { ApprovalAction } from "./ApprovalActionButtons";
export { EmployeeDetailView } from "./EmployeeDetailView";
export { SharedTimeline } from "./SharedTimeline";
export { LeaveBalancePanel } from "./LeaveBalancePanel";
export { EmptyState } from "./EmptyState";
export { ErrorBoundary } from "./ErrorBoundary";
export { ExportSection } from "./ExportSection";
export { CancellationTable } from "./CancellationTable";
export { LeaveTable } from "./LeaveTable";
export { EmployeeProfileCard } from "./EmployeeProfileCard";
export { LeaveHistoryTable } from "./LeaveHistoryTable";
export { DateRangePicker } from "./DateRangePicker";
export { FileUploadSection } from "./FileUploadSection";
export { LeaveActivityCard, createLeaveActivityData } from "./LeaveActivityCard";
export { HRAnalyticsCard, createHRAnalyticsData } from "./HRAnalyticsCard";

// Re-export all modals
export * from "./modals";

// Re-export all table components
export * from "./tables";

// Re-export client-side widgets only
// Note: Server-only widgets like RecentAuditLogs must be imported directly
// to avoid bundling server-side code in client components
export { MiniCalendar } from "./widgets";
export { NextHoliday } from "./widgets";
export { PolicyAlerts } from "./widgets";
export { SmartRecommendations } from "./widgets";
export { LeaveHeatmap } from "./widgets";
export { SegmentedControlGlider } from "./widgets";
export { TeamOnLeaveWidget } from "./widgets";

// Re-export leave charts
export * from "./LeaveCharts";

// Re-export filters
export * from "./filters";

// Re-export states (loading, empty, error)
export * from "./states";

// Re-export pagination
export * from "./pagination";

// Developer Annotation Mode
export { AnnotationModeToggle } from "./AnnotationModeToggle";
export { AnnotationMarker } from "./AnnotationMarker";

// Note: Adapters have name conflicts with LeaveCharts, import directly if needed
// import { ... } from "@/components/shared/balance-adapters"
// import { ... } from "@/components/shared/timeline-adapters"
