// Barrel export for lib utilities
// This allows: import { cn, formatDate, leaveTypeLabel } from "@/lib"
// Reduces import lines from 15-20 down to 2-3

// Core utilities
export { cn, formatDate } from "./utils";

// UI helpers
export { leaveTypeLabel } from "./ui/ui";
export { getStatusColors } from "./ui/status-colors";

// Workflow/RBAC
export {
  canPerformAction,
  isFinalApprover,
  getNextRoleInChain,
  WORKFLOW_CHAINS,
} from "./workflow";
export type { AppRole } from "./rbac";

// Toast messages
export { SUCCESS_MESSAGES, getToastMessage } from "./ui/toast-messages";

// URL/Filter utilities
export { useFilterFromUrl } from "./ui/url-filters";

// User context hook
export { useUser } from "@/components/providers/UserContext";

// Common hooks re-exported for convenience
export { useDebounce } from "@/hooks/useDebounce";

// Hooks moved to @/hooks and @/components/providers

// Note: Import these directly when needed (less commonly used):
// - ui/animations.ts - Animation variants
// - leaves/working-days.ts - Date calculations
// - leaves/leave-days.ts - Leave calculations
// - navigation.ts - Navigation config
// - auth.ts - Auth functions
// - policy.ts - Policy logic
// - session.ts - Session management
// - storage.ts - File storage
// - exportUtils.ts - Export functions
// - apiClient.ts - API client
