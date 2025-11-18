import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, radius, typography } from '../../theme/designTokens';

interface LoadingButtonProps {
  children: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function LoadingButton({
  children,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}: LoadingButtonProps) {
  const { colors } = useTheme();

  const containerStyle = [
    styles.base,
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && { backgroundColor: colors.surfaceVariant },
    variant === 'outline' && { borderColor: colors.primary, borderWidth: 1.5 },
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'outline'
      ? colors.primary
      : colors.onSurface;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, { color: textColor }]}>
        {isLoading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: radius.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: typography.body.fontSize + 1,
    fontWeight: typography.heading.fontWeight,
  },
  disabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: spacing.sm,
  },
});
