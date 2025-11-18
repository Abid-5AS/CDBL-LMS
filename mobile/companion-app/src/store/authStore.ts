import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState } from '../auth/types';
import { BiometricAuth } from '../auth/BiometricAuth';
import { saveUserProfile, getUserProfile, clearAllData } from '../database';

const TOKEN_KEY = 'auth_token';

const AUTH_TIMEOUT = 15 * 60 * 1000; // 15 minutes

interface AuthActions {
  login: (user: User, token: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  refreshAuthTime: () => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  biometricEnabled: false,
  lastAuthTime: null,

  // Actions
  login: async (user: User, token: string, rememberMe = false) => {
    try {
      set({ isLoading: true });

      // Save user profile to database
      await saveUserProfile({
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
      });

      // Store credentials if remember me is enabled
      if (rememberMe) {
        await BiometricAuth.storeCredentials(user.email, token);
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        lastAuthTime: Date.now(),
      });
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear stored credentials
      await BiometricAuth.clearCredentials();

      // Clear database
      await clearAllData();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        biometricEnabled: false,
        lastAuthTime: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });

      // Check if a valid auth token exists
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!token) {
        // No token = not authenticated
        console.log('No auth token found, user not authenticated');
        set({ isLoading: false });
        return false;
      }

      // Check if user profile exists in database
      const profile = await getUserProfile();

      if (profile) {
        const user: User = {
          id: String(profile.id),
          employeeId: profile.employee_id as string,
          name: profile.name as string,
          email: profile.email as string,
          department: profile.department as string,
          role: profile.role as string,
        };

        // Check if biometric is enabled
        const biometricEnabled = await BiometricAuth.isBiometricEnabled();

        set({
          user,
          isAuthenticated: true,
          biometricEnabled,
          lastAuthTime: Date.now(),
          isLoading: false,
        });

        console.log('✅ Auth status verified: user authenticated with valid token');
        return true;
      }

      // Token exists but no profile - inconsistent state, clear token
      console.warn('Token exists but no user profile found - clearing token');
      await SecureStore.deleteItemAsync(TOKEN_KEY);

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Check auth status error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  setBiometricEnabled: (enabled: boolean) => {
    set({ biometricEnabled: enabled });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  refreshAuthTime: () => {
    set({ lastAuthTime: Date.now() });
  },

  isSessionValid: () => {
    const { lastAuthTime, isAuthenticated } = get();

    if (!isAuthenticated || !lastAuthTime) {
      return false;
    }

    const timeSinceAuth = Date.now() - lastAuthTime;
    return timeSinceAuth < AUTH_TIMEOUT;
  },
}));
