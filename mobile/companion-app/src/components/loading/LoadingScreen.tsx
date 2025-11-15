import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
}

/**
 * Full Screen Loading Component
 *
 * Displays a centered loading spinner with optional message
 */
export function LoadingScreen({
  message = 'Loading...',
  size = 'large',
}: LoadingScreenProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text
          style={[
            styles.message,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
