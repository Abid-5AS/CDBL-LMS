import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor:
          "outline" in colors ? colors.outline : colors.onSurfaceVariant,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
          },
          default: {
            backgroundColor: colors.surface,
            elevation: 8,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apply"
        options={{
          title: "Apply Leave",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
