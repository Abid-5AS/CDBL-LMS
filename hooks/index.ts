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

// Cache hooks
export { useCache, useAsyncCache } from "./useCache";

// API optimization hooks
export { useOptimizedAPI, useMultipleAPIs, useAPIStats } from "./useOptimizedAPI";

// Accessibility hooks
export { useAccessibilityAudit } from "./useAccessibilityAudit";
export { useKeyboardNav } from "./useKeyboardNav";
export { useScreenReaderAnnouncement } from "./useScreenReaderAnnouncement";

// Utility hooks
export { useDebounce } from "./useDebounce";
export { useMutation } from "./useMutation";
export { useFormAutoSave } from "./useFormAutosave";
export { useGesture } from "./useGesture";
export { useHasMounted } from "./useHasMounted";
export { useModalManager } from "./useModalManager";
export { useMounted } from "./useMounted";
export { useRealTimeValidation } from "./useRealTimeValidation";
export { useSearch } from "./useSearch";
export { useTableState } from "./useTableState";
export { useVirtualScroll } from "./useVirtualScroll";
export { useNotificationStream } from "./useNotificationStream";

// Note: useUser is exported from @/components/providers/UserContext
// Note: useFilterFromUrl is exported from @/lib/url-filters

// Note: useNotification is exported from @/context/NotificationContext
// Import it with: import { useNotification } from "@/context/NotificationContext"
