/**
 * Manager Dashboard Component
 * Shows pending approvals, team stats, and who's on leave
 * Used by Manager, HR, and CEO roles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ThemedCard } from '../shared/ThemedCard';
import { useTheme } from '../../providers/ThemeProvider';
import { useTeamStats } from '../../hooks/useTeamStats';
import { useApprovals } from '../../hooks/useApprovals';
import { Users, Clock, CheckCircle, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';

interface ManagerDashboardProps {
  userName: string;
  userRole: string;
}

export function ManagerDashboard({ userName, userRole }: ManagerDashboardProps) {
  const { colors, isDark } = useTheme();
  const { stats, teamOnLeave, isLoading: statsLoading } = useTeamStats();
  const { approvals, isLoading: approvalsLoading } = useApprovals();

  const isLoading = statsLoading || approvalsLoading;

  return (
    <>
      <Animated.View style={styles.header} entering={FadeIn.duration(600)}>
        <Text
          style={[
            styles.greeting,
            {
              color:
                'textSecondary' in colors
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
            { color: 'text' in colors ? colors.text : colors.onSurface },
          ]}
        >
          {userName}
        </Text>
        <Text
          style={[
            styles.role,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {userRole}
        </Text>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Team Stats Grid */}
          <Animated.View style={styles.statsGrid} entering={FadeInDown.delay(200).springify()}>
            <ThemedCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                <Users size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats?.totalEmployees || 0}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Team Members
              </Text>
            </ThemedCard>

            <ThemedCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warningContainer }]}>
                <Clock size={24} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {stats?.pendingApprovals || approvals.length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Pending
              </Text>
            </ThemedCard>

            <ThemedCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.successContainer }]}>
                <CheckCircle size={24} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {stats?.approvedThisMonth || 0}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Approved
              </Text>
            </ThemedCard>
          </Animated.View>

          {/* Quick Approve Section */}
          {approvals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <ThemedCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Quick Approve ({approvals.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/approvals')}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.approvalsList}>
                {approvals.slice(0, 3).map((approval) => (
                  <TouchableOpacity
                    key={approval.id}
                    style={[
                      styles.approvalItem,
                      {
                        backgroundColor: colors.surfaceVariant,
                      },
                    ]}
                    onPress={() => router.push('/approvals')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.approvalName,
                          { color: 'text' in colors ? colors.text : colors.onSurface },
                        ]}
                      >
                        {approval.employeeName}
                      </Text>
                      <Text
                        style={[
                          styles.approvalDetails,
                          {
                            color:
                              'textSecondary' in colors
                                ? colors.textSecondary
                                : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {approval.leaveType} • {approval.workingDays} days
                      </Text>
                    </View>
                    <View style={[styles.pendingBadge, { backgroundColor: colors.warningContainer }]}>
                      <Text style={[styles.pendingText, { color: colors.warning }]}>
                        Pending
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.approveAllButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/approvals')}
              >
                <Text style={[styles.approveAllText, { color: colors.onPrimary }]}>Review All Approvals</Text>
              </TouchableOpacity>
            </ThemedCard>
            </Animated.View>
          )}

          {/* Who's On Leave Today */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                On Leave Today
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {stats?.onLeaveToday || teamOnLeave.length}
                </Text>
              </View>
            </View>

            {teamOnLeave.length > 0 ? (
              <View style={styles.teamList}>
                {teamOnLeave.map((member) => (
                  <View
                    key={member.employeeId}
                    style={[
                      styles.teamMemberItem,
                      {
                        backgroundColor: colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Calendar size={20} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.memberName,
                          { color: 'text' in colors ? colors.text : colors.onSurface },
                        ]}
                      >
                        {member.employeeName}
                      </Text>
                      <Text
                        style={[
                          styles.memberDetails,
                          {
                            color:
                              'textSecondary' in colors
                                ? colors.textSecondary
                                : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {member.leaveType} • {member.department}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
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
                No one is on leave today
              </Text>
            )}
          </ThemedCard>
          </Animated.View>
        </>
      )}
    </>
  );
}

import { spacing, radius, typography } from '../../theme/designTokens';

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    paddingTop: radius.lg,
  },
  greeting: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  role: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl + spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: spacing.xxl + spacing.sm,
    height: spacing.xxl + spacing.sm,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: typography.display.fontSize - 4,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.caption.fontSize - 1,
    fontWeight: typography.heading.fontWeight,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  viewAllText: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
  },
  approvalsList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  approvalName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  approvalDetails: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  pendingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  pendingText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  approveAllButton: {
    padding: radius.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  approveAllText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  countText: {
    fontSize: radius.md,
    fontWeight: typography.display.fontWeight,
  },
  teamList: {
    gap: spacing.md,
  },
  teamMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  memberName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  memberDetails: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  emptyText: {
    fontSize: radius.md,
    textAlign: 'center',
    paddingVertical: radius.lg,
  },
});
