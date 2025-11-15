import { StyleSheet, ScrollView, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";

const MOCK_LEAVES = [
  {
    id: "1",
    type: "Casual Leave",
    startDate: "2025-01-15",
    endDate: "2025-01-17",
    days: 3,
    status: "approved",
    reason: "Family function",
    appliedOn: "2025-01-01",
  },
  {
    id: "2",
    type: "Medical Leave",
    startDate: "2025-02-20",
    endDate: "2025-02-21",
    days: 2,
    status: "pending",
    reason: "Doctor appointment",
    appliedOn: "2025-02-15",
  },
  {
    id: "3",
    type: "Earned Leave",
    startDate: "2024-12-24",
    endDate: "2024-12-31",
    days: 8,
    status: "approved",
    reason: "Year-end vacation",
    appliedOn: "2024-11-30",
  },
  {
    id: "4",
    type: "Casual Leave",
    startDate: "2024-11-10",
    endDate: "2024-11-10",
    days: 1,
    status: "rejected",
    reason: "Personal work",
    appliedOn: "2024-11-08",
  },
];

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredLeaves = MOCK_LEAVES.filter((leave) => {
    if (filter !== "all" && leave.status !== filter) return false;
    if (
      searchQuery &&
      !leave.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
                {leave.type}
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
                {new Date(leave.startDate).toLocaleDateString()} -{" "}
                {new Date(leave.endDate).toLocaleDateString()}
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
                {leave.days} {leave.days === 1 ? "day" : "days"}
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
                {new Date(leave.appliedOn).toLocaleDateString()}
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

      {filteredLeaves.length === 0 && (
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
});
