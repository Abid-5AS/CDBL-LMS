import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '../src/components/shared/ThemedCard';
import { ThemedButton } from '../src/components/shared/ThemedButton';
import { useTheme } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';
import { BiometricAuth } from '../src/auth/BiometricAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import {
  Sun,
  Moon,
  Smartphone,
  Fingerprint,
  Info,
  LogOut,
  ChevronRight,
  Bell,
  BellOff,
  User,
  Lock,
  Edit3,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const { preferences, updatePreferences, isInitialized } = useNotifications();
  const [isTogglingBiometric, setIsTogglingBiometric] = useState(false);

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
  };

  const handleBiometricToggle = async (value: boolean) => {
    setIsTogglingBiometric(true);
    try {
      if (value) {
        // Enable biometric
        const enabled = await BiometricAuth.enableBiometric();
        if (enabled) {
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          Alert.alert(
            'Failed',
            'Could not enable biometric authentication. Please check your device settings.'
          );
        }
      } else {
        // Disable biometric
        await BiometricAuth.disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Disabled', 'Biometric authentication disabled');
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to toggle biometric authentication');
    } finally {
      setIsTogglingBiometric(false);
    }
  };

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

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Smartphone },
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
          Settings
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
          Customize your experience
        </Text>
      </View>

      {/* Profile Section */}
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
          PROFILE
        </Text>

        <ThemedCard style={styles.card}>
          <View style={styles.profileContainer}>
            <View
              style={[
                styles.profileAvatar,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <User size={32} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {user?.name || 'User'}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                {user?.email || 'user@example.com'}
              </Text>
              {user?.department && (
                <Text
                  style={[
                    styles.profileDepartment,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {user.department}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.editProfileButton,
                { backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => router.push('/profile')}
            >
              <Edit3 size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </ThemedCard>
      </View>

      {/* Appearance Section */}
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
          APPEARANCE
        </Text>

        <ThemedCard style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
          >
            Theme
          </Text>

          <View style={styles.themeOptions}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = mode === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                  onPress={() => handleThemeChange(option.value)}
                >
                  <Icon
                    size={28}
                    color={isSelected ? colors.primary : isDark ? '#8E8E93' : '#666'}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: isSelected
                          ? colors.primary
                          : 'text' in colors
                          ? colors.text
                          : colors.onSurface,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ThemedCard>
      </View>

      {/* Security Section */}
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
          SECURITY
        </Text>

        <ThemedCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Fingerprint
                size={24}
                color={'text' in colors ? colors.text : colors.onSurface}
              />
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Biometric Authentication
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Use Face ID or Touch ID to login
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={isTogglingBiometric}
              trackColor={{
                false: isDark ? '#48484A' : '#E5E5EA',
                true: colors.primary + '80',
              }}
              thumbColor={biometricEnabled ? colors.primary : '#FFFFFF'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              Alert.alert(
                'Change Password',
                'Password change feature coming soon! Please contact HR for password reset.',
                [{ text: 'OK' }]
              )
            }
          >
            <View style={styles.settingInfo}>
              <Lock
                size={24}
                color={'text' in colors ? colors.text : colors.onSurface}
              />
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Change Password
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Update your password
                </Text>
              </View>
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
        </ThemedCard>
      </View>

      {/* Notifications Section */}
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
          NOTIFICATIONS
        </Text>

        <ThemedCard style={styles.card}>
          {/* Master Notifications Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              {preferences.enabled ? (
                <Bell size={24} color={'text' in colors ? colors.text : colors.onSurface} />
              ) : (
                <BellOff size={24} color={'text' in colors ? colors.text : colors.onSurface} />
              )}
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Enable Notifications
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Receive leave reminders and updates
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreferences({ enabled: value })}
              disabled={!isInitialized}
              trackColor={{
                false: isDark ? '#48484A' : '#E5E5EA',
                true: colors.primary + '80',
              }}
              thumbColor={preferences.enabled ? colors.primary : '#FFFFFF'}
            />
          </View>

          {/* Notification Types */}
          {preferences.enabled && (
            <>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingText}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      Leave Reminders
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Remind me 1 day before leave starts
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.leaveReminders}
                  onValueChange={(value) => updatePreferences({ leaveReminders: value })}
                  trackColor={{
                    false: isDark ? '#48484A' : '#E5E5EA',
                    true: colors.primary + '80',
                  }}
                  thumbColor={preferences.leaveReminders ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingText}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      Low Balance Warnings
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Alert when leave balance is low
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.lowBalanceWarnings}
                  onValueChange={(value) => updatePreferences({ lowBalanceWarnings: value })}
                  trackColor={{
                    false: isDark ? '#48484A' : '#E5E5EA',
                    true: colors.primary + '80',
                  }}
                  thumbColor={preferences.lowBalanceWarnings ? colors.primary : '#FFFFFF'}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingText}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: 'text' in colors ? colors.text : colors.onSurface },
                      ]}
                    >
                      Application Updates
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Notify on submission and status changes
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.applicationUpdates}
                  onValueChange={(value) => updatePreferences({ applicationUpdates: value })}
                  trackColor={{
                    false: isDark ? '#48484A' : '#E5E5EA',
                    true: colors.primary + '80',
                  }}
                  thumbColor={preferences.applicationUpdates ? colors.primary : '#FFFFFF'}
                />
              </View>
            </>
          )}
        </ThemedCard>
      </View>

      {/* About Section */}
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
          ABOUT
        </Text>

        <ThemedCard style={styles.card}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Info
                size={24}
                color={'text' in colors ? colors.text : colors.onSurface}
              />
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  App Version
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Version 1.0.0 (Build 1)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </ThemedCard>
      </View>

      {/* Danger Zone - Logout Button */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: '#F44336',
            },
          ]}
        >
          DANGER ZONE
        </Text>

        <ThemedButton
          variant="outline"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: '#F44336' }]}
        >
          <View style={styles.logoutButtonContent}>
            <LogOut size={20} color="#F44336" />
            <Text style={[styles.logoutButtonText, { color: '#F44336' }]}>
              Logout
            </Text>
          </View>
        </ThemedButton>
      </View>

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
          © 2025 CDBL. All rights reserved.
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
  card: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 13,
    fontWeight: '500',
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    borderWidth: 2,
    marginHorizontal: 20,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
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
