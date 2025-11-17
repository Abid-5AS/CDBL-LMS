import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Pressable,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, {
        damping: 15,
        stiffness: 400,
      });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  if (Platform.OS === "android") {
    const mode =
      variant === "outline"
        ? "outlined"
        : variant === "secondary"
        ? "elevated"
        : "contained";

    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
        >
          <PaperButton
            mode={mode}
            onPress={() => {}}
            disabled={disabled}
            style={style}
          >
            {children}
          </PaperButton>
        </Pressable>
      </Animated.View>
    );
  }

  // iOS: Custom Liquid Glass button with scale animation
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
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[getButtonStyle(), style, disabled && styles.disabled]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.text, getTextStyle()]}>{children}</Text>
      </Pressable>
    </Animated.View>
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
