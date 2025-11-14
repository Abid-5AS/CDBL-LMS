/**
 * Color System Type Definitions
 *
 * Shared types used across color utilities
 */

import { Role } from "@prisma/client";

/**
 * Color scheme variant
 */
export type ColorScheme = "light" | "dark" | "auto";

/**
 * Role-specific color configuration
 */
export interface RoleColorConfig {
  role: Role;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Theme mode
 */
export type ThemeMode = "light" | "dark";

/**
 * Color system configuration
 */
export interface ColorConfig {
  /** Current theme mode */
  mode: ThemeMode;

  /** Color scheme preference */
  scheme: ColorScheme;

  /** Whether system dark mode is enabled */
  systemDark: boolean;

  /** Custom color overrides */
  customColors?: Record<string, string>;
}

/**
 * Color validation result
 */
export interface ColorValidationResult {
  valid: boolean;
  format: "hex" | "rgb" | "hsl" | "invalid";
  message?: string;
}
