import { Platform, StyleSheet, ScrollView, View, Text } from "react-native";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function HomeScreen() {
  const { colors, isDark, mode, setMode } = useTheme();

  const toggleTheme = () => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          CDBL Leave Companion
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color:
                "textSecondary" in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {Platform.OS === "ios"
            ? "Liquid Glass Design"
            : "Material 3 Expressive"}
        </Text>
      </View>

      <ThemedCard style={styles.card}>
        <Text
          style={[
            styles.cardTitle,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Welcome Back
        </Text>
        <Text
          style={[
            styles.cardText,
            {
              color:
                "textSecondary" in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          Your leave management companion is ready. Apply for leave, check your
          balance, and get AI-powered insights.
        </Text>
      </ThemedCard>

      <ThemedCard style={styles.card}>
        <Text
          style={[
            styles.cardTitle,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Leave Balance
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              12
            </Text>
            <Text
              style={[
                styles.balanceLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Casual
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text
              style={[
                styles.balanceValue,
                {
                  color: "accent" in colors ? colors.accent : colors.secondary,
                },
              ]}
            >
              15
            </Text>
            <Text
              style={[
                styles.balanceLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Earned
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text
              style={[
                styles.balanceValue,
                {
                  color: "success" in colors ? colors.success : colors.tertiary,
                },
              ]}
            >
              10
            </Text>
            <Text
              style={[
                styles.balanceLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Medical
            </Text>
          </View>
        </View>
      </ThemedCard>

      <View style={styles.buttonGroup}>
        <ThemedButton
          variant="primary"
          onPress={() => alert("Apply for leave")}
        >
          Apply Leave
        </ThemedButton>
        <ThemedButton variant="secondary" onPress={() => alert("View history")}>
          View History
        </ThemedButton>
        <ThemedButton variant="outline" onPress={toggleTheme}>
          Theme: {mode}
        </ThemedButton>
      </View>

      <Text
        style={[
          styles.footer,
          {
            color:
              "textTertiary" in colors ? colors.textTertiary : colors.outline,
          },
        ]}
      >
        {isDark ? "🌙" : "☀️"} {Platform.OS === "ios" ? "iOS" : "Android"} •
        Expo SDK 54 • {mode} mode
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  balanceItem: {
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
  },
});
