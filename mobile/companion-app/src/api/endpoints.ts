/**
 * API Endpoints Configuration
 *
 * Central location for all backend API endpoints
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Determine the API base URL based on environment and platform
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (set in .env or eas.json)
 * 2. Development mode detection:
 *    - Android Emulator: http://10.0.2.2:3000
 *    - iOS Simulator/Real Device: Use local network IP
 * 3. Production fallback (should always set EXPO_PUBLIC_API_URL in production)
 */
function getApiBaseUrl(): string {
  // Priority 1: Use environment variable if set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 2: Development mode with platform-specific defaults
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android Emulator uses 10.0.2.2 to access host machine
      // Real Android device needs LAN IP (set via EXPO_PUBLIC_API_URL)
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
      if (debuggerHost) {
        return `http://${debuggerHost}:3000`;
      }
      // Fallback for Android Emulator
      return 'http://10.0.2.2:3000';
    } else {
      // iOS Simulator/Device: try to use the debugger host
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
      if (debuggerHost) {
        return `http://${debuggerHost}:3000`;
      }
    }
  }

  // Priority 3: Production fallback (should be configured via env)
  console.warn('⚠️ API_BASE_URL not configured! Set EXPO_PUBLIC_API_URL in your environment.');
  return 'https://your-production-api.com';
}

const API_BASE_URL = getApiBaseUrl();

// Log the API URL in development for debugging
if (__DEV__) {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },

  // User Profile
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    BALANCE: '/api/user/balance',
  },

  // Leave Applications
  LEAVES: {
    LIST: '/api/leaves',
    CREATE: '/api/leaves',
    GET: (id: string) => `/api/leaves/${id}`,
    UPDATE: (id: string) => `/api/leaves/${id}`,
    DELETE: (id: string) => `/api/leaves/${id}`,
  },

  // Sync Operations
  SYNC: {
    UPLOAD: '/api/sync/upload',
    DOWNLOAD: '/api/sync/download',
    STATUS: '/api/sync/status',
  },

  // Calendar & Holidays
  CALENDAR: {
    HOLIDAYS: '/api/holidays',
    TEAM_CALENDAR: '/api/calendar',
  },

  // Notifications
  NOTIFICATIONS: {
    REGISTER: '/api/notifications/register',
    LIST: '/api/notifications',
  },

  // Manager & Approvals
  MANAGER: {
    PENDING_APPROVALS: '/api/manager/pending',
    TEAM_OVERVIEW: '/api/manager/team-overview',
    TEAM_ON_LEAVE: '/api/manager/team-on-leave',
  },

  // Approvals (for all approval roles)
  APPROVALS: {
    PENDING: '/api/approvals/pending',
    DECISION: (id: string) => `/api/approvals/${id}/decision`,
    HISTORY: '/api/approvals/history',
  },

  // Admin - User Management
  ADMIN_USERS: {
    LIST: '/api/admin/users',
    GET: (id: string) => `/api/admin/users/${id}`,
    CREATE: '/api/admin/users',
    UPDATE: (id: string) => `/api/admin/users/${id}`,
    DELETE: (id: string) => `/api/admin/users/${id}`,
    UPDATE_ROLE: (id: string) => `/api/admin/users/${id}/role`,
    DEACTIVATE: (id: string) => `/api/admin/users/${id}/deactivate`,
  },

  // Reports & Analytics
  REPORTS: {
    ANALYTICS: '/api/reports/analytics',
    LEAVE_DISTRIBUTION: '/api/reports/leave-distribution',
    TRENDS: '/api/reports/trends',
    SUMMARY: '/api/reports/summary',
  },

  // Settings
  SETTINGS: {
    PROFILE: '/api/settings/profile',
    UPDATE_PROFILE: '/api/settings/profile',
    CHANGE_PASSWORD: '/api/settings/change-password',
    PREFERENCES: '/api/settings/preferences',
    SECURITY: '/api/settings/security',
  },
} as const;

export { API_BASE_URL };
