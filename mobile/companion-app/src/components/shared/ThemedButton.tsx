import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Button as PaperButton } from "react-native-paper";
import { useTheme } from "../../providers/ThemeProvider";

interface ThemedButtonProps {
  children: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * Platform-aware Button Component
 *
 * - iOS: Custom button with SF Symbols style
 * - Android: Material 3 Button from react-native-paper
 */
export function ThemedButton({
  children,
  onPress,
  variant = "primary",
  style,
  disabled = false,
}: ThemedButtonProps) {
  const { colors, isDark } = useTheme();

  if (Platform.OS === "android") {
    const mode =
      variant === "outline"
        ? "outlined"
        : variant === "secondary"
        ? "elevated"
        : "contained";

    return (
      <PaperButton
        mode={mode}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </PaperButton>
    );
  }

  // iOS: Custom Liquid Glass button
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    };

    if (variant === "primary") {
      return {
        ...baseStyle,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      };
    }

    if (variant === "secondary") {
      return {
        ...baseStyle,
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(0, 0, 0, 0.05)",
      };
    }

    // outline
    return {
      ...baseStyle,
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.primary,
    };
  };

  const getTextStyle = (): TextStyle => {
    if (variant === "outline") {
      return { color: colors.primary };
    }
    if (variant === "primary") {
      return { color: "#FFFFFF" };
    }
    // secondary variant
    return {
      color:
        "text" in colors
          ? colors.text
          : "onSurface" in colors
          ? colors.onSurface
          : "#000000",
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, getTextStyle()]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
