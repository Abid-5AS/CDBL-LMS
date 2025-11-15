import { Platform } from "react-native";

/**
 * iOS Liquid Glass Theme Colors
 */
export const liquidGlassColors = {
  light: {
    primary: "#007AFF",
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
  if (Platform.OS === "ios") {
    return isDark ? liquidGlassColors.dark : liquidGlassColors.light;
  } else {
    return isDark ? material3Colors.dark : material3Colors.light;
  }
};
