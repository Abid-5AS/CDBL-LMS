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
              <View style={[styles.statIcon, { backgroundColor: '#FF9800' + '20' }]}>
                <Clock size={24} color="#FF9800" />
              </View>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
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
              <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                <CheckCircle size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
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
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
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
                    <View style={[styles.pendingBadge, { backgroundColor: '#FF9800' + '20' }]}>
                      <Text style={[styles.pendingText, { color: '#FF9800' }]}>
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
                <Text style={styles.approveAllText}>Review All Approvals</Text>
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
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
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

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  approvalsList: {
    gap: 12,
    marginBottom: 16,
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  approvalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  approvalDetails: {
    fontSize: 13,
    fontWeight: '500',
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approveAllButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamList: {
    gap: 12,
  },
  teamMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
