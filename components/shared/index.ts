// Barrel export for shared components
// This allows: import { StatusBadge, FilterBar } from "@/components/shared"

export { StatusBadge } from "./StatusBadge";
// KPICard and KPIGrid moved to cards/
export { QuickActions } from "./QuickActions";
export { FilterBar } from "./FilterBar";
export { SharedTimeline } from "./SharedTimeline";
export { LeaveBalancePanel } from "./LeaveBalancePanel";
export { EmptyState } from "./EmptyState";
export { ErrorBoundary } from "./ErrorBoundary";
export { ExportSection } from "./ExportSection";
export { CancellationTable } from "./CancellationTable";
export { LeaveTable } from "./LeaveTable";

// Re-export all modals
export * from "./modals";

// Re-export all table components
export * from "./tables";

// Re-export widgets
export * from "./widgets";

// Re-export leave charts
export * from "./LeaveCharts";

// Note: Adapters have name conflicts with LeaveCharts, import directly if needed
// import { ... } from "@/components/shared/balance-adapters"
// import { ... } from "@/components/shared/timeline-adapters"
