import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LiquidGlassCard } from '../src/components/ios/LiquidGlassCard';
import { ThemedButton } from '../src/components/shared/ThemedButton';
import { useTheme } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';
import { BiometricAuth } from '../src/auth/BiometricAuth';
import type { User } from '../src/auth/types';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login, setBiometricEnabled } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    const result = await BiometricAuth.checkBiometricSupport();
    setBiometricAvailable(result.isAvailable && result.isEnrolled);
    if (result.biometryType) {
      setBiometricType(BiometricAuth.getBiometricTypeName(result.biometryType));
    }
  };

  const checkStoredCredentials = async () => {
    const isBiometricEnabled = await BiometricAuth.isBiometricEnabled();
    if (isBiometricEnabled) {
      // Auto-trigger biometric auth if enabled
      handleBiometricLogin();
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const isAuthenticated = await BiometricAuth.authenticate();

      if (isAuthenticated) {
        setIsLoading(true);
        const credentials = await BiometricAuth.getStoredCredentials();

        if (credentials) {
          // Simulate API call with stored token
          // In production, validate token with backend
          await simulateLogin(credentials.email, credentials.token);
        } else {
          Alert.alert('Error', 'No stored credentials found. Please login with email and password.');
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert('Authentication Failed', 'Please try again or use email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);

      // Simulate API call
      // In production, replace with actual API call
      const response = await simulateLoginAPI(email, password);

      if (response.success) {
        await login(response.user, response.token, rememberMe);

        // Enable biometric if remember me is checked and biometric is available
        if (rememberMe && biometricAvailable) {
          const enabled = await BiometricAuth.enableBiometric();
          setBiometricEnabled(enabled);
        }

        // Navigate to home
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate API call - Replace with actual API in production
  const simulateLoginAPI = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock successful login
    if (email && password) {
      return {
        success: true,
        user: {
          id: '1',
          employeeId: 'EMP001',
          name: 'John Doe',
          email: email,
          department: 'Engineering',
          role: 'Software Engineer',
        } as User,
        token: 'mock_jwt_token_' + Date.now(),
      };
    }

    return {
      success: false,
      message: 'Invalid email or password',
    };
  };

  const simulateLogin = async (email: string, token: string) => {
    const response = await simulateLoginAPI(email, 'stored_password');
    if (response.success) {
      await login(response.user, token, true);
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#1C1C1E', '#2C2C2E', '#3C3C3E']
          : ['#F0F4F8', '#E8EDF2', '#DFE8F0']
      }
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>
              CDBL Leave
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#E5E5E7' : '#1C1C1E' }]}>
              Companion
            </Text>
          </View>

          {/* Login Card */}
          <LiquidGlassCard style={styles.card}>
            {biometricAvailable && (
              <TouchableOpacity
                style={[styles.biometricButton, { borderColor: colors.primary }]}
                onPress={handleBiometricLogin}
                disabled={isLoading}
              >
                <Fingerprint size={32} color={colors.primary} />
                <Text style={[styles.biometricText, { color: colors.primary }]}>
                  Login with {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {biometricAvailable && (
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
                <Text style={[styles.dividerText, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>
                  or
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Mail size={20} color={isDark ? '#8E8E93' : '#8E8E93'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                placeholder="Email"
                placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Lock size={20} color={isDark ? '#8E8E93' : '#8E8E93'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                placeholder="Password"
                placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                ) : (
                  <Eye size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                )}
              </TouchableOpacity>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: colors.primary,
                    backgroundColor: rememberMe ? colors.primary : 'transparent',
                  },
                ]}
              >
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.rememberMeText, { color: isDark ? '#E5E5E7' : '#1C1C1E' }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <ThemedButton
              onPress={handleEmailPasswordLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </ThemedButton>

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loader}
              />
            )}
          </LiquidGlassCard>

          {/* Footer */}
          <Text style={[styles.footerText, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>
            CDBL Leave Management System
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -8,
  },
  card: {
    padding: 24,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  biometricText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
  },
  eyeIcon: {
    padding: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  loader: {
    marginTop: 16,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 32,
  },
});
