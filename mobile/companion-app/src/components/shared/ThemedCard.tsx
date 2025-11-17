import React from "react";
import { Platform, ViewStyle, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { LiquidGlassCard } from "../ios/LiquidGlassCard";
import { Material3Card } from "../android/Material3Card";

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  pressable?: boolean;
  onPress?: () => void;
}

/**
 * Platform-aware Card Component with Micro-interactions
 *
 * - iOS: Liquid Glass frosted glass effect with scale animation
 * - Android: Material 3 Expressive elevated card with ripple
 */
export function ThemedCard({
  children,
  style,
  elevation = 2,
  pressable = false,
  onPress,
}: ThemedCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  // If not pressable, render without animation
  if (!pressable && !onPress) {
    if (Platform.OS === "ios") {
      return <LiquidGlassCard style={style}>{children}</LiquidGlassCard>;
    }

    return (
      <Material3Card style={style} elevation={elevation}>
        {children}
      </Material3Card>
    );
  }

  // iOS with animation
  if (Platform.OS === "ios") {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          <LiquidGlassCard style={style}>{children}</LiquidGlassCard>
        </Pressable>
      </Animated.View>
    );
  }

  // Android with ripple and subtle animation
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      >
        <Material3Card style={style} elevation={elevation}>
          {children}
        </Material3Card>
      </Pressable>
    </Animated.View>
  );
}
