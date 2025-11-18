import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  material3LightTheme,
  material3DarkTheme,
} from "../theme/material3-theme";
import { getThemeColors } from "../theme/colors";

// AsyncStorage will be loaded dynamically to avoid initialization errors
let AsyncStorage: any = null;

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ReturnType<typeof getThemeColors>;
  setMode: (mode: ThemeMode) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "app_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Dynamically load AsyncStorage if not already loaded
        if (!AsyncStorage) {
          try {
            const module = await import("@react-native-async-storage/async-storage");
            AsyncStorage = module.default;
          } catch {
            // AsyncStorage not available
          }
        }

        // AsyncStorage might not be available in some environments (fallback gracefully)
        if (AsyncStorage && AsyncStorage.getItem) {
          const savedMode = await AsyncStorage.getItem(THEME_KEY);
          if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
            setModeState(savedMode as ThemeMode);
          }
        }
      } catch (error) {
        console.warn("AsyncStorage not available, using default theme:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Persist theme preference when changed
  const setMode = async (newMode: ThemeMode) => {
    try {
      // Dynamically load AsyncStorage if not already loaded
      if (!AsyncStorage) {
        try {
          const module = await import("@react-native-async-storage/async-storage");
          AsyncStorage = module.default;
        } catch {
          // AsyncStorage not available
        }
      }

      // AsyncStorage might not be available in some environments (fallback gracefully)
      if (AsyncStorage && AsyncStorage.setItem) {
        await AsyncStorage.setItem(THEME_KEY, newMode);
      }
      setModeState(newMode);
    } catch (error) {
      console.warn("Failed to save theme preference:", error);
      // Still update state even if storage fails
      setModeState(newMode);
    }
  };

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

  const value: ThemeContextType = {
    mode,
    isDark,
    colors,
    setMode,
    isLoading,
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
