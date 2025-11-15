import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useLeaveBalances } from "@/src/hooks/useLeaveBalances";
import { format } from "date-fns";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  "Casual Leave": "#2196F3",
  "Earned Leave": "#9C27B0",
  "Medical Leave": "#4CAF50",
  "Maternity Leave": "#FF9800",
  "Paternity Leave": "#FF5722",
};

export default function BalanceScreen() {
  const { colors, isDark } = useTheme();
  const {
    balances,
    isLoading,
    lastSynced,
    getTotalAvailable,
    getTotalUsed,
    refresh,
  } = useLeaveBalances();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return "#4CAF50";
    if (percentage >= 40) return "#FF9800";
    return "#F44336";
  };

  const getLeaveTypeColor = (leaveType: string) => {
    return LEAVE_TYPE_COLORS[leaveType] || colors.primary;
  };

  const totalGranted = balances.reduce((sum, leave) => sum + leave.total_days, 0);
  const totalUsed = getTotalUsed();
  const totalAvailable = getTotalAvailable();
  const totalPending = balances.reduce((sum, leave) => sum + leave.pending_days, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
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
          {lastSynced
            ? `Last synced: ${format(lastSynced, "MMM dd, HH:mm")}`
            : "Not yet synced"}
        </Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Loading balances...
          </Text>
        </View>
      ) : (
        <>
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
              {totalAvailable} days
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
                  {totalGranted}
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
                  {totalUsed}
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
                  {totalPending}
                </Text>
              </View>
            </View>
          </ThemedCard>

          {balances.map((leave) => {
            const percentage =
              leave.total_days > 0
                ? (leave.available_days / leave.total_days) * 100
                : 0;
            const leaveColor = getLeaveTypeColor(leave.leave_type);

            return (
              <ThemedCard key={leave.id} style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <View
                    style={[styles.colorDot, { backgroundColor: leaveColor }]}
                  />
                  <Text
                    style={[
                      styles.leaveName,
                      { color: "text" in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {leave.leave_type}
                  </Text>
                </View>

                <View style={styles.leaveStats}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: leaveColor }]}>
                      {leave.available_days}
                    </Text>
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
                  </View>
                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.used_days}
                    </Text>
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
                  </View>
                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.pending_days}
                    </Text>
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
                  </View>
                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.total_days}
                    </Text>
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
                      Total
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
                          backgroundColor: getProgressColor(percentage),
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      {
                        color:
                          "textSecondary" in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {percentage.toFixed(0)}% available
                  </Text>
                </View>
              </ThemedCard>
            );
          })}

          {balances.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      "textSecondary" in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                No leave balances found
              </Text>
            </View>
          )}
        </>
      )}
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
    fontSize: 14,
    fontWeight: "500",
  },
  summaryCard: {
    marginBottom: 20,
    padding: 20,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  leaveCard: {
    marginBottom: 16,
    padding: 16,
  },
  leaveHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  leaveName: {
    fontSize: 18,
    fontWeight: "600",
  },
  leaveStats: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
