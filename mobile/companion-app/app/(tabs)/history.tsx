import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useMemo } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useLeaveApplications } from "@/src/hooks/useLeaveApplications";
import { syncService } from "@/src/sync/SyncService";
import { SyncStatusBanner } from "@/src/components/shared/SyncStatusBanner";
import { format } from "date-fns";

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { applications, isLoading, refresh } = useLeaveApplications();
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
    // Trigger sync with server
    await syncService.sync();
    // Refresh local data
    await refresh();
    setRefreshing(false);
  };

  const filteredLeaves = useMemo(() => {
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
            Loading leave history...
          </Text>
        </View>
      ) : (
        <>
          {filteredLeaves.map((leave) => (
            <ThemedCard key={leave.id} style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.leaveType,
                      { color: "text" in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {leave.leave_type}
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
                    {format(new Date(leave.start_date), "MMM dd, yyyy")} -{" "}
                    {format(new Date(leave.end_date), "MMM dd, yyyy")}
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
                {leave.days_requested} {leave.days_requested === 1 ? "day" : "days"}
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
                {leave.applied_on
                  ? format(new Date(leave.applied_on), "MMM dd, yyyy")
                  : format(new Date(leave.local_created_at), "MMM dd, yyyy")}
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
          </View>
            </ThemedCard>
          ))}

          {filteredLeaves.length === 0 && !isLoading && (
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
          )}
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
});
