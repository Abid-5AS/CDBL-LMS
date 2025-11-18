/**
 * Approvals Screen
 * Allows managers, HR, and CEO to approve or reject leave requests
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeOutUp, LinearTransition, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ThemedCard } from '@/src/components/shared/ThemedCard';
import { ThemedButton } from '@/src/components/shared/ThemedButton';
import { SkeletonCard } from '@/src/components/shared/SkeletonLoader';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useApprovals } from '@/src/hooks/useApprovals';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Calendar, User } from 'lucide-react-native';

export default function ApprovalsScreen() {
  const { colors, isDark } = useTheme();
  const { approvals, isLoading, error, refetch, approveLeave, rejectLeave, isProcessing } =
    useApprovals();
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleApprove = async (id: string, employeeName: string) => {
    Alert.alert(
      'Approve Leave Request',
      `Approve leave request for ${employeeName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(id);
              await approveLeave(id);
              Alert.alert('Success', 'Leave request approved successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string, employeeName: string) => {
    Alert.alert(
      'Reject Leave Request',
      `Reject leave request for ${employeeName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(id);
              await rejectLeave(id, 'Rejected by manager');
              Alert.alert('Success', 'Leave request rejected');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.primary} />
        </ThemedButton>
        <Text
          style={[
            styles.title,
            { color: 'text' in colors ? colors.text : colors.onSurface },
          ]}
        >
          Pending Approvals
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {approvals.length} request{approvals.length !== 1 ? 's' : ''} waiting
        </Text>
      </View>

      {/* Loading State */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        /* Error State */
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load approvals
          </Text>
          <Text
            style={[
              styles.errorSubtext,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            {error.message}
          </Text>
          <ThemedButton variant="primary" onPress={handleRefresh} style={styles.retryButton}>
            Retry
          </ThemedButton>
        </View>
      ) : approvals.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <CheckCircle size={64} color={colors.primary} style={{ opacity: 0.5 }} />
          <Text
            style={[
              styles.emptyTitle,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
          >
            All Caught Up!
          </Text>
          <Text
            style={[
              styles.emptyText,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            No pending approvals at the moment
          </Text>
        </View>
      ) : (
        /* Approvals List */
        <View style={styles.approvalsList}>
          {approvals.map((approval, index) => {
            const isBeingProcessed = processingId === approval.id;

            return (
              <Animated.View
                key={approval.id}
                entering={FadeInDown.delay(index * 100).springify()}
                exiting={FadeOutUp.springify()}
                layout={LinearTransition.springify()}
              >
                <ThemedCard style={styles.approvalCard}>
                {/* Employee Info */}
                <View style={styles.employeeInfo}>
                  <View
                    style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}
                  >
                    <User size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.employeeName,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {approval.employeeName}
                    </Text>
                    <Text
                      style={[
                        styles.employeeDept,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {approval.employeeDepartment} • {approval.employeeId}
                    </Text>
                  </View>
                </View>

                {/* Leave Details */}
                <View style={styles.leaveDetails}>
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Leave Type:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {approval.leaveType}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            'textSecondary' in colors
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
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {approval.workingDays} day{approval.workingDays !== 1 ? 's' : ''}
                      {approval.halfDay && ' (Half Day)'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Dates:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {format(new Date(approval.startDate), 'MMM dd')} -{' '}
                      {format(new Date(approval.endDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Applied:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      {format(new Date(approval.appliedDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>

                {/* Reason Box */}
                <View
                  style={[
                    styles.reasonBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    REASON
                  </Text>
                  <Text
                    style={[
                      styles.reasonText,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {approval.reason}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <ThemedButton
                    variant="outline"
                    onPress={() => handleReject(approval.id, approval.employeeName)}
                    disabled={isBeingProcessed || isProcessing}
                    style={[styles.rejectButton, { borderColor: colors.error }]}
                  >
                    {isBeingProcessed ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <XCircle size={20} color={colors.error} />
                        <Text style={[styles.rejectText, { color: colors.error }]}>
                          Reject
                        </Text>
                      </>
                    )}
                  </ThemedButton>

                  <ThemedButton
                    variant="primary"
                    onPress={() => handleApprove(approval.id, approval.employeeName)}
                    disabled={isBeingProcessed || isProcessing}
                    style={[styles.approveButton, { backgroundColor: colors.success }]}
                  >
                    {isBeingProcessed ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <>
                        <CheckCircle size={20} color={colors.onPrimary} />
                        <Text style={[styles.approveText, { color: colors.onPrimary }]}>Approve</Text>
                      </>
                    )}
                  </ThemedButton>
                </View>
              </ThemedCard>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

import { spacing, radius, typography } from '@/src/theme/designTokens';

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
  backButton: {
    marginBottom: spacing.md,
    width: 50,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl + spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
  },
  errorContainer: {
    alignItems: 'center',
    padding: typography.display.lineHeight,
  },
  errorText: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: radius.md,
    textAlign: 'center',
    marginBottom: radius.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxl + spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.display.fontSize - 8,
    fontWeight: typography.display.fontWeight,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  approvalsList: {
    gap: spacing.md,
  },
  approvalCard: {
    padding: spacing.md,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: spacing.xxl + spacing.sm,
    height: spacing.xxl + spacing.sm,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  employeeDept: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  leaveDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  reasonLabel: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: radius.md,
    lineHeight: typography.heading.lineHeight,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
});
