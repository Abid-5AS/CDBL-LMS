import React from "react";
import { ViewStyle, Platform } from "react-native";
import {
  Host,
  Form,
  Section,
  Text,
  Button as SwiftUIButton,
  Toggle,
} from "@expo/ui/swift-ui";
import { padding } from "@expo/ui/swift-ui/modifiers";

interface LiquidGlassFormProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * iOS Settings-style Form with Liquid Glass effect
 *
 * Uses SwiftUI Form and Section components for authentic iOS appearance
 * Automatically handles layout, spacing, and platform-correct styling
 *
 * Example from: https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui
 */
export function LiquidGlassForm({ children, style }: LiquidGlassFormProps) {
  if (Platform.OS === "ios") {
    return (
      <Host style={[{ flex: 1 }, style]}>
        <Form>{children}</Form>
      </Host>
    );
  }

  return null;
}

interface LiquidGlassFormSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Form Section with automatic Liquid Glass styling
 */
export function LiquidGlassFormSection({
  title,
  children,
}: LiquidGlassFormSectionProps) {
  if (Platform.OS === "ios") {
    return <Section title={title}>{children}</Section>;
  }

  return null;
}

// Re-export SwiftUI components for convenience
export { Text as FormText, Toggle as FormToggle } from "@expo/ui/swift-ui";
export const FormButton = SwiftUIButton;
