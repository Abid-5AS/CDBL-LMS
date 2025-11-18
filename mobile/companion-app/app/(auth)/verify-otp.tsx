/**
 * OTP Verification Screen
 * Used for two-factor authentication via OTP code
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { apiClient } from '@/src/api/client';
import { API_ENDPOINTS } from '@/src/api/endpoints';
import { LoginResponse } from '@/src/api/types';
import { User } from '@/src/auth/types';
import { Clock } from 'lucide-react-native';

interface OTPState {
  email: string;
  userId: string;
  expiresIn: number;
}

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [otpState, setOtpState] = useState<OTPState | null>(null);
  const login = useAuthStore((state) => state.login);

  // Get OTP state from route params
  useEffect(() => {
    const state = router.canGoBack() ? (router as any).params : null;
    if (state?.email && state?.userId) {
      setOtpState({
        email: state.email,
        userId: state.userId,
        expiresIn: state.expiresIn || 600,
      });
      setTimeLeft(state.expiresIn || 600);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      Alert.alert('OTP Expired', 'Your verification code has expired. Please login again.');
      router.replace('/(auth)/login');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otpState) {
      Alert.alert('Error', 'Missing verification data. Please try again.');
      router.replace('/(auth)/login');
      return;
    }

    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid verification code');
      return;
    }

    setLoading(true);
    try {
      // Call OTP verification endpoint
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        { email: otpState.email, code: otp }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'OTP verification failed');
      }

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

      // Store token
      await apiClient.setToken(token);

      // Update auth store
      await login(user, token);

      // Navigate to home
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || error.error || 'Invalid verification code. Please try again.';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!otpState) return;

    Alert.alert('Resend OTP', 'Resend functionality will be implemented to send a new code to your email.');
    // TODO: Implement resend OTP logic
  };

  if (!otpState) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Surface style={styles.surface} elevation={1}>
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>Loading...</Text>
          </View>
        </Surface>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.surface} elevation={1}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Verify Your Identity
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter the code sent to {otpState.email}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.timerContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Clock size={20} color={theme.colors.error} />
            <Text style={[styles.timerText, { color: theme.colors.error }]}>
              Code expires in: {formatTime(timeLeft)}
            </Text>
          </View>

          <TextInput
            label="Verification Code"
            value={otp}
            onChangeText={setOtp}
            mode="outlined"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            loading={loading}
            disabled={loading || otp.length < 4}
            style={styles.button}
          >
            Verify
          </Button>

          <Button
            mode="text"
            onPress={handleResendOTP}
            disabled={loading}
            style={styles.button}
          >
            Didn't receive code? Resend
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

import { spacing, radius } from '@/src/theme/designTokens';

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
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  timerText: {
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'transparent',
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
