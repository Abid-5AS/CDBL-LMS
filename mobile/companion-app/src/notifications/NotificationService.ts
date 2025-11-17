/**
 * Notification Service
 *
 * Handles local notifications for leave reminders and updates
 * Note: This is for LOCAL notifications only (no backend required)
 * Falls back to console logging if native module is unavailable
 */

import { Platform } from 'react-native';

// Safely import AsyncStorage with fallback
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('[NotificationService] AsyncStorage not available, using in-memory fallback');
  const memoryStore: { [key: string]: string } = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStore[key] || null,
    setItem: async (key: string, value: string) => {
      memoryStore[key] = value;
    },
    removeItem: async (key: string) => {
      delete memoryStore[key];
    },
  };
}

import {
  NotificationType,
  NotificationContent,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './types';

let Notifications: any = null;

// Safely import Notifications with fallback
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('[NotificationService] expo-notifications not available, using fallback mode');
  // Provide a mock implementation
  Notifications = {
    setNotificationHandler: () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    setNotificationChannelAsync: async () => {},
    scheduleNotificationAsync: async () => Math.random().toString(),
    cancelScheduledNotificationAsync: async () => {},
    cancelAllScheduledNotificationsAsync: async () => {},
    getAllScheduledNotificationsAsync: async () => [],
    addNotificationReceivedListener: () => ({}),
    addNotificationResponseReceivedListener: () => ({}),
    AndroidImportance: { HIGH: 4 },
  };
}

const PREFERENCES_KEY = 'notification_preferences';

// Configure notification behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('[NotificationService] Could not set notification handler:', error);
}

class NotificationService {
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private initialized: boolean = false;

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[NotificationService] Notification permissions not granted');
        // Continue anyway - we're in fallback mode
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Leave Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF9800',
          });
        } catch (error) {
          console.log('[NotificationService] Could not set Android channel:', error);
        }
      }

      // Load preferences
      await this.loadPreferences();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      // Initialize anyway in fallback mode
      this.initialized = true;
      return false;
    }
  }

  /**
   * Load notification preferences
   */
  private async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to load preferences:', error);
    }
  }

  /**
   * Save notification preferences
   */
  async savePreferences(preferences: Partial<NotificationPreferences>) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[NotificationService] Failed to save preferences:', error);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  /**
   * Check if we're in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { quietHoursStart, quietHoursEnd } = this.preferences;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (quietHoursStart > quietHoursEnd) {
      return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
    }

    return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    type: NotificationType,
    content: NotificationContent,
    triggerDate: Date
  ): Promise<string | null> {
    if (!this.initialized || !this.preferences.enabled) {
      console.log('[NotificationService] Notifications disabled or not initialized');
      return null;
    }

    // Check type-specific preferences
    if (
      (type === 'leave_reminder' && !this.preferences.leaveReminders) ||
      (type === 'low_balance' && !this.preferences.lowBalanceWarnings) ||
      (['application_submitted', 'application_approved', 'application_rejected', 'balance_updated'].includes(type) &&
        !this.preferences.applicationUpdates)
    ) {
      console.log(`[NotificationService] Notifications disabled for type: ${type}`);
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: { type, ...content.data },
          sound: this.preferences.sound,
          vibrate: this.preferences.vibration ? [0, 250, 250, 250] : undefined,
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log(`[NotificationService] Scheduled notification ${notificationId} for ${triggerDate}`);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Send immediate notification
   */
  async sendNotification(type: NotificationType, content: NotificationContent): Promise<string | null> {
    if (!this.initialized || !this.preferences.enabled) {
      console.log('[NotificationService] Notifications disabled or not initialized');
      return null;
    }

    if (this.isInQuietHours()) {
      console.log('[NotificationService] In quiet hours, skipping notification');
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: { type, ...content.data },
          sound: this.preferences.sound,
          vibrate: this.preferences.vibration ? [0, 250, 250, 250] : undefined,
        },
        trigger: null, // Send immediately
      });

      console.log(`[NotificationService] Sent immediate notification ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      return null;
    }
  }

  /**
   * Schedule leave reminder (1 day before)
   */
  async scheduleLeaveReminder(leaveId: string, leaveType: string, startDate: Date) {
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM the day before

    // Don't schedule if reminder is in the past
    if (reminderDate < new Date()) {
      return null;
    }

    return await this.scheduleNotification(
      'leave_reminder',
      {
        title: 'Leave Reminder',
        body: `Your ${leaveType} starts tomorrow`,
        data: { leaveId },
      },
      reminderDate
    );
  }

  /**
   * Send low balance warning
   */
  async sendLowBalanceWarning(leaveType: string, availableDays: number) {
    return await this.sendNotification('low_balance', {
      title: 'Low Leave Balance',
      body: `You have only ${availableDays} days of ${leaveType} remaining`,
      data: { leaveType, availableDays },
    });
  }

  /**
   * Send application submitted notification
   */
  async sendApplicationSubmitted(leaveType: string, startDate: string, endDate: string) {
    return await this.sendNotification('application_submitted', {
      title: 'Leave Application Submitted',
      body: `Your ${leaveType} from ${startDate} to ${endDate} has been submitted`,
      data: { leaveType, startDate, endDate },
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`[NotificationService] Cancelled notification ${notificationId}`);
    } catch (error) {
      console.error('[NotificationService] Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationService] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[NotificationService] Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    if (onNotificationReceived) {
      Notifications.addNotificationReceivedListener(onNotificationReceived);
    }

    if (onNotificationResponse) {
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
