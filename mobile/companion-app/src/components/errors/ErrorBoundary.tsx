import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ThemedButton } from '../shared/ThemedButton';
import { LiquidGlassCard } from '../ios/LiquidGlassCard';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, radius, typography } from '../../theme/designTokens';

function logError(error: Error, info: React.ErrorInfo) {
  // Log error to error reporting service
  console.error('Error Boundary caught error:', error, info);
  // TODO: Send to error tracking service (Sentry, etc.)
  // reportErrorToService(error, info);
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LiquidGlassCard style={styles.card}>
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.onSurface }]}>Oops! Something went wrong</Text>

        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
          We're sorry, but something unexpected happened. The app has recovered and you can try again.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: colors.warningContainer }]}>
            <Text style={[styles.errorTitle, { color: colors.onWarningContainer }]}>Error Details (Dev Mode):</Text>
            <Text style={[styles.errorText, { color: colors.onWarningContainer }]}>{error.message}</Text>
            <Text style={[styles.errorStack, { color: colors.onWarningContainer }]}>
              {error.stack?.substring(0, 500)}
            </Text>
          </View>
        )}

        <ThemedButton variant="primary" onPress={resetErrorBoundary}>
          Try Again
        </ThemedButton>
      </LiquidGlassCard>
    </View>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      {children}
    </ReactErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: radius.lg,
  },
  card: {
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: radius.lg,
  },
  title: {
    fontSize: typography.display.fontSize - 8,
    fontWeight: typography.display.fontWeight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.lg,
  },
  errorDetails: {
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: radius.lg,
  },
  errorTitle: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.sm,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: typography.caption.fontSize - 2,
    fontFamily: 'monospace',
  },
});
