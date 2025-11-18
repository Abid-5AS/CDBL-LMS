import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { AIMessage } from '../../ai/types';
import { User, Bot } from 'lucide-react-native';

interface AIMessageBubbleProps {
  message: AIMessage;
}

export function AIMessageBubble({ message }: AIMessageBubbleProps) {
  const { colors, isDark } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isUser
              ? colors.primaryContainer
              : colors.surfaceVariant,
          },
        ]}
      >
        {isUser ? (
          <User size={16} color={colors.primary} />
        ) : (
          <Bot size={16} color={colors.primary} />
        )}
      </View>

      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? colors.primary
              : colors.surfaceVariant,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser
                ? colors.onPrimary
                : colors.onSurface,
            },
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            {
              color: isUser
                ? colors.onPrimary
                : colors.onSurfaceVariant,
            },
          ]}
        >
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

import { spacing, radius, typography } from '../../theme/designTokens';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  text: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.heading.lineHeight,
  },
  timestamp: {
    fontSize: typography.caption.fontSize - 1,
    marginTop: spacing.xs,
  },
});
