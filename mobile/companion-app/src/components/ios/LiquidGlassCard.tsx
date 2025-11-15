import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

// Import @expo/ui components for true iOS 26 Liquid Glass
// Note: These are SwiftUI-backed and work best in development builds
let LiquidGlassCard: any = null;
let LiquidGlassBackground: any = null;

try {
  const expoUI = require('@expo/ui');
  LiquidGlassCard = expoUI.LiquidGlassCard;
  LiquidGlassBackground = expoUI.LiquidGlassBackground;
} catch (e) {
  console.log('[@expo/ui] Not available, falling back to expo-blur');
}

// Fallback to expo-blur if @expo/ui is not available
import { BlurView } from "expo-blur";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  materialColor?: 'systemChromeMaterial' | 'systemMaterial' | 'systemThickMaterial' | 'systemThinMaterial' | 'systemUltraThinMaterial';
}

/**
 * iOS Liquid Glass Card Component
 *
 * Uses @expo/ui for true iOS 26 Liquid Glass with SwiftUI backing
 * Falls back to expo-blur for Expo Go and when @expo/ui is unavailable
 *
 * For best results, use a development build with @expo/ui enabled
 */
export function LiquidGlassCardComponent({
  children,
  style,
  intensity = 80,
  materialColor = 'systemThickMaterial',
}: LiquidGlassCardProps) {
  const { isDark } = useTheme();

  // iOS with @expo/ui - True Liquid Glass
  if (Platform.OS === "ios" && LiquidGlassCard && LiquidGlassBackground) {
    return (
      <LiquidGlassBackground
        materialColor={materialColor}
        vibrancyMode={isDark ? 'prominent' : 'label'}
        style={[styles.container, style]}
      >
        <LiquidGlassCard
          materialColor={materialColor}
          style={styles.glassCard}
        >
          <View style={styles.content}>
            {children}
          </View>
        </LiquidGlassCard>
      </LiquidGlassBackground>
    );
  }

  // iOS fallback with expo-blur
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

  // Android fallback - Material Design
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
  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
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

// Export with original name for compatibility
export { LiquidGlassCardComponent as LiquidGlassCard };
