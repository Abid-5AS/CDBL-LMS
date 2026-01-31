import { Client } from '@microsoft/microsoft-graph-client';
import { prisma } from '@/lib/prisma';
import { CalendarProvider, LeaveStatus } from '@prisma/client';
import * as msal from '@azure/msal-node';

const msalConfig = {
    auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        authority: `https://login.microsoftonline.com/common`, // or tenant ID
    },
};

const pca = new msal.ConfidentialClientApplication(msalConfig);
const SCOPES = ['User.Read', 'Calendars.ReadWrite', 'offline_access'];

export class OutlookCalendarService {
    private client: Client | null = null;
    private accessToken: string = '';

    constructor(accessToken?: string) {
        if (accessToken) {
            this.accessToken = accessToken;
            this.client = Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                },
            });
        }
    }

    async setupOutlookAuth(userId: string) {
        const authCodeUrlParameters = {
            scopes: SCOPES,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`,
            state: userId,
        };

        return await pca.getAuthCodeUrl(authCodeUrlParameters);
    }

    async handleOutlookCallback(code: string, state: string, userId: string) {
        if (state !== userId) {
            throw new Error('Invalid state parameter');
        }

        const tokenRequest = {
            code: code,
            scopes: SCOPES,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`,
        };

        const response = await pca.acquireTokenByCode(tokenRequest);

        if (!response || !response.accessToken) {
            throw new Error('Failed to retrieve tokens');
        }

        // Store tokens in database
        // Note: MSAL handles token caching, but we need to store refresh token if we want to use it later without user interaction?
        // MSAL response usually has refresh token if offline_access scope is used.
        // We will store access token and refresh token (if available).
        // Note: response.expiresOn is a Date object.

        await prisma.calendarConfig.upsert({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.OUTLOOK,
                },
            },
            update: {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken || '', // Store empty if not provided, but should be there
                tokenExpiry: response.expiresOn || new Date(Date.now() + 3600 * 1000),
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                userId: parseInt(userId),
                provider: CalendarProvider.OUTLOOK,
                providerAccountId: response.account?.homeAccountId || 'outlook',
                accessToken: response.accessToken,
                refreshToken: response.refreshToken || '',
                tokenExpiry: response.expiresOn || new Date(Date.now() + 3600 * 1000),
                isActive: true,
            },
        });

        return true;
    }

    async syncLeaveToOutlook(leaveRequestId: string, userId: string) {
        const leave = await prisma.leaveRequest.findUnique({
            where: { id: parseInt(leaveRequestId) },
            include: { requester: true },
        });

        if (!leave) throw new Error('Leave request not found');

        const config = await prisma.calendarConfig.findUnique({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.OUTLOOK,
                },
            },
        });

        if (!config || !config.isActive) throw new Error('Outlook Calendar not connected');

        // Initialize client with stored token
        // TODO: Implement token refresh if expired using config.refreshToken
        this.client = Client.init({
            authProvider: (done) => {
                done(null, config.accessToken);
            },
        });

        const outlookEvent = {
            subject: `Leave: ${leave.type}`,
            body: {
                contentType: 'HTML',
                content: `Leave Request ID: ${leave.id}<br>Status: ${leave.status}<br>Reason: ${leave.reason}`,
            },
            start: {
                dateTime: leave.startDate.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: leave.endDate.toISOString(),
                timeZone: 'UTC',
            },
            showAs: 'busy', // 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
        };

        try {
            const response = await this.client.api('/me/events').post(outlookEvent);

            await prisma.leaveCalendarMapping.create({
                data: {
                    leaveId: leave.id,
                    calendarConfigId: config.id,
                    externalEventId: response.id,
                    syncStatus: 'synced',
                },
            });

            return response;
        } catch (error) {
            console.error('Error syncing to Outlook Calendar:', error);
            throw error;
        }
    }

    async updateOutlookEvent(leaveRequestId: string) {
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId: parseInt(leaveRequestId) },
            include: { calendarConfig: true, leave: true },
        });

        if (!mapping) return;

        const { calendarConfig, leave, externalEventId } = mapping;

        this.client = Client.init({
            authProvider: (done) => {
                done(null, calendarConfig.accessToken);
            },
        });

        if (leave.status === LeaveStatus.REJECTED || leave.status === LeaveStatus.CANCELLED) {
            await this.deleteOutlookEvent(leaveRequestId);
            return;
        }

        const outlookEvent: any = {
            subject: `Leave: ${leave.type}`,
            body: {
                contentType: 'HTML',
                content: `Leave Request ID: ${leave.id}<br>Status: ${leave.status}<br>Reason: ${leave.reason}`,
            },
            start: {
                dateTime: leave.startDate.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: leave.endDate.toISOString(),
                timeZone: 'UTC',
            },
        };

        try {
            await this.client.api(`/me/events/${externalEventId}`).patch(outlookEvent);
            
            await prisma.leaveCalendarMapping.update({
                where: { id: mapping.id },
                data: { lastSyncedAt: new Date(), syncStatus: 'synced' },
            });
        } catch (error) {
            console.error('Error updating Outlook Calendar event:', error);
            throw error;
        }
    }

    async deleteOutlookEvent(leaveRequestId: string) {
        const mapping = await prisma.leaveCalendarMapping.findFirst({
            where: { leaveId: parseInt(leaveRequestId) },
            include: { calendarConfig: true },
        });

        if (!mapping) return;

        this.client = Client.init({
            authProvider: (done) => {
                done(null, mapping.calendarConfig.accessToken);
            },
        });

        try {
            await this.client.api(`/me/events/${mapping.externalEventId}`).delete();
            
            await prisma.leaveCalendarMapping.delete({
                where: { id: mapping.id },
            });
        } catch (error: any) {
             if (error.statusCode === 404) {
                await prisma.leaveCalendarMapping.delete({
                    where: { id: mapping.id },
                });
            } else {
                console.error('Error deleting Outlook Calendar event:', error);
                throw error;
            }
        }
    }

    async disconnectOutlook(userId: string) {
        const config = await prisma.calendarConfig.findUnique({
            where: {
                userId_provider: {
                    userId: parseInt(userId),
                    provider: CalendarProvider.OUTLOOK,
                },
            },
        });

        if (!config) return;

        // MSAL doesn't have a direct "revoke" like Google, but we can remove from DB.
        // Optionally call Microsoft Graph to revoke if needed, but usually deleting local token is enough for client side.

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
