import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { SectionHeader, ThemedCard } from "@/src/components/shared";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useLeaveBalances } from "@/src/hooks/useLeaveBalances";
import { spacing, typography, radius } from "@/src/theme/designTokens";
import { format } from "date-fns";

export default function BalanceScreen() {
  const { colors, isDark } = useTheme();
  const {
    balances,
    isLoading,
    isRefreshing,
    lastSynced,
    getTotalAvailable,
    getTotalUsed,
    refresh,
  } = useLeaveBalances();
  const [refreshing, setRefreshing] = useState(false);

  const LEAVE_TYPE_COLORS: Record<string, string> = {
    "Casual Leave": colors.primary,
    "Earned Leave": colors.accent,
    "Medical Leave": colors.success,
    "Maternity Leave": colors.warning,
    "Paternity Leave": colors.error,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const totalGranted = balances.reduce((sum, leave) => sum + leave.total_days, 0);
  const totalUsed = getTotalUsed();
  const totalAvailable = getTotalAvailable();
  const totalPending = balances.reduce((sum, leave) => sum + leave.pending_days, 0);
  const formattedSync = lastSynced
    ? `Last synced: ${format(lastSynced, "MMM dd, HH:mm")}`
    : "Not yet synced";

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return colors.success;
    if (percentage >= 40) return colors.warning;
    return colors.error;
  };

  const getLeaveTypeColor = (leaveType: string) => {
    return LEAVE_TYPE_COLORS[leaveType] || colors.primary;
  };

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
      <View style={styles.headerSection}>
        <SectionHeader
          title="Leave Balance"
          subtitle="Real-time HR data"
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
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
          {formattedSync}
        </Text>
        {isRefreshing && (
          <Text
            style={[
              styles.subtitle,
              styles.refreshingText,
              {
                color:
                  "text" in colors
                    ? colors.text
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Refreshing balances…
          </Text>
        )}
      </View>

      {isLoading && !isRefreshing ? (
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
                  Granted
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

          <SectionHeader
            title="Balances by type"
            subtitle="See how each leave bucket is tracking"
          />

          {balances.length > 0 ? (
            balances.map((leave) => {
              const percentage = leave.total_days
                ? (leave.available_days / leave.total_days) * 100
                : 0;
              const leaveColor = getLeaveTypeColor(leave.leave_type);

              return (
                <ThemedCard
                  key={leave.id}
                  style={styles.leaveCard}
                >
                  <View style={styles.leaveHeader}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: leaveColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.leaveName,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.leave_type}
                    </Text>
                    <Text
                      style={[
                        styles.leaveBalance,
                        { color: colors.primary },
                      ]}
                    >
                      {leave.available_days}/{leave.total_days}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.08)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: getProgressColor(percentage),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.leaveMeta}>
                    <Text
                      style={[
                        styles.leaveMetaText,
                        {
                          color:
                            "textSecondary" in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {leave.used_days} used
                    </Text>
                    <Text
                      style={[
                        styles.leaveMetaText,
                        {
                          color:
                            "textSecondary" in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {leave.pending_days} pending
                    </Text>
                  </View>
                </ThemedCard>
              );
            })
          ) : (
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
              No leave balances yet
            </Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    marginTop: spacing.xs,
  },
  refreshingText: {
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  summaryTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  summaryValue: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginVertical: spacing.sm,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.caption.fontSize,
  },
  summaryNumber: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  leaveCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  leaveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  colorDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  leaveName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
    flex: 1,
  },
  leaveBalance: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
  },
  leaveMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  leaveMetaText: {
    fontSize: typography.caption.fontSize,
  },
  emptyText: {
    textAlign: "center",
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
  },
});
