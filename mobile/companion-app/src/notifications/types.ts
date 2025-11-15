/**
 * Notification Types
 */

export type NotificationType =
  | 'leave_reminder'
  | 'low_balance'
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'balance_updated';

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  enabled: boolean;
  leaveReminders: boolean;
  lowBalanceWarnings: boolean;
  applicationUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  leaveReminders: true,
  lowBalanceWarnings: true,
  applicationUpdates: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  sound: true,
  vibration: true,
};
