/**
 * Semantic Color Constants
 *
 * Defines colors by their semantic meaning (purpose) rather than specific values.
 * Maps to CSS custom properties for easy theme switching.
 */

/**
 * Semantic color names - Used for all color references in components
 * These don't change between light and dark modes - the CSS variables do
 */
export const SEMANTIC_COLORS = {
  // Primary brand color - Main action, primary buttons, links
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",

  // Secondary color - Supporting actions, secondary buttons
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",

  // Accent color - Highlights, important elements
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",

  // Destructive - Delete, dangerous actions
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",

  // Muted - Disabled state, secondary content
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",

  // Text colors
  foreground: "hsl(var(--foreground))",
  background: "hsl(var(--background))",

  // UI elements
  card: "hsl(var(--card))",
  cardForeground: "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  popoverForeground: "hsl(var(--popover-foreground))",

  // Borders and dividers
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",

  // Ring for focus states
  ring: "hsl(var(--ring))",
} as const;

/**
 * Functional colors - Semantic colors for specific use cases
 */
export const FUNCTIONAL_COLORS = {
  // Success - Positive actions, completed state
  success: {
    light: "#10b981", // Emerald 500
    dark: "#34d399",  // Emerald 400
    bg: "hsl(141, 71%, 85%)", // Light background
    bgDark: "hsl(141, 71%, 25%)", // Dark background
  },

  // Error/Destructive - Failed actions, errors, deletions
  error: {
    light: "#ef4444", // Red 500
    dark: "#f87171",  // Red 400
    bg: "hsl(0, 84%, 85%)",  // Light background
    bgDark: "hsl(0, 84%, 25%)", // Dark background
  },

  // Warning - Caution, alerts, attention needed
  warning: {
    light: "#f59e0b", // Amber 500
    dark: "#fbbf24",  // Amber 400
    bg: "hsl(38, 92%, 85%)",  // Light background
    bgDark: "hsl(38, 92%, 25%)", // Dark background
  },

  // Info - Informational, help text, notices
  info: {
    light: "#3b82f6", // Blue 500
    dark: "#60a5fa",  // Blue 400
    bg: "hsl(217, 97%, 85%)",  // Light background
    bgDark: "hsl(217, 97%, 25%)", // Dark background
  },

  // Pending - In progress, awaiting action
  pending: {
    light: "#8b5cf6", // Violet 500
    dark: "#a78bfa",  // Violet 400
    bg: "hsl(259, 90%, 85%)",  // Light background
    bgDark: "hsl(259, 90%, 25%)", // Dark background
  },
} as const;

/**
 * Neutral colors - Backgrounds, text, subtle elements
 */
export const NEUTRAL_COLORS = {
  // Grays for backgrounds and text
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Text colors with proper contrast
  text: {
    primary: "hsl(var(--foreground))",
    secondary: "hsl(var(--muted-foreground))",
    muted: "hsl(var(--muted-foreground))",
    inverse: "hsl(var(--background))",
  },

  // Background colors
  bg: {
    primary: "hsl(var(--background))",
    secondary: "hsl(var(--muted))",
    tertiary: "hsl(var(--card))",
    inverse: "hsl(var(--foreground))",
  },
} as const;

/**
 * Component-specific colors
 */
export const COMPONENT_COLORS = {
  // Button colors
  button: {
    primary: "hsl(var(--primary))",
    primaryHover: "hsl(var(--primary) / 0.9)",
    secondary: "hsl(var(--secondary))",
    secondaryHover: "hsl(var(--secondary) / 0.9)",
    ghost: "transparent",
    ghostHover: "hsl(var(--primary) / 0.1)",
  },

  // Input/Form colors
  input: {
    bg: "hsl(var(--input))",
    border: "hsl(var(--border))",
    borderFocus: "hsl(var(--primary))",
    disabled: "hsl(var(--muted))",
    error: "hsl(0, 84%, 45%)", // Error red
  },

  // Card colors
  card: {
    bg: "hsl(var(--card))",
    border: "hsl(var(--border))",
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowDark: "rgba(0, 0, 0, 0.3)",
  },

  // Badge colors
  badge: {
    primary: "hsl(var(--primary) / 0.1)",
    primaryText: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary) / 0.1)",
    secondaryText: "hsl(var(--secondary))",
  },

  // Link colors
  link: {
    default: "hsl(var(--primary))",
    hover: "hsl(var(--primary) / 0.8)",
    visited: "hsl(259, 90%, 45%)", // Violet
    active: "hsl(var(--primary) / 0.9)",
  },
} as const;

/**
 * Interactive state colors
 */
export const INTERACTIVE_COLORS = {
  hover: {
    light: "rgba(0, 0, 0, 0.05)",
    dark: "rgba(255, 255, 255, 0.05)",
  },

  active: {
    light: "rgba(0, 0, 0, 0.1)",
    dark: "rgba(255, 255, 255, 0.1)",
  },

  disabled: {
    light: "rgba(0, 0, 0, 0.3)",
    dark: "rgba(255, 255, 255, 0.3)",
  },

  focus: {
    ring: "hsl(var(--ring))",
    ringOffset: "hsl(var(--background))",
  },
} as const;

/**
 * Animation/transition colors for visual feedback
 */
export const ANIMATION_COLORS = {
  loading: {
    shimmer: "rgba(255, 255, 255, 0.2)",
    skeleton: "rgba(0, 0, 0, 0.1)",
  },

  transition: {
    duration: "200ms",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;

/**
 * Get CSS custom property name for a semantic color
 * @param color - Semantic color name
 * @returns CSS custom property value
 *
 * @example
 * ```tsx
 * const color = getCSSVariable('primary'); // "hsl(var(--primary))"
 * ```
 */
export function getCSSVariable(color: keyof typeof SEMANTIC_COLORS): string {
  return SEMANTIC_COLORS[color];
}

/**
 * Get color from functional category
 * @param category - Functional color category
 * @param variant - Color variant (light/dark/bg/bgDark)
 * @returns Color value
 *
 * @example
 * ```tsx
 * const successColor = getFunctionalColor('success', 'light');
 * ```
 */
export function getFunctionalColor(
  category: keyof typeof FUNCTIONAL_COLORS,
  variant: keyof (typeof FUNCTIONAL_COLORS)[keyof typeof FUNCTIONAL_COLORS] = "light"
): string {
  return (FUNCTIONAL_COLORS[category] as Record<string, string>)[variant];
}
