import React from "react";
import { ViewStyle, Platform } from "react-native";
import { Host, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  glassEffect,
  padding,
  cornerRadius,
  foregroundStyle,
  font,
  fontWeight,
} from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "../../providers/ThemeProvider";

interface LiquidGlassTextProps {
  children: string;
  style?: ViewStyle;
  variant?: "regular" | "thin" | "thick" | "ultraThin";
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold";
}

/**
 * iOS Liquid Glass Text Component
 *
 * Text with optional Liquid Glass background effect
 * Uses SwiftUI primitives for authentic iOS 26 design
 */
export function LiquidGlassText({
  children,
  style,
  variant,
  size = 17,
  weight = "regular",
}: LiquidGlassTextProps) {
  const { colors } = useTheme();

  const modifiers = [
    padding({ all: 12 }),
    font({ size }),
    fontWeight(weight),
    foregroundStyle({ color: "text" in colors ? colors.text : "#000000" }),
  ];

  // Add glass effect if variant is specified
  if (variant) {
    modifiers.push(
      cornerRadius(12),
      glassEffect({
        glass: {
          variant: variant,
        },
      })
    );
  }

  if (Platform.OS === "ios") {
    return (
      <Host matchContents style={style}>
        <SwiftUIText modifiers={modifiers}>{children}</SwiftUIText>
      </Host>
    );
  }

  return <>{children}</>;
}
