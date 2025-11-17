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
