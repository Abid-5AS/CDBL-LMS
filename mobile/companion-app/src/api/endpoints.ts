/**
 * API Endpoints Configuration
 *
 * Central location for all backend API endpoints
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
} as const;

export { API_BASE_URL };
