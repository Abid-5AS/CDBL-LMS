/**
 * Notification Service
 *
 * Handles local notifications for leave reminders and updates
 * Note: This is for LOCAL notifications only (no backend required)
 */

import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";

type NotificationsModule = typeof ExpoNotifications;

let notificationsModule: NotificationsModule | null = null;
let notificationsLoadAttempted = false;

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (notificationsModule || notificationsLoadAttempted) {
    return notificationsModule;
  }

  notificationsLoadAttempted = true;

  try {
    const mod = (await import("expo-notifications")) as NotificationsModule;
    notificationsModule = mod;
    return notificationsModule;
  } catch (error) {
    console.warn(
      "[NotificationService] expo-notifications module unavailable; notifications disabled",
      error
    );
    return null;
  }
}

// Lazy-load AsyncStorage to avoid initialization before React Native bridge is ready
let AsyncStorage: any = null;

async function getAsyncStorage(): Promise<any> {
  if (AsyncStorage) {
    return AsyncStorage;
  }

  try {
    // Try to load AsyncStorage dynamically
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    if (AS && typeof AS.getItem === 'function') {
      AsyncStorage = AS;
      return AsyncStorage;
    }
  } catch (asyncError) {
    console.warn(
      '[NotificationService] AsyncStorage not available:',
      asyncError instanceof Error ? asyncError.message : 'Unknown error'
    );
  }

  // Fallback to in-memory storage
  console.warn('[NotificationService] Using in-memory storage for notifications');
  const memoryStore: { [key: string]: string } = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStore[key] || null,
    setItem: async (key: string, value: string) => { memoryStore[key] = value; },
    removeItem: async (key: string) => { delete memoryStore[key]; },
  };

  return AsyncStorage;
}

