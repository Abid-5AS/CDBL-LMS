import { Platform } from "react-native";

/**
 * iOS Liquid Glass Theme Colors
 */
export const liquidGlassColors = {
  light: {
    primary: "#007AFF",
    onPrimary: "#FFFFFF",
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceVariant: "#E5E5EA",
    text: "#000000",
    textSecondary: "#8E8E93",
    textTertiary: "#C7C7CC",
    border: "#C6C6C8",
    accent: "#5856D6",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    info: "#5AC8FA",
  },
  dark: {
    primary: "#0A84FF",
    onPrimary: "#FFFFFF",
    background: "#000000",
    surface: "#1C1C1E",
    surfaceVariant: "#2C2C2E",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    textTertiary: "#48484A",
    border: "#38383A",
    accent: "#5E5CE6",
    success: "#32D74B",
    warning: "#FF9F0A",
    error: "#FF453A",
    info: "#64D2FF",
  },
};

/**
 * Material 3 Expressive Theme Colors (Android)
 */
export const material3Colors = {
  light: {
    primary: "#6750A4",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EADDFF",
    onPrimaryContainer: "#21005E",
    secondary: "#625B71",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E8DEF8",
    onSecondaryContainer: "#1E192B",
    tertiary: "#7D5260",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#FFD8E4",
    onTertiaryContainer: "#370B1E",
    error: "#B3261E",
    onError: "#FFFFFF",
    errorContainer: "#F9DEDC",
    onErrorContainer: "#410E0B",
    background: "#FFFBFE",
    onBackground: "#1C1B1F",
    surface: "#FFFBFE",
    onSurface: "#1C1B1F",
    surfaceVariant: "#E7E0EC",
    onSurfaceVariant: "#49454F",
    outline: "#79747E",
    outlineVariant: "#CAC4D0",
    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#313033",
    inverseOnSurface: "#F4EFF4",
    inversePrimary: "#D0BCFF",
  },
  dark: {
    primary: "#D0BCFF",
    onPrimary: "#381E72",
    primaryContainer: "#4F378B",
    onPrimaryContainer: "#EADDFF",
    secondary: "#CCC2DC",
    onSecondary: "#332D41",
    secondaryContainer: "#4A4458",
    onSecondaryContainer: "#E8DEF8",
    tertiary: "#EFB8C8",
    onTertiary: "#492532",
    tertiaryContainer: "#633B48",
    onTertiaryContainer: "#FFD8E4",
    error: "#F2B8B5",
    onError: "#601410",
    errorContainer: "#8C1D18",
    onErrorContainer: "#F9DEDC",
    background: "#1C1B1F",
    onBackground: "#E6E1E5",
    surface: "#1C1B1F",
    onSurface: "#E6E1E5",
    surfaceVariant: "#49454F",
    onSurfaceVariant: "#CAC4D0",
    outline: "#938F99",
    outlineVariant: "#49454F",
    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#E6E1E5",
    inverseOnSurface: "#1C1B1F",
    inversePrimary: "#6750A4",
  },
};

/**
 * Get platform-specific colors
 */
export const getThemeColors = (isDark: boolean) => {
  const isIOS = Platform.OS === "ios";

  // Get base colors based on platform
  const baseColors = isIOS
    ? (isDark ? liquidGlassColors.dark : liquidGlassColors.light)
    : (isDark ? material3Colors.dark : material3Colors.light);

  // Merge with missing properties to ensure compatibility
  // This ensures that components can access colors regardless of platform
  const mergedColors = {
    ...baseColors,
    // Add missing properties for cross-platform compatibility
    onSurface: baseColors.onSurface || baseColors.text,
    onSurfaceVariant: baseColors.onSurfaceVariant || baseColors.textSecondary,
    outline: baseColors.outline || baseColors.border,
    surfaceContainer: baseColors.surfaceContainer || baseColors.surface,
    surfaceContainerLow: baseColors.surfaceContainerLow || baseColors.surface,
    surfaceContainerLowest: baseColors.surfaceContainerLowest || baseColors.background,
    surfaceContainerHighest: baseColors.surfaceContainerHighest || baseColors.surfaceVariant,
    primaryContainer: baseColors.primaryContainer || baseColors.primary,
    onPrimaryContainer: baseColors.onPrimaryContainer || baseColors.onPrimary,
    secondary: baseColors.secondary || baseColors.primary,
    onSecondary: baseColors.onSecondary || baseColors.onPrimary,
    secondaryContainer: baseColors.secondaryContainer || baseColors.surfaceVariant,
    onSecondaryContainer: baseColors.onSecondaryContainer || baseColors.text,
    tertiary: baseColors.tertiary || baseColors.accent,
    onTertiary: baseColors.onTertiary || baseColors.onPrimary,
    tertiaryContainer: baseColors.tertiaryContainer || baseColors.surfaceVariant,
    onTertiaryContainer: baseColors.onTertiaryContainer || baseColors.text,
    errorContainer: baseColors.errorContainer || baseColors.error,
    onError: baseColors.onError || baseColors.onPrimary,
    onErrorContainer: baseColors.onErrorContainer || baseColors.onPrimary,
    onBackground: baseColors.onBackground || baseColors.text,
    inverseSurface: baseColors.inverseSurface || baseColors.surfaceVariant,
    inverseOnSurface: baseColors.inverseOnSurface || baseColors.text,
    inversePrimary: baseColors.inversePrimary || baseColors.primary,
    outlineVariant: baseColors.outlineVariant || baseColors.border,
    scrim: baseColors.scrim || baseColors.background,
    // Add missing success, warning, info properties for Material 3 when on iOS
    success: baseColors.success || "#34C759",
    warning: baseColors.warning || "#FF9500",
    info: baseColors.info || "#5AC8FA",
    successContainer: baseColors.successContainer || "#E6F4EA",
    onSuccess: baseColors.onSuccess || "#FFFFFF",
    onSuccessContainer: baseColors.onSuccessContainer || "#0D652D",
    warningContainer: baseColors.warningContainer || "#FEF7E8",
    onWarning: baseColors.onWarning || "#4B2900",
    onWarningContainer: baseColors.onWarningContainer || "#3C1F00",
    disabled: baseColors.disabled || baseColors.textSecondary,
    textPrimary: baseColors.textPrimary || baseColors.text,
    textSecondary: baseColors.textSecondary || baseColors.text,
    textTertiary: baseColors.textTertiary || baseColors.textSecondary,
    border: baseColors.border || baseColors.outline,
  };

  return mergedColors;
};
