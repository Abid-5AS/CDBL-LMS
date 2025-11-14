/**
 * Status Color Constants
 *
 * Defines colors for different states and statuses.
 * Used for badges, status indicators, and state-based coloring.
 */

export enum StatusType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  PENDING = "pending",
  NEUTRAL = "neutral",
}

export interface StatusColorScheme {
  /** Color for light mode */
  light: string;

  /** Color for dark mode */
  dark: string;

  /** Background color for light mode */
  bgLight: string;

  /** Background color for dark mode */
  bgDark: string;

  /** Text/foreground color */
  foreground: string;

  /** Border color */
  border: string;
}

/**
 * Status color definitions
 * Used for displaying different states and statuses
 */
export const STATUS_COLORS: Record<StatusType, StatusColorScheme> = {
  [StatusType.SUCCESS]: {
    light: "#10b981",           // Emerald 500
    dark: "#34d399",            // Emerald 400
    bgLight: "rgba(16, 185, 129, 0.1)",
    bgDark: "rgba(52, 211, 153, 0.15)",
    foreground: "#047857",      // Emerald 700
    border: "#6ee7b7",          // Emerald 300
  },

  [StatusType.ERROR]: {
    light: "#ef4444",           // Red 500
    dark: "#f87171",            // Red 400
    bgLight: "rgba(239, 68, 68, 0.1)",
    bgDark: "rgba(248, 113, 113, 0.15)",
    foreground: "#dc2626",      // Red 600
    border: "#fca5a5",          // Red 300
  },

  [StatusType.WARNING]: {
    light: "#f59e0b",           // Amber 500
    dark: "#fbbf24",            // Amber 400
    bgLight: "rgba(245, 158, 11, 0.1)",
    bgDark: "rgba(251, 191, 36, 0.15)",
    foreground: "#d97706",      // Amber 600
    border: "#fcd34d",          // Amber 300
  },

  [StatusType.INFO]: {
    light: "#3b82f6",           // Blue 500
    dark: "#60a5fa",            // Blue 400
    bgLight: "rgba(59, 130, 246, 0.1)",
    bgDark: "rgba(96, 165, 250, 0.15)",
    foreground: "#1d4ed8",      // Blue 700
    border: "#93c5fd",          // Blue 300
  },

  [StatusType.PENDING]: {
    light: "#8b5cf6",           // Violet 500
    dark: "#a78bfa",            // Violet 400
    bgLight: "rgba(139, 92, 246, 0.1)",
    bgDark: "rgba(167, 139, 250, 0.15)",
    foreground: "#6d28d9",      // Violet 700
    border: "#d8b4fe",          // Violet 300
  },

  [StatusType.NEUTRAL]: {
    light: "#6b7280",           // Gray 500
    dark: "#9ca3af",            // Gray 400
    bgLight: "rgba(107, 114, 128, 0.1)",
    bgDark: "rgba(156, 163, 175, 0.15)",
    foreground: "#374151",      // Gray 700
    border: "#d1d5db",          // Gray 300
  },
};

/**
 * Leave status colors (specific to leave management)
 */
export const LEAVE_STATUS_COLORS = {
  APPROVED: {
    light: "#10b981",      // Emerald - Positive
    dark: "#34d399",
    text: "#047857",
    bg: "rgba(16, 185, 129, 0.1)",
  },

  REJECTED: {
    light: "#ef4444",      // Red - Negative
    dark: "#f87171",
    text: "#dc2626",
    bg: "rgba(239, 68, 68, 0.1)",
  },

  PENDING: {
    light: "#f59e0b",      // Amber - Awaiting action
    dark: "#fbbf24",
    text: "#d97706",
    bg: "rgba(245, 158, 11, 0.1)",
  },

  RETURNED: {
    light: "#3b82f6",      // Blue - Needs modification
    dark: "#60a5fa",
    text: "#1d4ed8",
    bg: "rgba(59, 130, 246, 0.1)",
  },

  ON_LEAVE: {
    light: "#8b5cf6",      // Violet - In progress
    dark: "#a78bfa",
    text: "#6d28d9",
    bg: "rgba(139, 92, 246, 0.1)",
  },

  CANCELLED: {
    light: "#6b7280",      // Gray - Cancelled/Neutral
    dark: "#9ca3af",
    text: "#374151",
    bg: "rgba(107, 114, 128, 0.1)",
  },
} as const;

/**
 * Data visualization colors (for charts and graphs)
 */
export const DATA_VIZ_COLORS = {
  // Primary data series
  primary: [
    "#3b82f6",    // Blue 500
    "#8b5cf6",    // Violet 500
    "#ec4899",    // Pink 500
    "#f59e0b",    // Amber 500
    "#10b981",    // Emerald 500
    "#06b6d4",    // Cyan 500
    "#6366f1",    // Indigo 500
  ],

  // Chart backgrounds
  bg: "rgba(0, 0, 0, 0.05)",
  bgDark: "rgba(255, 255, 255, 0.05)",

  // Grid and axis
  grid: "rgba(0, 0, 0, 0.1)",
  gridDark: "rgba(255, 255, 255, 0.1)",

  // Text
  text: "rgba(0, 0, 0, 0.7)",
  textDark: "rgba(255, 255, 255, 0.7)",
} as const;

/**
 * Get status color scheme
 * @param status - Status type
 * @param isDark - Whether dark mode
 * @returns Color value
 *
 * @example
 * ```tsx
 * const successColor = getStatusColor('success', false);
 * // "#10b981"
 * ```
 */
export function getStatusColor(
  status: StatusType,
  isDark: boolean = false
): string {
  const scheme = STATUS_COLORS[status];
  return isDark ? scheme.dark : scheme.light;
}

/**
 * Get status background color
 * @param status - Status type
 * @param isDark - Whether dark mode
 * @returns Background color value
 */
export function getStatusBgColor(
  status: StatusType,
  isDark: boolean = false
): string {
  const scheme = STATUS_COLORS[status];
  return isDark ? scheme.bgDark : scheme.bgLight;
}

/**
 * Get full status color scheme
 * @param status - Status type
 * @returns Full color scheme
 */
export function getStatusColorScheme(status: StatusType): StatusColorScheme {
  return STATUS_COLORS[status];
}

/**
 * Get leave status color
 * @param status - Leave status key
 * @param variant - Color variant (light/dark/text/bg)
 * @returns Color value
 */
export function getLeaveStatusColor(
  status: keyof typeof LEAVE_STATUS_COLORS,
  variant: "light" | "dark" | "text" | "bg" = "light"
): string {
  return (
    LEAVE_STATUS_COLORS[status][variant] ||
    LEAVE_STATUS_COLORS[status]["light"]
  );
}

/**
 * Map leave status to standard status type
 * @param status - Leave status
 * @returns Standard status type
 */
export function mapLeaveStatusToType(
  status: string
): StatusType {
  const statusMap: Record<string, StatusType> = {
    APPROVED: StatusType.SUCCESS,
    REJECTED: StatusType.ERROR,
    PENDING: StatusType.WARNING,
    RETURNED: StatusType.INFO,
    ON_LEAVE: StatusType.PENDING,
    CANCELLED: StatusType.NEUTRAL,
  };

  return statusMap[status] || StatusType.NEUTRAL;
}

/**
 * Get data visualization color by index
 * @param index - Color index
 * @param isDark - Whether dark mode
 * @returns Color value
 */
export function getDataVizColor(index: number, isDark: boolean = false): string {
  const colors = DATA_VIZ_COLORS.primary;
  return colors[index % colors.length];
}
