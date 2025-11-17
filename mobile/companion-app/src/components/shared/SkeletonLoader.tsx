import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton Loader Component
 *
 * Animated shimmer effect for loading states
 * Uses react-native-reanimated for smooth 60fps animations
 */
export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const { isDark } = useTheme();
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Skeleton Card Loader
 * Pre-configured skeleton for card layouts
 */
export function SkeletonCard() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <SkeletonLoader width={60} height={60} borderRadius={30} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="50%" height={14} />
        </View>
      </View>

      {/* Content Lines */}
      <View style={styles.cardContent}>
        <SkeletonLoader width="100%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="80%" height={14} />
      </View>

      {/* Footer Buttons */}
      <View style={styles.cardFooter}>
        <SkeletonLoader width="48%" height={40} borderRadius={12} />
        <SkeletonLoader width="48%" height={40} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardContent: {
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
