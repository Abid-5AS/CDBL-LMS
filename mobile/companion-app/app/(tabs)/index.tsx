import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { SectionHeader, ThemedCard } from "@/src/components/shared";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAuthStore } from "@/src/store/authStore";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLeaveBalances } from "@/src/hooks/useLeaveBalances";
import { useLeaveApplications } from "@/src/hooks/useLeaveApplications";
import { syncService } from "@/src/sync/SyncService";
import { SyncStatusBanner } from "@/src/components/shared/SyncStatusBanner";
import { ManagerDashboard } from "@/src/components/dashboard/ManagerDashboard";
import { useState } from "react";
import { Clock } from "lucide-react-native";
import { spacing, typography, radius } from "@/src/theme/designTokens";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const { profile, isLoading: profileLoading, refresh: refreshProfile } =
    useUserProfile();
  const {
    balances,
    isLoading: balancesLoading,
    isRefreshing: balancesRefreshing,
    getTotalAvailable,
    refresh: refreshBalances,
  } = useLeaveBalances();
  const {
    applications,
    isLoading: appsLoading,
    isRefreshing: appsRefreshing,
    refresh: refreshApps,
  } = useLeaveApplications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncService.sync();
    await Promise.all([refreshProfile(), refreshBalances(), refreshApps()]);
    setRefreshing(false);
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "pending" || app.status === "draft"
  );

  const isLoading = profileLoading || balancesLoading || appsLoading;
  const isRefreshingData =
    balancesRefreshing || appsRefreshing || refreshing;
  const totalAvailable = getTotalAvailable();
  const heroSubtitle = `You have ${totalAvailable} days ready to spend`;
  const statusColors: Record<string, string> = {
    pending: colors.warning,
    approved: colors.success,
    rejected: colors.error,
    draft: colors.textSecondary,
  };

  const topBalances = balances.slice(0, 3);

  const userRole = user?.role || profile?.role || "EMPLOYEE";
  const isApprover = ["MANAGER", "HR", "CEO"].includes(
    userRole.toUpperCase()
  );

  const heroNameStyle = {
    ...styles.heroName,
    fontSize: width < 380 ? typography.heading.fontSize : typography.display.fontSize,
  };

  return (
    <>
      <SyncStatusBanner />
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
        {isApprover ? (
          <ManagerDashboard
            userName={user?.name || profile?.name || "Manager"}
            userRole={userRole}
          />
        ) : (
          <>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.heroWrapper}
            >
              <ThemedCard
                style={[styles.heroCard, { backgroundColor: colors.primary }]}
              >
                <View style={styles.heroHeader}>
                  <Text style={[styles.heroGreeting, { color: colors.onPrimary }]}>Welcome back,</Text>
                  <Text style={[heroNameStyle, { color: colors.onPrimary }]}>
                    {profile?.name || "Employee"}
                  </Text>
                  {profile?.department && (
                    <Text style={[styles.heroMeta, { color: colors.onPrimary, opacity: 0.9 }]}>
                      {profile.department} • {profile.role || "Employee"}
                    </Text>
                  )}
                </View>
                <Text style={[styles.heroSubtitle, { color: colors.onPrimary }]}>{heroSubtitle}</Text>
                <View style={styles.heroChips}>
                  <View style={styles.heroChip}>
                    <Text style={[styles.heroChipLabel, { color: colors.onPrimary, opacity: 0.85 }]}>Available</Text>
                    <Text style={[styles.heroChipValue, { color: colors.onPrimary }]}>
                      {totalAvailable} days
                    </Text>
                  </View>
                  <View style={[styles.heroChip, styles.heroChipLast]}>
                    <Text style={[styles.heroChipLabel, { color: colors.onPrimary, opacity: 0.85 }]}>Pending</Text>
                    <Text style={[styles.heroChipValue, { color: colors.onPrimary }]}>
                      {pendingApplications.length} requests
                    </Text>
                  </View>
                </View>
                <View style={styles.heroFooter}>
                  <Text style={[styles.heroFooterText, { color: colors.onPrimary, opacity: 0.9 }]}>
                    Tap “Apply Leave” to start a request
                  </Text>
                  <Clock size={20} color={colors.onPrimary} />
                </View>
              </ThemedCard>
            </Animated.View>

            {isRefreshingData && (
              <View
                style={[
                  styles.refreshBanner,
                  {
                    backgroundColor:
                      "surfaceVariant" in colors
                        ? colors.surfaceVariant
                        : colors.onSurface,
                  },
                ]}
              >
                <ActivityIndicator
                  animating
                  size="small"
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.refreshText,
                    {
                      color:
                        "text" in colors
                          ? colors.text
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Syncing live data…
                </Text>
              </View>
            )}

            {isLoading && !isRefreshingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                <Animated.View
                  entering={FadeInDown.delay(200).springify()}
                  style={styles.section}
                >
                  <ThemedCard style={styles.card}>
                    <SectionHeader
                      title="Leave Balances"
                      subtitle="Live from the HR system"
                      actionLabel="View all"
                      onAction={() => router.push("/(tabs)/balance")}
                    />
                    <View style={styles.balanceGrid}>
                      {topBalances.length > 0 ? (
                        topBalances.map((balance) => {
                          const percent = balance.total_days
                            ? (balance.available_days / balance.total_days) * 100
                            : 0;

                          return (
                            <View key={balance.id} style={styles.balanceItem}>
                              <View style={styles.balanceItemHeader}>
                                <View style={{ flexShrink: 1, marginRight: spacing.sm }}>
                                  <Text
                                    style={[
                                      styles.balanceType,
                                      {
                                        color:
                                          "text" in colors
                                            ? colors.text
                                            : colors.onSurface,
                                      },
                                    ]}
                                  >
                                    {balance.leave_type}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.balanceDetails,
                                      {
                                        color:
                                          "textSecondary" in colors
                                            ? colors.textSecondary
                                            : colors.onSurfaceVariant,
                                      },
                                    ]}
                                  >
                                    {balance.used_days} used • {balance.pending_days} pending
                                  </Text>
                                </View>
                                <View style={styles.balanceValueGroup}>
                                  <Text
                                    style={[
                                      styles.balanceValue,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {balance.available_days}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.balanceOutOf,
                                      {
                                        color:
                                          "textSecondary" in colors
                                            ? colors.textSecondary
                                            : colors.onSurfaceVariant,
                                      },
                                    ]}
                                  >
                                    / {balance.total_days}
                                  </Text>
                                </View>
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
                                      width: `${Math.min(percent, 100)}%`,
                                      backgroundColor: colors.primary,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
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
                          No leave balances available
                        </Text>
                      )}
                    </View>
                  </ThemedCard>
                </Animated.View>

                {pendingApplications.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(400).springify()}
                    style={styles.section}
                  >
                    <ThemedCard style={styles.card}>
                      <SectionHeader
                        title="Pending Applications"
                        subtitle="Awaiting approvals"
                        actionLabel="View history"
                        onAction={() => router.push("/(tabs)/history")}
                      />
                      <View style={styles.applicationsContainer}>
                        {pendingApplications.slice(0, 2).map((app) => (
                          <View
                            key={app.id}
                            style={[
                              styles.applicationItem,
                              {
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.03)",
                              },
                            ]}
                          >
                            <View style={styles.applicationContent}>
                              <Text
                                style={[
                                  styles.applicationType,
                                  {
                                    color:
                                      "text" in colors
                                        ? colors.text
                                        : colors.onSurface,
                                  },
                                ]}
                              >
                                {app.leave_type}
                              </Text>
                              <Text
                                style={[
                                  styles.applicationDays,
                                  {
                                    color:
                                      "textSecondary" in colors
                                        ? colors.textSecondary
                                        : colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                {app.days_requested} days • {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor:
                                    (statusColors[app.status] || colors.primary) +
                                    "20",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  {
                                    color:
                                      statusColors[app.status] || colors.primary,
                                  },
                                ]}
                              >
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </ThemedCard>
                  </Animated.View>
                )}

                <Animated.View
                  entering={FadeInDown.delay(500).springify()}
                  style={styles.section}
                >
                  <ThemedCard style={styles.card}>
                    <SectionHeader
                      title="Quick Actions"
                      subtitle="Navigate your leave workflow"
                    />
                    <View style={styles.actionsGrid}>
                      <ThemedButton
                        variant="primary"
                        onPress={() => router.push("/(tabs)/apply")}
                        style={styles.actionButton}
                      >
                        Apply Leave
                      </ThemedButton>
                      <ThemedButton
                        variant="outline"
                        onPress={() => router.push("/(tabs)/history")}
                        style={[styles.actionButton, styles.actionButtonLast]}
                      >
                        View History
                      </ThemedButton>
                    </View>
                  </ThemedCard>
                </Animated.View>
              </>
            )}
          </>
        )}
        {!isApprover && (
          <View style={styles.platformInfo}>
            <Text
              style={[
                styles.platformText,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {Platform.OS === "ios"
                ? "iOS Liquid Glass Design"
                : "Android Material 3"}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
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
  heroWrapper: {
    marginBottom: spacing.lg,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  heroHeader: {
    marginBottom: spacing.md,
  },
  heroGreeting: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    marginBottom: spacing.xs,
  },
  heroName: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  heroMeta: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  heroSubtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.md,
  },
  heroChips: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  heroChip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginRight: spacing.sm,
  },
  heroChipLast: {
    marginRight: 0,
  },
  heroChipLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    marginBottom: spacing.xs,
  },
  heroChipValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  heroFooterText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  refreshBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  refreshText: {
    marginLeft: spacing.sm,
    fontSize: typography.caption.fontSize,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  balanceGrid: {
    marginTop: spacing.sm,
  },
  balanceItem: {
    marginBottom: spacing.md,
  },
  balanceItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  balanceType: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  balanceDetails: {
    fontSize: typography.caption.fontSize,
  },
  balanceValueGroup: {
    alignItems: "flex-end",
  },
  balanceValue: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  balanceOutOf: {
    fontSize: typography.caption.fontSize,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
  },
  applicationsContainer: {
    marginTop: spacing.sm,
  },
  applicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  applicationContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  applicationType: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  applicationDays: {
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: radius.md,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  actionsGrid: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionButtonLast: {
    marginRight: 0,
  },
  platformInfo: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  platformText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  emptyText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
