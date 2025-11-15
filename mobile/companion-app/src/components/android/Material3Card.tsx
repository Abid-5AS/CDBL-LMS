import React from "react";
import { Card } from "react-native-paper";
import { ViewStyle } from "react-native";

interface Material3CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  mode?: "elevated" | "outlined" | "contained";
}

/**
 * Material 3 Expressive Card for Android
 *
 * Uses react-native-paper Card with Material 3 styling
 */
export function Material3Card({
  children,
  style,
  elevation = 2,
  mode = "elevated",
}: Material3CardProps) {
  return (
    <Card mode={mode} elevation={elevation} style={style}>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
