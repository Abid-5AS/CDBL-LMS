/**
 * Login Screen
 * Authentication screen with email/password and biometric login
 */

import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { BiometricAuth } from '@/src/auth/BiometricAuth';
import { Fingerprint, Shield } from 'lucide-react-native';
import { apiClient } from '@/src/api/client';
import { API_ENDPOINTS } from '@/src/api/endpoints';
import { LoginRequest, LoginResponse } from '@/src/api/types';
import { User } from '@/src/auth/types';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Call the login API
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { email, password, skipOtp: !useOtp } as LoginRequest
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      // If OTP is required, navigate to verification screen
      if ((response.data as any).requiresOtp) {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            email: (response.data as any).email,
            userId: (response.data as any).userId,
            expiresIn: (response.data as any).expiresIn,
          },
        });
        return;
      }

      // Direct login flow
      const { user: userData, token } = response.data;

      // Transform API user to auth store User type
      const user: User = {
        id: userData.id,
        employeeId: userData.employeeId,
        name: userData.name,
        email: userData.email,
        department: userData.department,
        role: userData.role,
      };

      // Store token in the API client
      await apiClient.setToken(token);

      // Update auth store
      await login(user, token);

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || error.error || 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const isAvailable = await BiometricAuth.isAvailable();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device');
        return;
      }

      const success = await BiometricAuth.authenticate();
      if (success) {
        // TODO: Implement biometric login with stored credentials
        Alert.alert('Success', 'Biometric authentication successful');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.surface} elevation={1}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            CDBL LMS
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Leave Management System
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoComplete="password"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          <View style={styles.otpToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  borderColor: useOtp ? theme.colors.primary : theme.colors.outline,
                  backgroundColor: useOtp ? theme.colors.primaryContainer : 'transparent',
                },
              ]}
              onPress={() => setUseOtp(!useOtp)}
            >
              <Shield size={16} color={useOtp ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[styles.toggleText, { color: useOtp ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                {useOtp ? 'Enable OTP Verification' : 'Disable OTP Verification'}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Login
          </Button>

          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            icon={() => <Fingerprint size={20} color={theme.colors.primary} />}
            style={styles.button}
          >
            Login with Biometric
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            © 2025 CDBL. All rights reserved.
          </Text>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}

import { spacing, typography, radius } from '@/src/theme/designTokens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  surface: {
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  otpToggle: {
    paddingVertical: spacing.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: typography.body.fontSize,
  },
  button: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.6,
  },
});
