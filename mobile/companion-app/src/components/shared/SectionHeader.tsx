import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing, typography } from "@/src/theme/designTokens";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accessory?: ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  accessory,
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
      <View style={[styles.header, style]}>
        <View>
        <Text style={[styles.title, { color: "text" in colors ? colors.text : colors.onSurface }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: "textSecondary" in colors ? colors.textSecondary : colors.onSurfaceVariant },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
        {onAction && actionLabel ? (
          <TouchableOpacity onPress={onAction} style={styles.actionTouch}>
            <Text style={[styles.actionLabel, { color: colors.primary }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  accessory: {
    marginRight: spacing.sm,
  },
  actionTouch: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
});
