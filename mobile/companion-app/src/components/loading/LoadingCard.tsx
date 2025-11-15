import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface LoadingCardProps {
  style?: ViewStyle;
  height?: number;
}

/**
 * Loading Card Skeleton
 *
 * Displays a pulsing skeleton card for loading states
 */
export function LoadingCard({ style, height = 100 }: LoadingCardProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          height,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}
    >
      <View style={styles.skeletonContainer}>
        <View
          style={[
            styles.skeletonLine,
            styles.skeletonTitle,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            styles.skeletonText,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            styles.skeletonText,
            {
              width: '60%',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    width: '70%',
  },
  skeletonText: {
    height: 14,
    width: '100%',
  },
});
