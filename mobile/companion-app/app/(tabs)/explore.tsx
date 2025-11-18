import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '@/src/components/shared/ThemedCard';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useAuthStore } from '@/src/store/authStore';
import {
  User,
  Settings,
  HelpCircle,
  Info,
  FileText,
  Shield,
  MessageSquare,
  ChevronRight,
  LogOut,
  Sparkles,
  Users,
  BarChart3,
} from 'lucide-react-native';
import { spacing, radius, typography } from '@/src/theme/designTokens';

export default function MoreScreen() {
  const { colors, isDark } = useTheme();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const menuSections = [
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'View and edit your profile',
          onPress: () => router.push('/profile'),
        },
        {
          icon: Settings,
          label: 'Settings',
          description: 'App preferences and security',
          onPress: () => router.push('/settings'),
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          icon: Users,
          label: 'User Management',
          description: 'Manage users, roles, and permissions',
          onPress: () => router.push('/admin/users'),
          adminOnly: true,
        },
        {
          icon: BarChart3,
          label: 'Analytics Dashboard',
          description: 'View leave reports and insights',
          onPress: () => router.push('/reports'),
        },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        {
          icon: Sparkles,
          label: 'AI Leave Assistant',
          description: 'Get smart leave suggestions powered by AI',
          onPress: () => router.push('/ai-assistant'),
          highlighted: true,
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get answers to common questions',
          onPress: () => Alert.alert('Help & FAQ', 'Coming soon!'),
        },
        {
          icon: MessageSquare,
          label: 'Contact Support',
          description: 'Get help from our team',
          onPress: () => Alert.alert('Contact Support', 'Email: support@cdbl.com'),
        },
      ],
    },
    {
      title: 'LEGAL',
      items: [
        {
          icon: FileText,
          label: 'Leave Policies',
          description: 'View company leave policies',
          onPress: () => Alert.alert('Leave Policies', 'Coming soon!'),
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          description: 'How we protect your data',
          onPress: () => Alert.alert('Privacy Policy', 'Coming soon!'),
        },
        {
          icon: Info,
          label: 'About',
          description: 'App version and information',
          onPress: () =>
            Alert.alert(
              'About',
              'CDBL Leave Companion\nVersion 1.0.0 (Build 1)\n\n© 2025 CDBL. All rights reserved.'
            ),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: 'text' in colors ? colors.text : colors.onSurface },
          ]}
        >
          More
        </Text>
        {user && (
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
            {user.name}
          </Text>
        )}
      </View>

      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
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
            {section.title}
          </Text>

          <ThemedCard style={styles.menuCard}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isLast = itemIndex === section.items.length - 1;

              return (
                <View key={itemIndex}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      item.highlighted && {
                        backgroundColor: colors.primary + '08',
                      },
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIcon,
                        {
                          backgroundColor: item.highlighted
                            ? colors.primary + '20'
                            : colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Icon size={22} color={colors.primary} />
                    </View>

                    <View style={styles.menuText}>
                      <Text
                        style={[
                          styles.menuLabel,
                          { color: 'text' in colors ? colors.text : colors.onSurface },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.menuDescription,
                          {
                            color:
                              'textSecondary' in colors
                                ? colors.textSecondary
                                : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>

                    <ChevronRight
                      size={20}
                      color={
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant
                      }
                    />
                  </TouchableOpacity>

                  {!isLast && (
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor: colors.border,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </ThemedCard>
        </View>
      ))}

      {/* Logout Button */}
      <ThemedCard style={styles.logoutCard}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={[styles.logoutIcon, { backgroundColor: colors.error + '20' }]}>
            <LogOut size={22} color={colors.error} />
          </View>
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </ThemedCard>

      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          CDBL Leave Management System
        </Text>
        <Text
          style={[
            styles.footerText,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

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
  title: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuIcon: {
    width: typography.display.lineHeight,
    height: typography.display.lineHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs / 2,
  },
  menuDescription: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  divider: {
    height: 1,
    marginLeft: spacing.xxl + spacing.xl,
  },
  logoutCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutIcon: {
    width: typography.display.lineHeight,
    height: typography.display.lineHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoutText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  footer: {
    marginTop: typography.display.lineHeight,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
});
