import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BiometricCheckResult } from './types';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const AUTH_CREDENTIALS_KEY = 'auth_credentials';

export class BiometricAuth {
  /**
   * Check if device supports biometric authentication
   */
  static async checkBiometricSupport(): Promise<BiometricCheckResult> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType: BiometricCheckResult['biometryType'] = null;

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = Platform.OS === 'ios' ? 'FaceID' : 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'Iris';
      }

      return {
        isAvailable,
        biometryType,
        isEnrolled,
      };
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return {
        isAvailable: false,
        biometryType: null,
        isEnrolled: false,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  static async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const { isAvailable, isEnrolled } = await this.checkBiometricSupport();

      if (!isAvailable || !isEnrolled) {
        throw new Error('Biometric authentication is not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access CDBL Leave Companion',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  static async enableBiometric(): Promise<boolean> {
    try {
      const { isAvailable, isEnrolled } = await this.checkBiometricSupport();

      if (!isAvailable || !isEnrolled) {
        return false;
      }

      // Test authentication first
      const isAuthenticated = await this.authenticate('Enable biometric authentication');

      if (isAuthenticated) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Store authentication credentials securely
   */
  static async storeCredentials(email: string, token: string): Promise<void> {
    try {
      const credentials = JSON.stringify({ email, token, timestamp: Date.now() });
      await SecureStore.setItemAsync(AUTH_CREDENTIALS_KEY, credentials);
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw error;
    }
  }

  /**
   * Get stored credentials
   */
  static async getStoredCredentials(): Promise<{ email: string; token: string } | null> {
    try {
      const credentials = await SecureStore.getItemAsync(AUTH_CREDENTIALS_KEY);
      if (credentials) {
        const parsed = JSON.parse(credentials);
        return { email: parsed.email, token: parsed.token };
      }
      return null;
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  /**
   * Clear stored credentials
   */
  static async clearCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_CREDENTIALS_KEY);
      await this.disableBiometric();
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  }

  /**
   * Get biometric type name for display
   */
  static getBiometricTypeName(biometryType: BiometricCheckResult['biometryType']): string {
    switch (biometryType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  }
}
