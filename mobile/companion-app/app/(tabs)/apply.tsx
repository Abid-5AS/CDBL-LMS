import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Platform,
} from "react-native";
import { useState } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";

const LEAVE_TYPES = [
  { id: "casual", label: "Casual Leave", balance: 12 },
  { id: "earned", label: "Earned Leave", balance: 15 },
  { id: "medical", label: "Medical Leave", balance: 10 },
  { id: "maternity", label: "Maternity Leave", balance: 90 },
];

export default function ApplyLeaveScreen() {
  const { colors, isDark } = useTheme();
  const [leaveType, setLeaveType] = useState("casual");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const selectedLeave = LEAVE_TYPES.find((l) => l.id === leaveType);
  const daysRequested =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const handleSubmit = () => {
    // TODO: Save to SQLite and sync queue
    alert(
      `Leave application submitted:\n${
        selectedLeave?.label
      }\n${daysRequested} days\nFrom: ${startDate.toLocaleDateString()}\nTo: ${endDate.toLocaleDateString()}`
    );
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
          Apply for Leave
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
          Fill in the details below
        </Text>
      </View>

      <ThemedCard style={styles.card}>
        <Text
          style={[
            styles.label,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Leave Type
        </Text>
        <View style={styles.typeGrid}>
          {LEAVE_TYPES.map((type) => (
            <ThemedButton
              key={type.id}
              variant={leaveType === type.id ? "primary" : "outline"}
              onPress={() => setLeaveType(type.id)}
              style={styles.typeButton}
            >
              {type.label}
            </ThemedButton>
          ))}
        </View>
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
            },
          ]}
        >
          <Text
            style={[
              styles.balanceText,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Available Balance
          </Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>
            {selectedLeave?.balance} days
          </Text>
        </View>
      </ThemedCard>

      <ThemedCard style={styles.card}>
        <Text
          style={[
            styles.label,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Duration
        </Text>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text
              style={[
                styles.dateLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              Start Date
            </Text>
            <ThemedButton
              variant="outline"
              onPress={() => setShowStartPicker(true)}
            >
              {startDate.toLocaleDateString()}
            </ThemedButton>
          </View>

          <View style={styles.dateField}>
            <Text
              style={[
                styles.dateLabel,
                {
                  color:
                    "textSecondary" in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              End Date
            </Text>
            <ThemedButton
              variant="outline"
              onPress={() => setShowEndPicker(true)}
            >
              {endDate.toLocaleDateString()}
            </ThemedButton>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowStartPicker(Platform.OS === "ios");
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowEndPicker(Platform.OS === "ios");
              if (date) setEndDate(date);
            }}
          />
        )}

        <View
          style={[
            styles.durationCard,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
            },
          ]}
        >
          <Text
            style={[
              styles.durationText,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Total Days Requested
          </Text>
          <Text style={[styles.durationValue, { color: colors.primary }]}>
            {daysRequested} {daysRequested === 1 ? "day" : "days"}
          </Text>
        </View>
      </ThemedCard>

      <ThemedCard style={styles.card}>
        <Text
          style={[
            styles.label,
            { color: "text" in colors ? colors.text : colors.onSurface },
          ]}
        >
          Reason
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              color: "text" in colors ? colors.text : colors.onSurface,
              borderColor: colors.outline,
            },
          ]}
          multiline
          numberOfLines={4}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter reason for leave..."
          placeholderTextColor={
            "textSecondary" in colors
              ? colors.textSecondary
              : colors.onSurfaceVariant
          }
        />
      </ThemedCard>

      <View style={styles.actions}>
        <ThemedButton variant="primary" onPress={handleSubmit}>
          Submit Application
        </ThemedButton>
        <ThemedButton variant="outline" onPress={() => alert("Draft saved")}>
          Save as Draft
        </ThemedButton>
      </View>
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
  card: {
    marginBottom: 16,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: "47%",
  },
  balanceCard: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  durationCard: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  durationValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
