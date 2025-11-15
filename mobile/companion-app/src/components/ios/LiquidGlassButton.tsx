import React from "react";
import { ViewStyle, Platform } from "react-native";
import { Host, Button as SwiftUIButton } from "@expo/ui/swift-ui";
import {
  glassEffect,
  padding,
  cornerRadius,
  foregroundStyle,
  font,
  fontWeight,
} from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "../../providers/ThemeProvider";

interface LiquidGlassButtonProps {
  children: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "glass" | "outline";
  disabled?: boolean;
}

/**
 * iOS Liquid Glass Button Component
 *
 * Button with Liquid Glass effect using SwiftUI primitives
 * https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui
 */
export function LiquidGlassButton({
  children,
  onPress,
  style,
  variant = "primary",
  disabled = false,
}: LiquidGlassButtonProps) {
  const { colors } = useTheme();

  const getModifiers = () => {
    const baseModifiers = [
      padding({ horizontal: 24, vertical: 14 }),
      cornerRadius(12),
      font({ size: 17 }),
      fontWeight("semibold"),
    ];

    if (variant === "primary") {
      return [
        ...baseModifiers,
        foregroundStyle({ color: "#FFFFFF" }),
        glassEffect({
          glass: {
            variant: "regular",
          },
          tint: colors.primary,
        }),
      ];
    }

    if (variant === "glass") {
      return [
        ...baseModifiers,
        foregroundStyle({ color: "text" in colors ? colors.text : "#000000" }),
        glassEffect({
          glass: {
            variant: "thin",
          },
        }),
      ];
    }

    // outline
    return [...baseModifiers, foregroundStyle({ color: colors.primary })];
  };

  if (Platform.OS === "ios") {
    return (
      <Host matchContents style={style}>
        <SwiftUIButton
          onPress={onPress}
          disabled={disabled}
          modifiers={getModifiers()}
        >
          {children}
        </SwiftUIButton>
      </Host>
    );
  }

  return null;
}
