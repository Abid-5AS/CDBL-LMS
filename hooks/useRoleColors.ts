/**
 * useRoleColors Hook
 *
 * Get role-specific colors in any component
 */

import { useMemo } from "react";
import { Role } from "@prisma/client";
import {
  getRoleColors,
  getRoleAccentColor,
  getRoleSoftColor,
  getRoleGradient,
  type RoleColorPalette,
} from "@/constants/colors";

interface UseRoleColorsOptions {
  /** User role */
  role: Role;

  /** Whether dark mode is enabled */
  isDark?: boolean;
}

/**
 * Hook to get role-specific colors
 *
 * Returns all role color information for rendering role-aware components.
 *
 * @example
 * ```typescript
 * const { accent, accentSoft, gradient } = useRoleColors({
 *   role: 'EMPLOYEE',
 *   isDark: true
 * });
 *
 * return <div style={{ backgroundColor: accent }}>{content}</div>;
 * ```
 */
export function useRoleColors(options: UseRoleColorsOptions) {
  const { role, isDark = false } = options;

  return useMemo(() => {
    const palette = getRoleColors(role);

    return {
      // Full palette
      palette,

      // Specific colors
      accent: getRoleAccentColor(role),
      accentSoft: getRoleSoftColor(role),
      accentDark: palette.accentDark,
      background: palette.background,
      accentForeground: palette.accentForeground,

      // Gradients
      gradient: getRoleGradient(role, isDark),
      gradientColor: isDark ? palette.gradientDark : palette.gradient,

      // Helper functions
      getAccentColor: () => getRoleAccentColor(role),
      getSoftColor: () => getRoleSoftColor(role),
      getGradient: (dark?: boolean) => getRoleGradient(role, dark ?? isDark),
    };
  }, [role, isDark]);
}
