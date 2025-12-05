import { prisma } from '@/lib/prisma';
import { CalendarProvider, CalendarEvent } from './types';
import { GoogleCalendarProvider } from './google';
import { OutlookCalendarProvider } from './outlook';
import { CalendarConfig, LeaveRequest, User, CalendarProvider as ProviderEnum } from '@prisma/client';

export class CalendarService {
  private providers: Record<ProviderEnum, CalendarProvider>;

  constructor() {
    this.providers = {
      [ProviderEnum.GOOGLE]: new GoogleCalendarProvider(),
      [ProviderEnum.OUTLOOK]: new OutlookCalendarProvider(),
    };
  }

  private getProvider(providerName: ProviderEnum): CalendarProvider {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not implemented`);
    }
    return provider;
  }

  /**
   * Sync a leave request to the user's connected calendar
   */
  async syncLeaveToCalendar(leaveId: number): Promise<void> {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { requester: true }
    });

    if (!leave) throw new Error(`Leave request ${leaveId} not found`);

    // Find active calendar config for the user
    const config = await prisma.calendarConfig.findFirst({
      where: {
        userId: leave.requesterId,
        isActive: true
      }
    });

    if (!config) return; // No calendar connected, skip

    try {
      const provider = this.getProvider(config.provider);
      
      // Check if token needs refresh
      const accessToken = await this.getValidAccessToken(config);

      // Map leave to event
      const eventData = provider.mapLeaveToEvent(leave);

      // Check if already synced
      const mapping = await prisma.leaveCalendarMapping.findUnique({
        where: {
          leaveId_calendarConfigId: {
            leaveId: leave.id,
            calendarConfigId: config.id
          }
        }
      });

      if (mapping && mapping.externalEventId) {
        // Update existing event
        await provider.updateEvent(accessToken, mapping.externalEventId, eventData, config.calendarId || undefined);
        
        await prisma.leaveCalendarMapping.update({
          where: { id: mapping.id },
          data: {
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            errorMessage: null
          }
        });
      } else {
        // Create new event
        const newEvent = await provider.createEvent(accessToken, eventData, config.calendarId || undefined);
        
        if (newEvent.id) {
          await prisma.leaveCalendarMapping.upsert({
            where: {
              leaveId_calendarConfigId: {
                leaveId: leave.id,
                calendarConfigId: config.id
              }
            },
            update: {
              externalEventId: newEvent.id,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              errorMessage: null
            },
            create: {
              leaveId: leave.id,
              calendarConfigId: config.id,
              externalEventId: newEvent.id,
              syncStatus: 'synced'
            }
          });
        }
      }
    } catch (error: any) {
      console.error(`Failed to sync leave ${leaveId} to calendar:`, error);
      
      // Log error
      await prisma.leaveCalendarMapping.upsert({
        where: {
          leaveId_calendarConfigId: {
            leaveId: leave.id,
            calendarConfigId: config.id
          }
        },
        update: {
          syncStatus: 'failed',
          errorMessage: error.message
        },
        create: {
          leaveId: leave.id,
          calendarConfigId: config.id,
          externalEventId: '', // Placeholder
          syncStatus: 'failed',
          errorMessage: error.message
        }
      });
    }
  }

  /**
   * Remove a leave request from the calendar
   */
  async removeLeaveFromCalendar(leaveId: number): Promise<void> {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leave) return;

    const config = await prisma.calendarConfig.findFirst({
      where: {
        userId: leave.requesterId,
        isActive: true
      }
    });

    if (!config) return;

    const mapping = await prisma.leaveCalendarMapping.findUnique({
      where: {
        leaveId_calendarConfigId: {
          leaveId: leave.id,
          calendarConfigId: config.id
        }
      }
    });

    if (!mapping || !mapping.externalEventId) return;

    try {
      const provider = this.getProvider(config.provider);
      const accessToken = await this.getValidAccessToken(config);

      await provider.deleteEvent(accessToken, mapping.externalEventId, config.calendarId || undefined);

      await prisma.leaveCalendarMapping.update({
        where: { id: mapping.id },
        data: {
          syncStatus: 'deleted',
          externalEventId: '', // Clear ID
          errorMessage: null
        }
      });
    } catch (error: any) {
      console.error(`Failed to remove leave ${leaveId} from calendar:`, error);
      // If 404, it's already gone, so we can consider it deleted
      if (error.code === 404 || error.statusCode === 404) {
        await prisma.leaveCalendarMapping.update({
          where: { id: mapping.id },
          data: {
            syncStatus: 'deleted',
            externalEventId: '',
            errorMessage: null
          }
        });
      }
    }
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(config: CalendarConfig): Promise<string> {
    // Check if expired (give 5 minute buffer)
    const expiryBuffer = 5 * 60 * 1000;
    const now = Date.now();
    const expiry = config.tokenExpiry.getTime();

    if (now + expiryBuffer < expiry) {
      return config.accessToken;
    }

    // Token expired, refresh it
    const provider = this.getProvider(config.provider);
    const { accessToken, expiryDate } = await provider.refreshAccessToken(config.refreshToken);

    // Update DB
    await prisma.calendarConfig.update({
      where: { id: config.id },
      data: {
        accessToken,
        tokenExpiry: new Date(expiryDate),
        updatedAt: new Date()
      }
    });

    return accessToken;
  }
}

export const calendarService = new CalendarService();
