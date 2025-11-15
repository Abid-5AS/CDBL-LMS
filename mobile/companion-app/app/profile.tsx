import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '../src/components/shared/ThemedCard';
import { useTheme } from '../src/providers/ThemeProvider';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useLeaveBalances } from '../src/hooks/useLeaveBalances';
import { useLeaveApplications } from '../src/hooks/useLeaveApplications';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { balances, getTotalAvailable, getTotalUsed } = useLeaveBalances();
  const { applications, isLoading: appsLoading } = useLeaveApplications();

  const isLoading = profileLoading || appsLoading;

  // Calculate statistics
  const totalApplications = applications.length;
  const approvedApplications = applications.filter((app) => app.status === 'approved').length;
  const pendingApplications = applications.filter((app) => app.status === 'pending').length;
  const rejectedApplications = applications.filter((app) => app.status === 'rejected').length;

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications,
      icon: Calendar,
      color: colors.primary,
    },
    {
      label: 'Approved',
      value: approvedApplications,
      icon: CheckCircle,
      color: '#4CAF50',
    },
    {
      label: 'Pending',
      value: pendingApplications,
      icon: Clock,
      color: '#FF9800',
    },
    {
      label: 'Rejected',
      value: rejectedApplications,
      icon: XCircle,
      color: '#F44336',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            { color: 'text' in colors ? colors.text : colors.onSurface },
          ]}
        >
          Profile
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
          Your account information
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Profile Info Card */}
          <ThemedCard style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <User size={48} color={colors.primary} />
            </View>

            <Text
              style={[
                styles.name,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              {profile?.name || 'Employee'}
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Mail size={20} color={colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Email
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {profile?.email || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Briefcase size={20} color={colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Employee ID
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {profile?.employee_id || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Building2 size={20} color={colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Department
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {profile?.department || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <User size={20} color={colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text
                    style={[
                      styles.infoLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Role
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {profile?.role || 'Employee'}
                  </Text>
                </View>
              </View>
            </View>
          </ThemedCard>

          {/* Leave Statistics */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              LEAVE STATISTICS
            </Text>

            <View style={styles.statsGrid}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <ThemedCard key={index} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                      <Icon size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: stat.color }]}>
                      {stat.value}
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
                      {stat.label}
                    </Text>
                  </ThemedCard>
                );
              })}
            </View>
          </View>

          {/* Leave Balance Summary */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              LEAVE BALANCE
            </Text>

            <ThemedCard style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text
                  style={[
                    styles.balanceLabel,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Total Available
                </Text>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>
                  {getTotalAvailable()} days
                </Text>
              </View>

              <View style={styles.balanceRow}>
                <Text
                  style={[
                    styles.balanceLabel,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Total Used
                </Text>
                <Text
                  style={[
                    styles.balanceValue,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  {getTotalUsed()} days
                </Text>
              </View>

              <View style={styles.balanceDivider} />

              {balances.slice(0, 3).map((balance) => (
                <View key={balance.id} style={styles.balanceRow}>
                  <Text
                    style={[
                      styles.balanceLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {balance.leave_type}
                  </Text>
                  <Text
                    style={[
                      styles.balanceValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {balance.available_days}/{balance.total_days}
                  </Text>
                </View>
              ))}
            </ThemedCard>
          </View>
        </>
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
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
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
    padding: 60,
    alignItems: 'center',
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  infoGrid: {
    width: '100%',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
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
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  balanceCard: {
    padding: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 12,
  },
});
