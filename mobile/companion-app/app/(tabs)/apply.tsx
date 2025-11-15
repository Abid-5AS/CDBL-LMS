import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { ThemedCard } from "@/src/components/shared/ThemedCard";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLeaveApplications } from "@/src/hooks/useLeaveApplications";
import { useLeaveBalances } from "@/src/hooks/useLeaveBalances";
import { format } from "date-fns";

export default function ApplyLeaveScreen() {
  const { colors, isDark } = useTheme();
  const { createApplication } = useLeaveApplications();
  const { balances, getBalanceByType, isLoading: balancesLoading } = useLeaveBalances();

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update end date when start date changes (ensure end date is after start date)
  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  const selectedBalance = getBalanceByType(leaveType);
  const daysRequested =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const validateApplication = (): { valid: boolean; message?: string } => {
    if (!leaveType) {
      return { valid: false, message: "Please select a leave type" };
    }

    if (!reason.trim()) {
      return { valid: false, message: "Please provide a reason for leave" };
    }

    if (reason.trim().length < 10) {
      return { valid: false, message: "Reason must be at least 10 characters" };
    }

    if (daysRequested <= 0) {
      return { valid: false, message: "Invalid date range" };
    }

    if (selectedBalance && daysRequested > selectedBalance.available_days) {
      return {
        valid: false,
        message: `Insufficient balance. You have ${selectedBalance.available_days} days available.`,
      };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = validateApplication();

    if (!validation.valid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createApplication({
        leaveType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        daysRequested,
        reason: reason.trim(),
        status: "pending",
      });

      if (result.success) {
        Alert.alert(
          "Success",
          "Your leave application has been submitted successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                // Reset form
                setReason("");
                setStartDate(new Date());
                setEndDate(new Date());
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to submit leave application. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!reason.trim()) {
      Alert.alert("Validation Error", "Please provide a reason before saving draft");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createApplication({
        leaveType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        daysRequested,
        reason: reason.trim(),
        status: "draft",
      });

      if (result.success) {
        Alert.alert("Success", "Draft saved successfully!");
      } else {
        Alert.alert("Error", "Failed to save draft. Please try again.");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

        {balancesLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={styles.typeGrid}>
              {balances.map((balance) => (
                <ThemedButton
                  key={balance.id}
                  variant={leaveType === balance.leave_type ? "primary" : "outline"}
                  onPress={() => setLeaveType(balance.leave_type)}
                  style={styles.typeButton}
                >
                  {balance.leave_type}
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
                {selectedBalance ? selectedBalance.available_days : 0} days
              </Text>
            </View>
          </>
        )}
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
        <ThemedButton
          variant="primary"
          onPress={handleSubmit}
          disabled={isSubmitting || balancesLoading}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </ThemedButton>
        <ThemedButton
          variant="outline"
          onPress={handleSaveDraft}
          disabled={isSubmitting || balancesLoading}
        >
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
