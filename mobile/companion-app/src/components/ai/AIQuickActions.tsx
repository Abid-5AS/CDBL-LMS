import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { QUICK_ACTIONS } from '../../ai/prompts';
import { Calendar, HelpCircle, AlertCircle, Sun } from 'lucide-react-native';
import { spacing, radius, typography } from '../../theme/designTokens';

interface AIQuickActionsProps {
  onActionPress: (prompt: string) => void;
}

const getIcon = (iconName: string, color: string, size: number) => {
  switch (iconName) {
    case 'calendar':
      return <Calendar size={size} color={color} />;
    case 'help-circle':
      return <HelpCircle size={size} color={color} />;
    case 'alert-circle':
      return <AlertCircle size={size} color={color} />;
    case 'sun':
      return <Sun size={size} color={color} />;
    default:
      return <HelpCircle size={size} color={color} />;
  }
};

export function AIQuickActions({ onActionPress }: AIQuickActionsProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            color:
              'textSecondary' in colors
                ? colors.textSecondary
                : colors.onSurfaceVariant,
          },
        ]}
      >
        Quick Actions
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onActionPress(action.prompt)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              {getIcon(action.icon, colors.primary, 20)}
            </View>
            <Text
              style={[
                styles.actionTitle,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actionCard: {
    width: 120,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: typography.display.lineHeight,
    height: typography.display.lineHeight,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    textAlign: 'center',
  },
});
