// Barrel export for custom hooks
// This allows: import { useDashboardLayout, useLeaveRequests } from "@/hooks"

export { useDashboardLayout } from "./useDashboardLayout";
export { useLeaveRequests } from "./useLeaveRequests";

// Error handling and retry hooks
export { useRetry, useFetchWithRetry } from "./useRetry";
export { useErrorRecovery } from "./useErrorRecovery";

// Color system hooks
export { useRoleColors } from "./useRoleColors";
export { useStatusColor } from "./useStatusColor";
export { useDarkMode } from "./useDarkMode";

// Performance monitoring hooks
export { usePerformanceMonitor } from "./usePerformanceMonitor";

// Note: These are already re-exported from @/lib:
// - useDebounce (from @/lib/use-debounce)
// - useUser (from @/lib/user-context)
// - useFilterFromUrl (from @/lib/url-filters)

// Note: useNotification is exported from @/context/NotificationContext
// Import it with: import { useNotification } from "@/context/NotificationContext"
