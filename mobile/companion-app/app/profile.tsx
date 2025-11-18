import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '../src/components/shared/ThemedCard';
import { ThemedButton } from '../src/components/shared/ThemedButton';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useLeaveBalances } from '../src/hooks/useLeaveBalances';
import { useLeaveApplications } from '../src/hooks/useLeaveApplications';
import { apiClient } from '../src/api/client';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
} from 'lucide-react-native';
import { spacing, radius, typography } from '../src/theme/designTokens';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { balances, getTotalAvailable, getTotalUsed } = useLeaveBalances();
  const { applications, isLoading: appsLoading } = useLeaveApplications();

  const isLoading = profileLoading || appsLoading;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear token from API client
              await apiClient.clearToken();
              // Clear auth store
              await logout();
              // Navigate to login
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

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
      color: colors.success,
    },
    {
      label: 'Pending',
      value: pendingApplications,
      icon: Clock,
      color: colors.warning,
    },
    {
      label: 'Rejected',
      value: rejectedApplications,
      icon: XCircle,
      color: colors.error,
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
              {user?.name || profile?.name || 'Employee'}
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
                    {user?.email || profile?.email || 'N/A'}
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
                    {user?.employeeId || profile?.employee_id || 'N/A'}
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
                    {user?.department || profile?.department || 'N/A'}
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
                    {user?.role || profile?.role || 'Employee'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <ThemedButton
              variant="outline"
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut size={20} color={colors.primary} style={styles.logoutIcon} />
              <Text style={[styles.logoutText, { color: colors.primary }]}>
                Logout
              </Text>
            </ThemedButton>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
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
    padding: spacing.xxl,
    alignItems: 'center',
  },
  profileCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: radius.xl,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    width: '100%',
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: spacing.xxl + spacing.xs,
    height: spacing.xxl + spacing.xs,
    borderRadius: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: radius.xl,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: typography.heading.fontWeight,
    textAlign: 'center',
  },
  balanceCard: {
    padding: radius.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  balanceLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  balanceValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: spacing.md,
  },
  logoutButton: {
    marginTop: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
});
