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

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications, isLoading, error, refetch } = useLeaveHistory();
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "rejected":
        return "#F44336";
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
              { color: "#F44336" },
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
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
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
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
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
  searchCard: {
    marginBottom: 16,
    padding: 16,
  },
  searchInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  leaveCard: {
    marginBottom: 12,
    padding: 16,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  leaveDates: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  leaveDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  reasonBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
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
  emptyListContent: {
    flexGrow: 1,
  },
  errorState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  commentBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
});
