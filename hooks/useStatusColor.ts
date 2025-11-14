/**
 * useStatusColor Hook
 *
 * Get colors for different status types
 */

import { useMemo } from "react";
import {
  StatusType,
  getStatusColor,
  getStatusBgColor,
  getStatusColorScheme,
  getLeaveStatusColor,
  mapLeaveStatusToType,
  type StatusColorScheme,
} from "@/constants/colors";

interface UseStatusColorOptions {
  /** Status type or leave status */
  status: StatusType | string;

  /** Whether dark mode */
  isDark?: boolean;

  /** Whether this is a leave-specific status */
  isLeaveStatus?: boolean;
}

/**
 * Hook to get status-based colors
 *
 * Returns color information for displaying status indicators.
 *
 * @example
 * ```typescript
 * const { color, bgColor, scheme } = useStatusColor({
 *   status: 'APPROVED',
 *   isLeaveStatus: true
 * });

 * return (
 *   <div style={{ color, backgroundColor: bgColor }}>
 *     Approved
 *   </div>
 * );
 * ```
 */
export function useStatusColor(options: UseStatusColorOptions) {
  const { status, isDark = false, isLeaveStatus = false } = options;

  return useMemo(() => {
    let statusType: StatusType;
    let color: string;
    let bgColor: string;
    let scheme: StatusColorScheme | null = null;

    if (isLeaveStatus) {
      // Map leave status to standard status type
      statusType = mapLeaveStatusToType(status);
      color = getLeaveStatusColor(status as keyof import("@/constants/colors").typeof import("@/constants/colors").LEAVE_STATUS_COLORS, isDark ? "dark" : "light");
      bgColor = getLeaveStatusColor(status as any, "bg");
    } else {
      statusType = status as StatusType;
      color = getStatusColor(statusType, isDark);
      bgColor = getStatusBgColor(statusType, isDark);
      scheme = getStatusColorScheme(statusType);
    }

    return {
      statusType,
      color,
      bgColor,
      scheme,

      // Helper methods
      getColor: (dark?: boolean) =>
        isLeaveStatus
          ? getLeaveStatusColor(status as any, dark ? "dark" : "light")
          : getStatusColor(statusType, dark ?? isDark),

      getBgColor: (dark?: boolean) =>
        isLeaveStatus
          ? getLeaveStatusColor(status as any, "bg")
          : getStatusBgColor(statusType, dark ?? isDark),
    };
  }, [status, isDark, isLeaveStatus]);
}