import {
  NotificationType,
  NotificationContent,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "./types";

const PREFERENCES_KEY = "notification_preferences";

class NotificationService {
  private preferences: NotificationPreferences =
    DEFAULT_NOTIFICATION_PREFERENCES;
  private initialized: boolean = false;
  private notifications: NotificationsModule | null = null;

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (!this.notifications) {
        this.notifications = await loadNotificationsModule();
      }

      if (!this.notifications) {
        console.warn(
          "[NotificationService] Running without native notifications module"
        );
        this.initialized = true;
        return false;
      }

      // Check if setNotificationHandler method exists before calling
      if (
        typeof this.notifications.setNotificationHandler === "function"
      ) {
        try {
          this.notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } catch (error) {
          console.log(
            "[NotificationService] Could not set notification handler:",
            error
          );
        }
      } else {
        console.warn(
          "[NotificationService] setNotificationHandler method not available"
        );
      }

      // Request permissions - check if method exists
      if (typeof this.notifications.getPermissionsAsync === "function") {
        try {
          const { status: existingStatus } =
            await this.notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== "granted") {
            if (
              typeof this.notifications.requestPermissionsAsync === "function"
            ) {
              const { status } =
                await this.notifications.requestPermissionsAsync();
              finalStatus = status;
            }
          }

          if (finalStatus !== "granted") {
            console.warn(
              "[NotificationService] Notification permissions not granted"
            );
            // Continue anyway - notifications are not critical for app functionality
          }
        } catch (error) {
          console.warn(
            "[NotificationService] Error requesting notification permissions:",
            error
          );
        }
      } else {
        console.warn(
          "[NotificationService] getPermissionsAsync method not available (possible New Architecture compatibility issue)"
        );
      }

      // Configure notification channel for Android
      if (Platform.OS === "android") {
        if (
          typeof this.notifications.setNotificationChannelAsync === "function"
        ) {
          try {
            const androidImportance =
              this.notifications.AndroidImportance?.HIGH ||
              this.notifications.AndroidImportance?.DEFAULT;
            await this.notifications.setNotificationChannelAsync("default", {
              name: "Leave Notifications",
              importance: androidImportance,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#FF9800",
            });
          } catch (error) {
            console.log(
              "[NotificationService] Could not set Android channel:",
              error
            );
          }
        } else {
          console.warn(
            "[NotificationService] setNotificationChannelAsync method not available"
          );
        }
      }

      // Load preferences
      await this.loadPreferences();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("[NotificationService] Initialization failed:", error);
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
      const storage = await getAsyncStorage();
      const stored = await storage.getItem(PREFERENCES_KEY);
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error("[NotificationService] Failed to load preferences:", error);
    }
  }

  /**
   * Save notification preferences
   */
  async savePreferences(preferences: Partial<NotificationPreferences>) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      const storage = await getAsyncStorage();
      await storage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error("[NotificationService] Failed to save preferences:", error);
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
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString().padStart(2, "0")}`;

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
    if (!this.notifications) {
      console.log(
        "[NotificationService] Notifications module unavailable; cannot schedule notification"
      );
      return null;
    }

    if (!this.initialized || !this.preferences.enabled) {
      console.log(
        "[NotificationService] Notifications disabled or not initialized"
      );
      return null;
    }

    // Check type-specific preferences
    if (
      (type === "leave_reminder" && !this.preferences.leaveReminders) ||
      (type === "low_balance" && !this.preferences.lowBalanceWarnings) ||
      ([
        "application_submitted",
        "application_approved",
        "application_rejected",
        "balance_updated",
      ].includes(type) &&
        !this.preferences.applicationUpdates)
    ) {
      console.log(
        `[NotificationService] Notifications disabled for type: ${type}`
      );
      return null;
    }

    // Check if method is available
    if (typeof this.notifications.scheduleNotificationAsync !== "function") {
      console.warn(
        "[NotificationService] scheduleNotificationAsync method not available"
      );
      return null;
    }

    try {
      const notificationId = await this.notifications.scheduleNotificationAsync({
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

      console.log(
        `[NotificationService] Scheduled notification ${notificationId} for ${triggerDate}`
      );
      return notificationId;
    } catch (error) {
      console.error(
        "[NotificationService] Failed to schedule notification:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * Send immediate notification
   */
  async sendNotification(
    type: NotificationType,
    content: NotificationContent
  ): Promise<string | null> {
    if (!this.notifications) {
      console.log(
        "[NotificationService] Notifications module unavailable; cannot send notification"
      );
      return null;
    }

    if (!this.initialized || !this.preferences.enabled) {
      console.log(
        "[NotificationService] Notifications disabled or not initialized"
      );
      return null;
    }

    if (this.isInQuietHours()) {
      console.log(
        "[NotificationService] In quiet hours, skipping notification"
      );
      return null;
    }

    // Check if method is available
    if (typeof this.notifications.scheduleNotificationAsync !== "function") {
      console.warn(
        "[NotificationService] scheduleNotificationAsync method not available"
      );
      return null;
    }

    try {
      const notificationId = await this.notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: { type, ...content.data },
          sound: this.preferences.sound,
          vibrate: this.preferences.vibration ? [0, 250, 250, 250] : undefined,
        },
        trigger: null, // Send immediately
      });

      console.log(
        `[NotificationService] Sent immediate notification ${notificationId}`
      );
      return notificationId;
    } catch (error) {
      console.error(
        "[NotificationService] Failed to send notification:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * Schedule leave reminder (1 day before)
   */
  async scheduleLeaveReminder(
    leaveId: string,
    leaveType: string,
    startDate: Date
  ) {
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM the day before

    // Don't schedule if reminder is in the past
    if (reminderDate < new Date()) {
      return null;
    }

    return await this.scheduleNotification(
      "leave_reminder",
      {
        title: "Leave Reminder",
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
    return await this.sendNotification("low_balance", {
      title: "Low Leave Balance",
      body: `You have only ${availableDays} days of ${leaveType} remaining`,
      data: { leaveType, availableDays },
    });
  }

  /**
   * Send application submitted notification
   */
  async sendApplicationSubmitted(
    leaveType: string,
    startDate: string,
    endDate: string
  ) {
    return await this.sendNotification("application_submitted", {
      title: "Leave Application Submitted",
      body: `Your ${leaveType} from ${startDate} to ${endDate} has been submitted`,
      data: { leaveType, startDate, endDate },
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string) {
    if (!this.notifications) {
      return;
    }

    if (
      typeof this.notifications.cancelScheduledNotificationAsync !== "function"
    ) {
      console.warn(
        "[NotificationService] cancelScheduledNotificationAsync method not available"
      );
      return;
    }

    try {
      await this.notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(
        `[NotificationService] Cancelled notification ${notificationId}`
      );
    } catch (error) {
      console.error(
        "[NotificationService] Failed to cancel notification:",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    if (!this.notifications) {
      return;
    }

    if (
      typeof this.notifications.cancelAllScheduledNotificationsAsync !== "function"
    ) {
      console.warn(
        "[NotificationService] cancelAllScheduledNotificationsAsync method not available"
      );
      return;
    }

    try {
      await this.notifications.cancelAllScheduledNotificationsAsync();
      console.log("[NotificationService] Cancelled all notifications");
    } catch (error) {
      console.error(
        "[NotificationService] Failed to cancel all notifications:",
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    if (!this.notifications) {
      return [];
    }

    if (
      typeof this.notifications.getAllScheduledNotificationsAsync !== "function"
    ) {
      console.warn(
        "[NotificationService] getAllScheduledNotificationsAsync method not available"
      );
      return [];
    }

    try {
      return await this.notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error(
        "[NotificationService] Failed to get scheduled notifications:",
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationResponse?: (response: any) => void
  ): { remove: () => void } | null {
    let subscription: { remove: () => void } | null = null;

    if (!this.notifications) {
      console.warn(
        "[NotificationService] Notifications module unavailable; cannot set up listeners"
      );
      return null;
    }

    if (onNotificationReceived) {
      if (
        typeof this.notifications.addNotificationReceivedListener === "function"
      ) {
        try {
          subscription =
            this.notifications.addNotificationReceivedListener(
              onNotificationReceived
            );
        } catch (error) {
          console.warn(
            "[NotificationService] Failed to add notification received listener:",
            error instanceof Error ? error.message : error
          );
        }
      } else {
        console.warn(
          "[NotificationService] addNotificationReceivedListener method not available"
        );
      }
    }

    if (onNotificationResponse) {
      if (
        typeof this.notifications.addNotificationResponseReceivedListener ===
        "function"
      ) {
        try {
          const responseSubscription =
            this.notifications.addNotificationResponseReceivedListener(
              onNotificationResponse
            );
          if (!subscription) {
            subscription = responseSubscription;
          }
        } catch (error) {
          console.warn(
            "[NotificationService] Failed to add notification response listener:",
            error instanceof Error ? error.message : error
          );
        }
      } else {
        console.warn(
          "[NotificationService] addNotificationResponseReceivedListener method not available"
        );
      }
    }

    return subscription;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
