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
              ? colors.primary + '20'
              : isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
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
              : isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser
                ? '#FFFFFF'
                : 'text' in colors
                ? colors.text
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
                ? 'rgba(255, 255, 255, 0.7)'
                : 'textSecondary' in colors
                ? colors.textSecondary
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 8,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
});
