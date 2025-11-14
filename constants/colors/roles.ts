/**
 * Role-Based Color Palettes
 *
 * Defines color schemes for each role type.
 * Used by RoleBasedDashboard and role-specific components.
 */

import { Role } from "@prisma/client";

export interface RoleColorPalette {
  /** Primary accent color */
  accent: string;

  /** Soft/muted version of accent */
  accentSoft: string;

  /** Dark mode accent */
  accentDark: string;

  /** Gradient colors (from → via → to) */
  gradient: {
    from: string;
    via: string;
    to: string;
  };

  /** Dark mode gradient */
  gradientDark: {
    from: string;
    via: string;
    to: string;
  };

  /** Background color */
  background: string;

  /** Text color on accent background */
  accentForeground: string;
}

/**
 * Role color definitions
 * Each role has a distinct color for visual identification
 */
export const ROLE_COLORS: Record<Role, RoleColorPalette> = {
  EMPLOYEE: {
    accent: "#6366f1",                    // Indigo 500
    accentSoft: "#eef2ff",                // Indigo 50
    accentDark: "#818cf8",                // Indigo 400
    gradient: {
      from: "#eef2ff",    // Indigo 50
      via: "rgba(99, 102, 241, 0.3)",   // Indigo 500 with opacity
      to: "#ddd6fe",      // Purple 100
    },
    gradientDark: {
      from: "#1e1b4b",    // Indigo 900
      via: "rgba(129, 140, 248, 0.2)", // Indigo 400 with opacity
      to: "#1e1b4b",      // Indigo 900
    },
    background: "rgba(99, 102, 241, 0.1)",
    accentForeground: "#ffffff",
  },

  MANAGER: {
    accent: "#059669",                    // Emerald 600
    accentSoft: "#ecfdf5",                // Emerald 50
    accentDark: "#10b981",                // Emerald 500
    gradient: {
      from: "#ecfdf5",    // Emerald 50
      via: "rgba(5, 150, 105, 0.3)",    // Emerald 600 with opacity
      to: "#d1fae5",      // Teal 100
    },
    gradientDark: {
      from: "#064e3b",    // Emerald 900
      via: "rgba(16, 185, 129, 0.2)",  // Emerald 500 with opacity
      to: "#064e3b",      // Emerald 900
    },
    background: "rgba(5, 150, 105, 0.1)",
    accentForeground: "#ffffff",
  },

  DEPT_HEAD: {
    accent: "#dc2626",                    // Red 600
    accentSoft: "#fef2f2",                // Red 50
    accentDark: "#ef4444",                // Red 500
    gradient: {
      from: "#fef2f2",    // Red 50
      via: "rgba(220, 38, 38, 0.3)",    // Red 600 with opacity
      to: "#fee2e2",      // Red 100
    },
    gradientDark: {
      from: "#7f1d1d",    // Red 900
      via: "rgba(239, 68, 68, 0.2)",   // Red 500 with opacity
      to: "#7f1d1d",      // Red 900
    },
    background: "rgba(220, 38, 38, 0.1)",
    accentForeground: "#ffffff",
  },

  HR_ADMIN: {
    accent: "#7c3aed",                    // Violet 600
    accentSoft: "#f3f4f6",                // Gray 100
    accentDark: "#a78bfa",                // Violet 400
    gradient: {
      from: "#f3f4f6",    // Gray 100
      via: "rgba(124, 58, 237, 0.3)",   // Violet 600 with opacity
      to: "#e9d5ff",      // Violet 100
    },
    gradientDark: {
      from: "#4c1d95",    // Violet 900
      via: "rgba(167, 139, 250, 0.2)",  // Violet 400 with opacity
      to: "#4c1d95",      // Violet 900
    },
    background: "rgba(124, 58, 237, 0.1)",
    accentForeground: "#ffffff",
  },

  HR_HEAD: {
    accent: "#ea580c",                    // Orange 600
    accentSoft: "#fff7ed",                // Orange 50
    accentDark: "#fb923c",                // Orange 400
    gradient: {
      from: "#fff7ed",    // Orange 50
      via: "rgba(234, 88, 12, 0.3)",    // Orange 600 with opacity
      to: "#fed7aa",      // Orange 100
    },
    gradientDark: {
      from: "#5a2104",    // Orange 900
      via: "rgba(251, 146, 60, 0.2)",  // Orange 400 with opacity
      to: "#5a2104",      // Orange 900
    },
    background: "rgba(234, 88, 12, 0.1)",
    accentForeground: "#ffffff",
  },

  CEO: {
    accent: "#1f2937",                    // Gray 800
    accentSoft: "#f9fafb",                // Gray 50
    accentDark: "#6b7280",                // Gray 500
    gradient: {
      from: "#f9fafb",    // Gray 50
      via: "rgba(31, 41, 55, 0.3)",    // Gray 800 with opacity
      to: "#f3f4f6",      // Gray 100
    },
    gradientDark: {
      from: "#111827",    // Gray 900
      via: "rgba(107, 114, 128, 0.2)", // Gray 500 with opacity
      to: "#111827",      // Gray 900
    },
    background: "rgba(31, 41, 55, 0.1)",
    accentForeground: "#ffffff",
  },

  SYSTEM_ADMIN: {
    accent: "#0891b2",                    // Cyan 600
    accentSoft: "#ecfeff",                // Cyan 50
    accentDark: "#06b6d4",                // Cyan 500
    gradient: {
      from: "#ecfeff",    // Cyan 50
      via: "rgba(8, 145, 178, 0.3)",   // Cyan 600 with opacity
      to: "#cffafe",      // Cyan 100
    },
    gradientDark: {
      from: "#082f49",    // Cyan 900
      via: "rgba(6, 182, 212, 0.2)",  // Cyan 500 with opacity
      to: "#082f49",      // Cyan 900
    },
    background: "rgba(8, 145, 178, 0.1)",
    accentForeground: "#ffffff",
  },
} as const;

