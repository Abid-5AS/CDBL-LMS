/**
 * Login Screen
 * Authentication screen with email/password and biometric login
 */

import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { BiometricAuth } from '@/src/auth/BiometricAuth';
import { Fingerprint } from 'lucide-react-native';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric Login = async () => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.6,
  },
});
