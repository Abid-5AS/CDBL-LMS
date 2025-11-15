import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../providers/ThemeProvider";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

/**
 * iOS Liquid Glass Card Component
 *
 * Uses expo-blur for beautiful frosted glass effect
 * Works in Expo Go and development builds
 *
 * For true iOS 26 Liquid Glass with SwiftUI, use a development build
 * and enable @expo/ui components in the code
 */
export function LiquidGlassCard({
  children,
  style,
  intensity = 80,
}: LiquidGlassCardProps) {
  const { isDark } = useTheme();

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? "dark" : "light"}
          style={styles.blurContainer}
        >
          <View style={[styles.content, isDark && styles.contentDark]}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  // Android fallback
  return (
    <View
      style={[
        styles.androidCard,
        style,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  blurContainer: {
    overflow: "hidden",
    borderRadius: 20,
  },
  content: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  contentDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  androidCard: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