/**
 * Get role color palette
 * @param role - User role
 * @returns Color palette for role
 *
 * @example
 * ```tsx
 * const colors = getRoleColors('EMPLOYEE');
 * console.log(colors.accent); // "#6366f1"
 * ```
 */
export function getRoleColors(role: Role): RoleColorPalette {
  return ROLE_COLORS[role];
}

/**
 * Get role accent color
 * @param role - User role
 * @returns Accent color hex value
 */
export function getRoleAccentColor(role: Role): string {
  return ROLE_COLORS[role].accent;
}

/**
 * Get role soft/muted color
 * @param role - User role
 * @returns Soft accent color hex value
 */
export function getRoleSoftColor(role: Role): string {
  return ROLE_COLORS[role].accentSoft;
}

/**
 * Get role gradient for backgrounds
 * @param role - User role
 * @param isDark - Whether to get dark mode gradient
 * @returns Gradient object with from/via/to colors
 */
export function getRoleGradient(
  role: Role,
  isDark: boolean = false
): RoleColorPalette["gradient"] {
  const colors = ROLE_COLORS[role];
  return isDark ? colors.gradientDark : colors.gradient;
}

/**
 * Create Tailwind gradient class string
 * @param role - User role
 * @param isDark - Whether dark mode
 * @returns Tailwind class string
 *
 * @example
 * ```tsx
 * const gradientClass = getRoleGradientClass('EMPLOYEE');
 * // "bg-gradient-to-br from-indigo-50 via-indigo-500/30 to-purple-100"
 * ```
 */
export function getRoleGradientClass(
  role: Role,
  isDark: boolean = false
): string {
  const gradient = getRoleGradient(role, isDark);
  return `from-[${gradient.from}] via-[${gradient.via}] to-[${gradient.to}]`;
}

/**
 * Get all role colors as object
 * Useful for documentation or debugging
 */
export function getAllRoleColors(): Record<Role, string> {
  return Object.entries(ROLE_COLORS).reduce((acc, [role, palette]) => {
    acc[role as Role] = palette.accent;
    return acc;
  }, {} as Record<Role, string>);
}
