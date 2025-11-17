import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from "expo-router";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
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
import { FileText, Calendar, Clock, TrendingUp } from "lucide-react-native";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useUserProfile();
  const { balances, isLoading: balancesLoading, getTotalAvailable, refresh: refreshBalances } = useLeaveBalances();
  const { applications, isLoading: appsLoading, refresh: refreshApps } = useLeaveApplications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger sync with server
    await syncService.sync();
    // Refresh local data
    await Promise.all([refreshProfile(), refreshBalances(), refreshApps()]);
    setRefreshing(false);
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "pending" || app.status === "draft"
  );

  const isLoading = profileLoading || balancesLoading || appsLoading;

  // Get top 3 leave balances
  const topBalances = balances.slice(0, 3);

  // Determine if user is a manager/approver (MANAGER, HR, CEO)
  const userRole = user?.role || profile?.role || 'EMPLOYEE';
  const isApprover = ['MANAGER', 'HR', 'CEO'].includes(userRole.toUpperCase());

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
            userName={user?.name || profile?.name || 'Manager'}
            userRole={userRole}
          />
        ) : (
          <>
            <Animated.View
              style={styles.header}
              entering={FadeIn.duration(600)}
            >
        <Text
          style={[
            styles.greeting,
            {
              color:
                "textSecondary" in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          Welcome back,
        </Text>
        <Text
          style={[
            styles.name,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          {profile?.name || "Employee"}
        </Text>
        {profile?.department && (
          <Text
            style={[
              styles.department,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            {profile.department} • {profile.role || "Employee"}
          </Text>
        )}
      </Animated.View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Quick Stats */}
          <Animated.View
            style={styles.statsGrid}
            entering={FadeInDown.delay(200).springify()}
          >
            <ThemedCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + "20" }]}>
                <TrendingUp size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {getTotalAvailable()}
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
                Days Available
              </Text>
            </ThemedCard>

            <ThemedCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FF9800" + "20" }]}>
                <Clock size={24} color="#FF9800" />
              </View>
              <Text style={[styles.statValue, { color: "#FF9800" }]}>
                {pendingApplications.length}
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
            </ThemedCard>
          </Animated.View>

          {/* Leave Balances Overview */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: "text" in colors ? colors.text : colors.onSurface },
                ]}
              >
                Leave Balances
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/balance")}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {topBalances.length > 0 ? (
              <View style={styles.balancesContainer}>
                {topBalances.map((balance) => (
                  <View key={balance.id} style={styles.balanceRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.balanceType,
                          { color: "text" in colors ? colors.text : colors.onSurface },
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
                    <Text style={[styles.balanceValue, { color: colors.primary }]}>
                      {balance.available_days}/{balance.total_days}
                    </Text>
                  </View>
                ))}
              </View>
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
          </ThemedCard>
          </Animated.View>

          {/* Recent Applications */}
          {pendingApplications.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <ThemedCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: "text" in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Pending Applications
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>

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
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.applicationType,
                          { color: "text" in colors ? colors.text : colors.onSurface },
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
                        {app.days_requested} days • {app.status}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            app.status === "draft" ? "#9E9E9E" + "20" : "#FF9800" + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: app.status === "draft" ? "#9E9E9E" : "#FF9800",
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

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <ThemedCard style={styles.card}>
            <Text
              style={[
                styles.cardTitle,
                { color: "text" in colors ? colors.text : colors.onSurface },
              ]}
            >
              Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                ]}
                onPress={() => router.push("/(tabs)/apply")}
              >
                <FileText size={32} color={colors.primary} />
                <Text
                  style={[
                    styles.actionText,
                    { color: "text" in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Apply Leave
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                ]}
                onPress={() => router.push("/(tabs)/history")}
              >
                <Calendar size={32} color={colors.primary} />
                <Text
                  style={[
                    styles.actionText,
                    { color: "text" in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  View History
                </Text>
              </TouchableOpacity>
            </View>
          </ThemedCard>
          </Animated.View>

          {/* Platform Info */}
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
          </>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  balancesContainer: {
    gap: 12,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  balanceType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceDetails: {
    fontSize: 13,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  applicationsContainer: {
    gap: 12,
  },
  applicationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  applicationType: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  applicationDays: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  platformInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  platformText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
