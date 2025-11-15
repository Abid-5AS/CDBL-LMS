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
} from 'lucide-react-native';

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
                            : isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.05)',
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
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.1)',
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
          <View style={[styles.logoutIcon, { backgroundColor: '#F44336' + '20' }]}>
            <LogOut size={22} color="#F44336" />
          </View>
          <Text style={[styles.logoutText, { color: '#F44336' }]}>Logout</Text>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  logoutCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
