import { StyleSheet, ScrollView, View, Text } from "react-native";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { useTheme } from "@/src/providers/ThemeProvider";

const LEAVE_BALANCES = [
  {
    id: "casual",
    name: "Casual Leave",
    available: 12,
    total: 12,
    used: 0,
    pending: 0,
    color: "#2196F3",
  },
  {
    id: "earned",
    name: "Earned Leave",
    available: 15,
    total: 20,
    used: 5,
    pending: 0,
    color: "#9C27B0",
  },
  {
    id: "medical",
    name: "Medical Leave",
    available: 10,
    total: 14,
    used: 3,
    pending: 1,
    color: "#4CAF50",
  },
  {
    id: "maternity",
    name: "Maternity Leave",
    available: 90,
    total: 90,
    used: 0,
    pending: 0,
    color: "#FF9800",
  },
];

const ACCRUAL_HISTORY = [
  { month: "Jan 2025", earned: 1.67, type: "Earned Leave" },
  { month: "Feb 2025", earned: 1.67, type: "Earned Leave" },
  { month: "Mar 2025", earned: 1.67, type: "Earned Leave" },
];

export default function BalanceScreen() {
  const { colors, isDark } = useTheme();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return "#4CAF50";
    if (percentage >= 40) return "#FF9800";
    return "#F44336";
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
          Leave Balance
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
          Current year overview
        </Text>
      </View>

      <ThemedCard style={styles.summaryCard}>
        <Text
          style={[
            styles.summaryTitle,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Total Available
        </Text>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>
          {LEAVE_BALANCES.reduce((sum, leave) => sum + leave.available, 0)} days
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Total Granted
            </Text>
            <Text
              style={[
                styles.summaryNumber,
                { color: "text" in colors ? colors.text : colors.onSurface },
              ]}
            >
              {LEAVE_BALANCES.reduce((sum, leave) => sum + leave.total, 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Used
            </Text>
            <Text
              style={[
                styles.summaryNumber,
                { color: "text" in colors ? colors.text : colors.onSurface },
              ]}
            >
              {LEAVE_BALANCES.reduce((sum, leave) => sum + leave.used, 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Pending
            </Text>
            <Text
              style={[
                styles.summaryNumber,
                { color: "text" in colors ? colors.text : colors.onSurface },
              ]}
            >
              {LEAVE_BALANCES.reduce((sum, leave) => sum + leave.pending, 0)}
            </Text>
          </View>
        </View>
      </ThemedCard>

      <Text
        style={[
          styles.sectionTitle,
          { color: "text" in colors ? colors.text : colors.onSurface },
        ]}
      >
        By Leave Type
      </Text>

      {LEAVE_BALANCES.map((leave) => {
        const percentage = (leave.available / leave.total) * 100;
        const progressColor = getProgressColor(percentage);

        return (
          <ThemedCard key={leave.id} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.leaveName,
                    {
                      color: "text" in colors ? colors.text : colors.onSurface,
                    },
                  ]}
                >
                  {leave.name}
                </Text>
                <Text
                  style={[
                    styles.leaveSubtext,
                    {
                      color:
                        "textSecondary" in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {leave.available} of {leave.total} days available
                </Text>
              </View>
              <View
                style={[
                  styles.availableBadge,
                  { backgroundColor: leave.color + "20" },
                ]}
              >
                <Text style={[styles.availableValue, { color: leave.color }]}>
                  {leave.available}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: progressColor }]}>
                {percentage.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statLabel,
                    {
                      color:
                        "textSecondary" in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Used
                </Text>
                <Text style={[styles.statValue, { color: "#F44336" }]}>
                  {leave.used}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statLabel,
                    {
                      color:
                        "textSecondary" in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Pending
                </Text>
                <Text style={[styles.statValue, { color: "#FF9800" }]}>
                  {leave.pending}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statLabel,
                    {
                      color:
                        "textSecondary" in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Available
                </Text>
                <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                  {leave.available}
                </Text>
              </View>
            </View>
          </ThemedCard>
        );
      })}

      <Text
        style={[
          styles.sectionTitle,
          { color: "text" in colors ? colors.text : colors.onSurface },
        ]}
      >
        Accrual History
      </Text>

      <ThemedCard style={styles.accrualCard}>
        {ACCRUAL_HISTORY.map((item, index) => (
          <View
            key={index}
            style={[
              styles.accrualRow,
              index < ACCRUAL_HISTORY.length - 1 && styles.accrualRowBorder,
              {
                borderBottomColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.accrualMonth,
                  { color: "text" in colors ? colors.text : colors.onSurface },
                ]}
              >
                {item.month}
              </Text>
              <Text
                style={[
                  styles.accrualType,
                  {
                    color:
                      "textSecondary" in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                {item.type}
              </Text>
            </View>
            <Text style={[styles.accrualValue, { color: "#4CAF50" }]}>
              +{item.earned.toFixed(2)} days
            </Text>
          </View>
        ))}
      </ThemedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
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
  summaryCard: {
    marginBottom: 24,
    padding: 20,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  balanceCard: {
    marginBottom: 12,
    padding: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  leaveName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  leaveSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  availableBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  availableValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  accrualCard: {
    padding: 16,
    marginBottom: 16,
  },
  accrualRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  accrualRowBorder: {
    borderBottomWidth: 1,
  },
  accrualMonth: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  accrualType: {
    fontSize: 13,
    fontWeight: "500",
  },
  accrualValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
