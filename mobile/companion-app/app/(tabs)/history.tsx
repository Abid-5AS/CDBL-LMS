import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useState, useMemo } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { SkeletonCard } from "@/src/components/shared/SkeletonLoader";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useLeaveHistory } from "@/src/hooks/useLeaveHistory";
import { syncService } from "@/src/sync/SyncService";
import { SyncStatusBanner } from "@/src/components/shared/SyncStatusBanner";
import { format } from "date-fns";
import { spacing, typography, radius } from "@/src/theme/designTokens";

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications, isLoading, error, refetch } = useLeaveHistory();
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success;
      case "pending":
        return colors.warning;
      case "rejected":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✓";
      case "pending":
        return "⏱";
      case "rejected":
        return "✗";
      default:
        return "?";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger sync with server (if available)
      if (syncService?.sync) {
        await syncService.sync();
      }
      // Refresh data from API
      await refetch();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    if (!applications) return [];

    return applications.filter((leave) => {
      if (filter !== "all" && leave.status !== filter) return false;
      if (
        searchQuery &&
        !leave.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [applications, filter, searchQuery]);

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
        <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Leave History
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
          {filteredLeaves.length} application
          {filteredLeaves.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ThemedCard style={styles.searchCard}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              color: "text" in colors ? colors.text : colors.onSurface,
            },
          ]}
          placeholder="Search by reason..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={
            "textSecondary" in colors
              ? colors.textSecondary
              : colors.onSurfaceVariant
          }
        />

        <View style={styles.filterRow}>
          {["all", "pending", "approved", "rejected"].map((status) => (
            <ThemedButton
              key={status}
              variant={filter === status ? "primary" : "outline"}
              onPress={() => setFilter(status)}
              style={styles.filterButton}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </ThemedButton>
          ))}
        </View>
      </ThemedCard>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text
            style={[
              styles.errorText,
              { color: colors.error },
            ]}
          >
            Failed to load leave history
          </Text>
          <Text
            style={[
              styles.errorSubtext,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            {error.message}
          </Text>
          <ThemedButton
            variant="primary"
            onPress={handleRefresh}
            style={styles.retryButton}
          >
            Retry
          </ThemedButton>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredLeaves}
            keyExtractor={(item) => item.id}
            renderItem={({ item: leave, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                exiting={FadeOutDown.springify()}
                layout={LinearTransition.springify()}
              >
                <ThemedCard style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.leaveType,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.leaveType}
                    </Text>
                    <Text
                      style={[
                        styles.leaveDates,
                        {
                          color:
                            "textSecondary" in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {format(new Date(leave.startDate), "MMM dd, yyyy")} -{" "}
                      {format(new Date(leave.endDate), "MMM dd, yyyy")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(leave.status) + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusIcon,
                        { color: getStatusColor(leave.status) },
                      ]}
                    >
                      {getStatusIcon(leave.status)}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(leave.status) },
                      ]}
                    >
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.leaveDetails}>
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            "textSecondary" in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Duration:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.workingDays} {leave.workingDays === 1 ? "day" : "days"}
                      {leave.halfDay && " (Half Day)"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            "textSecondary" in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Applied on:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {format(new Date(leave.appliedDate), "MMM dd, yyyy")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.reasonBox,
                      {
                        backgroundColor: 'surfaceVariant' in colors ? colors.surfaceVariant : (isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)"),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        { color: "text" in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {leave.reason}
                    </Text>
                  </View>
                  {leave.approverComments && (
                    <View
                      style={[
                        styles.commentBox,
                        {
                          backgroundColor: 'surfaceVariant' in colors ? colors.surfaceVariant : (isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)"),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.commentLabel,
                          {
                            color:
                              "textSecondary" in colors
                                ? colors.textSecondary
                                : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        Approver Comments:
                      </Text>
                      <Text
                        style={[
                          styles.commentText,
                          { color: "text" in colors ? colors.text : colors.onSurface },
                        ]}
                      >
                        {leave.approverComments}
                      </Text>
                    </View>
                  )}
                </View>
              </ThemedCard>
              </Animated.View>
            )}
            ListEmptyComponent={
              !isLoading ? (
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
                    No leave applications found
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={filteredLeaves.length === 0 ? styles.emptyListContent : undefined}
            scrollEnabled={false}
          />
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
    padding: radius.lg,
    paddingBottom: spacing.xxl * 2 + spacing.sm,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: radius.lg,
  },
  title: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  searchCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  searchInput: {
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
  },
  leaveCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  leaveType: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  leaveDates: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  statusIcon: {
    fontSize: radius.md,
    fontWeight: typography.display.fontWeight,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  leaveDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
  },
  detailValue: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
  },
  reasonBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  reasonText: {
    fontSize: radius.md,
    lineHeight: typography.heading.lineHeight,
  },
  emptyState: {
    alignItems: "center",
    padding: typography.display.lineHeight,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: typography.display.lineHeight,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  errorState: {
    alignItems: "center",
    justifyContent: "center",
    padding: typography.display.lineHeight,
  },
  errorText: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: radius.md,
    textAlign: "center",
    marginBottom: radius.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
  },
  commentBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  commentLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentText: {
    fontSize: radius.md,
    lineHeight: typography.heading.lineHeight,
    fontStyle: "italic",
  },
});
