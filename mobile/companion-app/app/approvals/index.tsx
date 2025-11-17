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
          <Text style={[styles.errorText, { color: '#F44336' }]}>
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
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
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
                    style={[styles.rejectButton, { borderColor: '#F44336' }]}
                  >
                    {isBeingProcessed ? (
                      <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                      <>
                        <XCircle size={20} color="#F44336" />
                        <Text style={[styles.rejectText, { color: '#F44336' }]}>
                          Reject
                        </Text>
                      </>
                    )}
                  </ThemedButton>

                  <ThemedButton
                    variant="primary"
                    onPress={() => handleApprove(approval.id, approval.employeeName)}
                    disabled={isBeingProcessed || isProcessing}
                    style={[styles.approveButton, { backgroundColor: '#4CAF50' }]}
                  >
                    {isBeingProcessed ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.approveText}>Approve</Text>
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
  backButton: {
    marginBottom: 12,
    width: 50,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  approvalsList: {
    gap: 16,
  },
  approvalCard: {
    padding: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeeDept: {
    fontSize: 13,
    fontWeight: '500',
  },
  leaveDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
