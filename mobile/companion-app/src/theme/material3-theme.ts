import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { material3Colors } from "./colors";

/**
 * Material 3 Expressive Theme for Android
 *
 * Based on Material Design 3 Expressive tokens
 * https://m3.material.io/styles/color/system/overview
 */
export const material3LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...material3Colors.light,
  },
  roundness: 16, // Expressive uses larger corner radius
};

export const material3DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...material3Colors.dark,
  },
  roundness: 16,
};
