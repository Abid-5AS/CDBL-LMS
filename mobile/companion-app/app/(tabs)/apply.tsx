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
import { SectionHeader, ThemedCard } from "@/src/components/shared";
import { ThemedButton } from "@/src/components/shared/ThemedButton";
import { useTheme } from "@/src/providers/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLeaveApplications } from "@/src/hooks/useLeaveApplications";
import { useLeaveBalances } from "@/src/hooks/useLeaveBalances";
import { useNotifications } from "@/src/hooks/useNotifications";
import { AIAssistantModal } from "@/src/components/ai/AIAssistantModal";
import { AILeaveSuggestion } from "@/src/ai/types";
import { format, parseISO } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { apiClient } from "@/src/api/client";
import { API_ENDPOINTS } from "@/src/api/endpoints";
import { LeaveApplicationResponse } from "@/src/api/types";
import { spacing, typography, radius } from "@/src/theme/designTokens";

const MAX_CERTIFICATE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CERTIFICATE_TYPES = ["application/pdf"];

type CertificateAttachment = {
  name: string;
  uri: string;
  mimeType?: string | null;
  size?: number | null;
  base64?: string;
};

const formatBytes = (value?: number | null) => {
  if (!value || value <= 0) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ApplyLeaveScreen() {
  const { colors, isDark } = useTheme();
  const { createApplication, refresh: refreshApplications } =
    useLeaveApplications();
  const {
    balances,
    getBalanceByType,
    isLoading: balancesLoading,
  } = useLeaveBalances();
  const { scheduleLeaveReminder, sendApplicationSubmitted } =
    useNotifications();

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [certificate, setCertificate] = useState<CertificateAttachment | null>(
    null
  );
  const [certificateError, setCertificateError] = useState<string | null>(null);

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

    const requiresCertificate = /medical/i.test(leaveType);

    if (requiresCertificate && !certificate) {
      return {
        valid: false,
        message: "Medical leave requires a supporting certificate",
      };
    }

    if (certificate?.size && certificate.size > MAX_CERTIFICATE_SIZE) {
      return {
        valid: false,
        message: "Certificate must be smaller than 5 MB",
      };
    }

    if (
      certificate?.mimeType &&
      !(
        ALLOWED_CERTIFICATE_TYPES.includes(certificate.mimeType) ||
        certificate.mimeType.startsWith("image/")
      )
    ) {
      return {
        valid: false,
        message: "Only PDF or image certificates are accepted",
      };
    }

    if (selectedBalance && daysRequested > selectedBalance.available_days) {
      return {
        valid: false,
        message: `Insufficient balance. You have ${selectedBalance.available_days} days available.`,
      };
    }

    return { valid: true };
  };

  const handlePickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return;
      }

      const fileInfo = result.assets && result.assets[0];
      if (!fileInfo) {
        setCertificateError("No file selected.");
        return;
      }

      if (fileInfo.size && fileInfo.size > MAX_CERTIFICATE_SIZE) {
        setCertificateError("Certificate must be smaller than 5 MB.");
        setCertificate(null);
        return;
      }

      if (
        fileInfo.mimeType &&
        !(
          ALLOWED_CERTIFICATE_TYPES.includes(fileInfo.mimeType) ||
          fileInfo.mimeType.startsWith("image/")
        )
      ) {
        setCertificateError("Only PDF or image certificates are accepted.");
        setCertificate(null);
        return;
      }

      setCertificateError(null);

      const base64 = await FileSystem.readAsStringAsync(fileInfo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setCertificate({
        name: fileInfo.name || "document",
        uri: fileInfo.uri,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        base64,
      });
    } catch (error) {
      console.error("Certificate selection failed:", error);
      setCertificateError(
        "Unable to load the selected certificate. Please try again."
      );
    }
  };

  const clearCertificate = () => {
    setCertificate(null);
    setCertificateError(null);
  };

  const handleSubmit = async () => {
    const validation = validateApplication();

    if (!validation.valid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: Record<string, any> = {
        leaveType,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        workingDays: daysRequested,
        reason: reason.trim(),
      };

      if (certificate?.base64) {
        payload.certificate = {
          fileName: certificate.name,
          mimeType: certificate.mimeType,
          content: certificate.base64,
        };
      }

      const response = await apiClient.post<LeaveApplicationResponse>(
        API_ENDPOINTS.LEAVES.CREATE,
        payload
      );

      await refreshApplications();

      await sendApplicationSubmitted(
        leaveType,
        format(startDate, "MMM dd, yyyy"),
        format(endDate, "MMM dd, yyyy")
      );

      const submittedId =
        response.data?.id ?? `pending_${Date.now().toString()}`;

      await scheduleLeaveReminder(submittedId, leaveType, startDate);

      Alert.alert(
        "Success",
        "Your leave application has been submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setReason("");
              setStartDate(new Date());
              setEndDate(new Date());
              setCertificate(null);
              setCertificateError(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Submit error:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "An unexpected error occurred. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!reason.trim()) {
      Alert.alert(
        "Validation Error",
        "Please provide a reason before saving draft"
      );
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

  const handleApplySuggestion = (suggestion: AILeaveSuggestion) => {
    try {
      setLeaveType(suggestion.leaveType);
      setStartDate(parseISO(suggestion.startDate));
      setEndDate(parseISO(suggestion.endDate));
      setReason(suggestion.reason);
      setShowAIModal(false);
      Alert.alert(
        "AI Suggestion Applied",
        "Form filled with AI suggestions. Please review before submitting."
      );
    } catch (error) {
      console.error("Error applying suggestion:", error);
      Alert.alert(
        "Error",
        "Failed to apply AI suggestion. Please try manually."
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    headerSection: {
      marginBottom: spacing.md,
    },
    headerAccessory: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      color: colors.textSecondary,
    },
    subtitle: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      marginTop: spacing.xs,
    },
    aiRow: {
      alignItems: "flex-start",
      marginBottom: spacing.md,
    },
    aiButton: {
      width: "100%",
    },
    card: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: spacing.sm,
    },
    typeButton: {
      flex: 1,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    typeButtonNoMargin: {
      marginRight: 0,
    },
    balanceCard: {
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: radius.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    balanceText: {
      fontSize: typography.caption.fontSize,
    },
    balanceValue: {
      fontSize: typography.heading.fontSize,
      fontWeight: typography.heading.fontWeight,
    },
    dateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    dateField: {
      flex: 1,
      marginRight: spacing.sm,
    },
    dateFieldLast: {
      marginRight: 0,
    },
    dateLabel: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      marginBottom: spacing.xs,
    },
    durationSummary: {
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    durationLabel: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
    },
    durationValue: {
      fontSize: typography.heading.fontSize,
      fontWeight: typography.heading.fontWeight,
    },
    textArea: {
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: "transparent",
      fontSize: typography.body.fontSize,
      minHeight: spacing.xxl * 3,
      textAlignVertical: "top",
    },
    helpText: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      marginBottom: spacing.sm,
    },
    certificateMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
    },
    certificateName: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.heading.fontWeight,
    },
    certificateDetails: {
      fontSize: typography.caption.fontSize,
    },
    certificateError: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      marginTop: spacing.xs,
    },
    actions: {
      marginTop: spacing.md,
    },
    actionButton: {
      marginBottom: spacing.sm,
    },
  });

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerSection}>
          <SectionHeader
            title="Apply for Leave"
            subtitle="Policy-aware validations before submission"
            accessory={
              <Text style={styles.headerAccessory}>
                {daysRequested} {daysRequested === 1 ? "day" : "days"} selected
              </Text>
            }
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
            Drafts are saved locally until you sync.
          </Text>
        </View>

        <View style={styles.aiRow}>
          <ThemedButton
            variant="secondary"
            onPress={() => setShowAIModal(true)}
            style={styles.aiButton}
          >
            ✨ Get AI Suggestions
          </ThemedButton>
        </View>

        <ThemedCard style={styles.card}>
          <SectionHeader title="Leave Type" subtitle="Choose a leave bucket" />
          {balancesLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: spacing.md }}
            />
          ) : (
            <>
              <View style={styles.typeGrid}>
                {balances.map((balance, index) => (
                  <ThemedButton
                    key={balance.id}
                    variant={
                      leaveType === balance.leave_type ? "primary" : "outline"
                    }
                    onPress={() => setLeaveType(balance.leave_type)}
                    style={[
                      styles.typeButton,
                      index % 2 === 1 && styles.typeButtonNoMargin,
                    ]}
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
          <SectionHeader
            title="Duration"
            subtitle="Select start and end dates"
          />
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <ThemedButton
                variant="outline"
                onPress={() => setShowStartPicker(true)}
              >
                {startDate.toLocaleDateString("en-GB")}
              </ThemedButton>
            </View>
            <View style={[styles.dateField, styles.dateFieldLast]}>
              <Text style={styles.dateLabel}>End Date</Text>
              <ThemedButton
                variant="outline"
                onPress={() => setShowEndPicker(true)}
              >
                {endDate.toLocaleDateString("en-GB")}
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

          <View style={styles.durationSummary}>
            <Text style={styles.durationLabel}>Total Days Requested</Text>
            <Text style={styles.durationValue}>
              {daysRequested} {daysRequested === 1 ? "day" : "days"}
            </Text>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <SectionHeader
            title="Reason"
            subtitle="Help approvers understand your request"
          />
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

        <ThemedCard style={styles.card}>
          <SectionHeader
            title="Medical Certificate"
            subtitle="Upload proof for medical leave"
          />
          <Text
            style={[
              styles.helpText,
              {
                color:
                  "textSecondary" in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Attach a PDF or image certificate (max 5 MB) when applying for
            medical leave.
          </Text>
          <ThemedButton
            variant={certificate ? "secondary" : "outline"}
            onPress={handlePickCertificate}
            style={{ marginTop: spacing.sm }}
          >
            {certificate ? "Replace Certificate" : "Attach Certificate"}
          </ThemedButton>

          {certificate && (
            <View style={styles.certificateMeta}>
              <View>
                <Text
                  style={[
                    styles.certificateName,
                    {
                      color: "text" in colors ? colors.text : colors.onSurface,
                    },
                  ]}
                >
                  {certificate.name}
                </Text>
                <Text
                  style={[
                    styles.certificateDetails,
                    {
                      color:
                        "textSecondary" in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {formatBytes(certificate.size)} •{" "}
                  {certificate.mimeType || "File"}
                </Text>
              </View>
              <ThemedButton
                variant="outline"
                onPress={clearCertificate}
                style={{ minWidth: spacing.xxl * 3 }}
              >
                Remove
              </ThemedButton>
            </View>
          )}

          {certificateError && (
            <Text style={[styles.certificateError, { color: colors.error }]}>
              {certificateError}
            </Text>
          )}
        </ThemedCard>

        <View style={styles.actions}>
          <ThemedButton
            variant="primary"
            onPress={handleSubmit}
            disabled={isSubmitting || balancesLoading}
            style={styles.actionButton}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </ThemedButton>
          <ThemedButton
            variant="outline"
            onPress={handleSaveDraft}
            disabled={isSubmitting || balancesLoading}
            style={styles.actionButton}
          >
            Save as Draft
          </ThemedButton>
        </View>
      </ScrollView>

      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplySuggestion={handleApplySuggestion}
      />
    </>
  );
}
