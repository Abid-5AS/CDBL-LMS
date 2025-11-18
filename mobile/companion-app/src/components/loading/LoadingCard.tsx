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
          backgroundColor: colors.surfaceVariant,
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
              backgroundColor: colors.surfaceDisabled,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            styles.skeletonText,
            {
              backgroundColor: colors.surfaceDisabled,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            styles.skeletonText,
            {
              width: '60%',
              backgroundColor: colors.surfaceDisabled,
            },
          ]}
        />
      </View>
    </View>
  );
}

import { spacing, radius } from '../../theme/designTokens';

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: spacing.md,
    borderRadius: radius.xs,
    marginBottom: spacing.md,
  },
  skeletonTitle: {
    height: radius.lg,
    width: '70%',
  },
  skeletonText: {
    height: radius.md,
    width: '100%',
  },
});
