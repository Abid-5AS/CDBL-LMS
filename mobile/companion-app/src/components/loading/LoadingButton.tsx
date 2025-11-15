import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface LoadingButtonProps {
  children: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

/**
 * Button with Loading State
 *
 * Shows a spinner when loading, prevents double-clicks
 */
export function LoadingButton({
  children,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}: LoadingButtonProps) {
  const { colors, isDark } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyle,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.05)',
      };
    }

    // outline
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'outline') {
      return colors.primary;
    }
    if (variant === 'primary') {
      return '#FFFFFF';
    }
    return 'text' in colors ? colors.text : colors.onSurface;
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, { color: getTextColor() }]}>
        {isLoading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: 8,
  },
});
