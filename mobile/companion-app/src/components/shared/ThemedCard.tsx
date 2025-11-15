import React from "react";
import { Platform, ViewStyle } from "react-native";
import { LiquidGlassCard } from "../ios/LiquidGlassCard";
import { Material3Card } from "../android/Material3Card";

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
}

/**
 * Platform-aware Card Component
 *
 * - iOS: Liquid Glass frosted glass effect
 * - Android: Material 3 Expressive elevated card
 */
export function ThemedCard({
  children,
  style,
  elevation = 2,
}: ThemedCardProps) {
  if (Platform.OS === "ios") {
    return <LiquidGlassCard style={style}>{children}</LiquidGlassCard>;
  }

  return (
    <Material3Card style={style} elevation={elevation}>
      {children}
    </Material3Card>
  );
}
