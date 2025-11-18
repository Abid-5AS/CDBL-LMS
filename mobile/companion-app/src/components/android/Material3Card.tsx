import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Card } from "react-native-paper";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing } from "../../theme/designTokens";

interface Material3CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
}

/**
 * Android Material 3 Card Component
 *
 * Leverages react-native-paper's Card component and our Material 3 theme
 */
export function Material3Card({
  children,
  style,
  elevation = 2,
}: Material3CardProps) {
  const { colors } = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: colors.surface }, style]}
      elevation={elevation}
      mode="elevated"
    >
      <Card.Content style={styles.content}>{children}</Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.sm, // Was 12
  },
  content: {
    padding: spacing.md, // Was 16
  },
});
