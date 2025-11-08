// Barrel export for lib utilities
// This allows: import { cn, formatDate, leaveTypeLabel } from "@/lib"
// Reduces import lines from 15-20 down to 2-3

// Core utilities
export { cn, formatDate } from "./utils";

// UI helpers
export { leaveTypeLabel } from "./ui";
export { getStatusColors } from "./status-colors";

// Workflow/RBAC
export {
  canPerformAction,
  isFinalApprover,
  getNextRoleInChain,
  WORKFLOW_CHAINS,
} from "./workflow";
export type { AppRole } from "./rbac";

// Toast messages
export { SUCCESS_MESSAGES, getToastMessage } from "./toast-messages";

// URL/Filter utilities
export { useFilterFromUrl } from "./url-filters";

// Hooks
export { useDebounce } from "./use-debounce";
export { useUser } from "./user-context";

// Note: Import these directly when needed (less commonly used):
// - animations.ts - Animation variants
// - working-days.ts - Date calculations
// - leave-days.ts - Leave calculations
// - role-ui.ts - Role display helpers
// - navigation.ts - Navigation config
// - auth.ts, auth-jwt.ts - Auth functions
// - policy.ts - Policy logic
// - session.ts - Session management
// - storage.ts - File storage
// - exportUtils.ts - Export functions
// - apiClient.ts - API client
