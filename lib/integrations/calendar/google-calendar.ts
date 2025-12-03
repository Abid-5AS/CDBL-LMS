import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';

export class GoogleCalendarService {
    private auth;

    constructor(accessToken: string, refreshToken: string) {
        this.auth = getGoogleAuth();
        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }

    async createEvent(event: {
        summary: string;
        description: string;
        start: Date;
        end: Date;
        attendees?: string[];
    }) {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        try {
            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: event.summary,
                    description: event.description,
                    start: { dateTime: event.start.toISOString() },
                    end: { dateTime: event.end.toISOString() },
                    attendees: event.attendees?.map(email => ({ email })),
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Google Calendar event:', error);
            throw error;
        }
    }

    async updateEvent(eventId: string, event: {
        summary?: string;
        description?: string;
        start?: Date;
        end?: Date;
    }) {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        try {
            const response = await calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: {
                    summary: event.summary,
                    description: event.description,
                    start: event.start ? { dateTime: event.start.toISOString() } : undefined,
                    end: event.end ? { dateTime: event.end.toISOString() } : undefined,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            throw error;
        }
    }

    async deleteEvent(eventId: string) {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            throw error;
        }
    }
}
