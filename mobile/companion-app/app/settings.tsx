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
import {
  Sun,
  Moon,
  Smartphone,
  Fingerprint,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
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

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <ThemedButton
          variant="outline"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: '#F44336' }]}
        >
          Logout
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
  logoutContainer: {
    marginTop: 24,
  },
  logoutButton: {
    borderWidth: 2,
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
