import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleProp, ViewStyle } from "react-native";

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconSymbol({
  name,
  size = 24,
  color = "#000",
  style,
}: IconSymbolProps) {
  // Map symbol names to MaterialCommunityIcons names
  const iconMap: Record<string, string> = {
    "house.fill": "home",
    "plus.circle.fill": "plus-circle",
    "clock.fill": "clock",
    "chart.bar.fill": "chart-bar",
    "ellipsis.circle.fill": "dots-horizontal-circle",
    "paperplane.fill": "send",
    "calendar.fill": "calendar",
    "gear.fill": "cog",
    "person.fill": "account",
    "bell.fill": "bell",
    "checkmark.circle.fill": "check-circle",
    "xmark.circle.fill": "close-circle",
    "exclamation.circle.fill": "alert-circle",
  };

  const iconName = iconMap[name] || name;

  return (
    <MaterialCommunityIcons
      name={iconName as any}
      size={size}
      color={color}
      style={style}
    />
  );
}
