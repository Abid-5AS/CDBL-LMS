/**
 * useNotifications Hook
 *
 * React hook for notification operations
 */

import { useState, useEffect } from 'react';
import { notificationService } from '../notifications/NotificationService';
import { NotificationPreferences } from '../notifications/types';

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const success = await notificationService.initialize();
      setIsInitialized(success);
      setPreferences(notificationService.getPreferences());
    };

    init();
  }, []);

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    await notificationService.savePreferences(newPreferences);
    setPreferences(notificationService.getPreferences());
  };

  const scheduleLeaveReminder = async (
    leaveId: string,
    leaveType: string,
    startDate: Date
  ) => {
    return await notificationService.scheduleLeaveReminder(leaveId, leaveType, startDate);
  };

  const sendLowBalanceWarning = async (leaveType: string, availableDays: number) => {
    return await notificationService.sendLowBalanceWarning(leaveType, availableDays);
  };

  const sendApplicationSubmitted = async (
    leaveType: string,
    startDate: string,
    endDate: string
  ) => {
    return await notificationService.sendApplicationSubmitted(
      leaveType,
      startDate,
      endDate
    );
  };

  const cancelAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
  };

  return {
    preferences,
    isInitialized,
    updatePreferences,
    scheduleLeaveReminder,
    sendLowBalanceWarning,
    sendApplicationSubmitted,
    cancelAllNotifications,
  };
}
