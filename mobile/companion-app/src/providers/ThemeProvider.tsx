import React, { createContext, useContext, useState } from "react";
import { useColorScheme, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  material3LightTheme,
  material3DarkTheme,
} from "../theme/material3-theme";
import { getThemeColors } from "../theme/colors";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ReturnType<typeof getThemeColors>;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const isDark =
    mode === "system" ? systemColorScheme === "dark" : mode === "dark";

  const colors = getThemeColors(isDark);

  // Material 3 theme for Android (react-native-paper)
  const paperTheme = {
    ...(isDark ? material3DarkTheme : material3LightTheme),
    // Configure to use @expo/vector-icons instead of deprecated react-native-vector-icons
    settings: {
      icon: (props: any) => <MaterialCommunityIcons {...props} />,
    },
  };

  const value = {
    mode,
    isDark,
    colors,
    setMode,
  };

  // On Android, wrap with PaperProvider for Material 3
  if (Platform.OS === "android") {
    return (
      <ThemeContext.Provider value={value}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </ThemeContext.Provider>
    );
  }

  // On iOS, just provide theme context (Liquid Glass uses native components)
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
