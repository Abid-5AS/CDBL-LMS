import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';
import { GoogleCalendarService } from './google-calendar';
import { OutlookCalendarService } from './outlook-calendar';

export class CalendarService {
    static async getServiceForUser(userId: number) {
        const config = await prisma.calendarConfig.findFirst({
            where: { userId, isActive: true },
        });

        if (!config) return null;

        if (config.provider === CalendarProvider.GOOGLE) {
            return new GoogleCalendarService(config.accessToken, config.refreshToken);
        } else if (config.provider === CalendarProvider.OUTLOOK) {
            return new OutlookCalendarService(config.accessToken);
        }

        return null;
    }

    static async syncLeaveEvent(leaveId: number, userId: number) {
        const leave = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: { requester: true },
        });

        if (!leave || leave.status !== 'APPROVED') return;

        const service = await this.getServiceForUser(userId);
        if (!service) return;

        // Check if mapping exists
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId },
            include: { calendarConfig: true },
        });

        const eventData = {
            summary: `Leave: ${leave.type}`,
            description: `Approved ${leave.type} leave for ${leave.requester.name}. Reason: ${leave.reason}`,
            start: leave.startDate,
            end: leave.endDate,
        };

        try {
            if (mapping && mapping.calendarConfig.userId === userId) {
                // Update existing event
                await service.updateEvent(mapping.externalEventId, eventData);
            } else {
                // Create new event
                const event = await service.createEvent(eventData);

                // Save mapping
                const config = await prisma.calendarConfig.findFirst({
                    where: { userId, isActive: true }
                });

                if (config) {
                    await prisma.leaveCalendarMapping.create({
                        data: {
                            leaveId,
                            calendarConfigId: config.id,
                            externalEventId: event.id,
                            syncStatus: 'synced',
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing calendar event:', error);
            // Log error to mapping if exists
        }
    }

    static async deleteLeaveEvent(leaveId: number, userId: number) {
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId },
            include: { calendarConfig: true },
        });

        if (!mapping || mapping.calendarConfig.userId !== userId) return;

        const service = await this.getServiceForUser(userId);
        if (!service) return;

        try {
            await service.deleteEvent(mapping.externalEventId);
            await prisma.leaveCalendarMapping.update({
                where: { id: mapping.id },
                data: { syncStatus: 'deleted' },
            });
        } catch (error) {
            console.error('Error deleting calendar event:', error);
        }
    }
}
