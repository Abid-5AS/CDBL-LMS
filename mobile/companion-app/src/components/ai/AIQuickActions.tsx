import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { QUICK_ACTIONS } from '../../ai/prompts';
import { Calendar, HelpCircle, AlertCircle, Sun } from 'lucide-react-native';

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
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
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
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  scrollContent: {
    gap: 12,
    paddingHorizontal: 4,
  },
  actionCard: {
    width: 120,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
