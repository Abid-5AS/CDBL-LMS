import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth';
import { prisma } from '@/lib/prisma';
import { CalendarProvider, LeaveStatus } from '@prisma/client';

export class GoogleCalendarService {
    private auth;

    constructor(accessToken?: string, refreshToken?: string) {
        this.auth = getGoogleAuth();
        if (accessToken && refreshToken) {
            this.auth.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        }
    }

    async setupGoogleCalendarAuth(userId: string) {
        const authUrl = this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events'],
            state: userId, // Using userId as state for simplicity
            prompt: 'consent', // Force to get refresh token
        });
        return authUrl;
    }

    async handleGoogleCallback(code: string, state: string, userId: string) {
        if (state !== userId) {
            throw new Error('Invalid state parameter');
        }

        const { tokens } = await this.auth.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Failed to retrieve tokens');
        }

        // Store tokens in database
        await prisma.calendarConfig.upsert({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.GOOGLE,
                },
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                userId: parseInt(userId),
                provider: CalendarProvider.GOOGLE,
                providerAccountId: 'google', 
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                isActive: true,
            },
        });

        return true;
    }

    async syncLeaveToGoogleCalendar(leaveRequestId: string, userId: string) {
        const leave = await prisma.leaveRequest.findUnique({
            where: { id: parseInt(leaveRequestId) },
            include: { requester: true },
        });

        if (!leave) throw new Error('Leave request not found');

        const config = await prisma.calendarConfig.findUnique({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.GOOGLE,
                },
            },
        });

        if (!config || !config.isActive) throw new Error('Google Calendar not connected');

        this.auth.setCredentials({
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        const event = {
            summary: `Leave: ${leave.type}`,
            description: `Leave Request ID: ${leave.id}\nStatus: ${leave.status}\nReason: ${leave.reason}`,
            start: { dateTime: leave.startDate.toISOString(), timeZone: 'UTC' },
            end: { dateTime: leave.endDate.toISOString(), timeZone: 'UTC' },
            transparency: 'opaque', // Blocking time
        };

        try {
            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });

            await prisma.leaveCalendarMapping.create({
                data: {
                    leaveId: leave.id,
                    calendarConfigId: config.id,
                    externalEventId: response.data.id!,
                    syncStatus: 'synced',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error syncing to Google Calendar:', error);
            throw error;
        }
    }

    async updateGoogleCalendarEvent(leaveRequestId: string) {
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId: parseInt(leaveRequestId) },
            include: { calendarConfig: true, leave: true },
        });

        if (!mapping) return;

        const { calendarConfig, leave, externalEventId } = mapping;

        this.auth.setCredentials({
            access_token: calendarConfig.accessToken,
            refresh_token: calendarConfig.refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        if (leave.status === LeaveStatus.REJECTED || leave.status === LeaveStatus.CANCELLED) {
            await this.deleteGoogleCalendarEvent(leaveRequestId);
            return;
        }

        try {
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: externalEventId,
                requestBody: {
                    summary: `Leave: ${leave.type}`,
                    description: `Leave Request ID: ${leave.id}\nStatus: ${leave.status}\nReason: ${leave.reason}`,
                    start: { dateTime: leave.startDate.toISOString() },
                    end: { dateTime: leave.endDate.toISOString() },
                },
            });
            
            await prisma.leaveCalendarMapping.update({
                where: { id: mapping.id },
                data: { lastSyncedAt: new Date(), syncStatus: 'synced' },
            });
        } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            throw error;
        }
    }

    async deleteGoogleCalendarEvent(leaveRequestId: string) {
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId: parseInt(leaveRequestId) },
            include: { calendarConfig: true },
        });

        if (!mapping) return;

        this.auth.setCredentials({
            access_token: mapping.calendarConfig.accessToken,
            refresh_token: mapping.calendarConfig.refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: mapping.externalEventId,
            });

            await prisma.leaveCalendarMapping.delete({
                where: { id: mapping.id },
            });
        } catch (error: any) {
            if (error.code === 410 || error.code === 404) {
                await prisma.leaveCalendarMapping.delete({
                    where: { id: mapping.id },
                });
            } else {
                console.error('Error deleting Google Calendar event:', error);
                throw error;
            }
        }
    }

    async disconnectGoogleCalendar(userId: string) {
        const config = await prisma.calendarConfig.findUnique({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.GOOGLE,
                },
            },
        });

        if (!config) return;

        try {
            await this.auth.revokeToken(config.accessToken);
        } catch (error) {
            console.error('Error revoking token:', error);
        }

        await prisma.$transaction([
            prisma.leaveCalendarMapping.deleteMany({
                where: { calendarConfigId: config.id },
            }),
            prisma.calendarConfig.delete({
                where: { id: config.id },
            }),
        ]);

        return true;
    }
}
