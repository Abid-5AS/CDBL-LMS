import { prisma } from "@/lib/prisma";

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  types: {
    LEAVE_APPROVED?: boolean;
    LEAVE_REJECTED?: boolean;
    APPROVAL_REQUIRED?: boolean;
  };
}

/**
 * UserPreferencesService
 *
 * Manages user preferences for dashboard, theme, and notifications
 */
export class UserPreferencesService {
  static async getPreferences(userId: number) {
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create default preferences
      prefs = await prisma.userPreferences.create({
        data: {
          userId,
          theme: "system",
        },
      });
    }

    return prefs;
  }

  static async updateDashboardLayout(
    userId: number,
    layout: DashboardLayout
  ) {
    return await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        dashboardLayout: layout,
      },
      update: {
        dashboardLayout: layout,
      },
    });
  }

  static async updateTheme(userId: number, theme: string) {
    return await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        theme,
      },
      update: {
        theme,
      },
    });
  }

  static async updateNotificationPreferences(
    userId: number,
    preferences: NotificationPreferences
  ) {
    return await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        notifications: preferences,
      },
      update: {
        notifications: preferences,
      },
    });
  }

  static async resetToDefaults(userId: number) {
    return await prisma.userPreferences.update({
      where: { userId },
      data: {
        dashboardLayout: null,
        theme: "system",
        notifications: null,
      },
    });
  }
}
