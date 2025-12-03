import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export class OutlookCalendarService {
    private client: Client;

    constructor(accessToken: string) {
        this.client = Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            },
        });
    }

    async createEvent(event: {
        summary: string;
        description: string;
        start: Date;
        end: Date;
        attendees?: string[];
    }) {
        const outlookEvent = {
            subject: event.summary,
            body: {
                contentType: 'HTML',
                content: event.description,
            },
            start: {
                dateTime: event.start.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: event.end.toISOString(),
                timeZone: 'UTC',
            },
            attendees: event.attendees?.map(email => ({
                emailAddress: {
                    address: email,
                },
                type: 'required',
            })),
        };

        try {
            return await this.client.api('/me/events').post(outlookEvent);
        } catch (error) {
            console.error('Error creating Outlook Calendar event:', error);
            throw error;
        }
    }

    async updateEvent(eventId: string, event: {
        summary?: string;
        description?: string;
        start?: Date;
        end?: Date;
    }) {
        const outlookEvent: any = {};
        if (event.summary) outlookEvent.subject = event.summary;
        if (event.description) outlookEvent.body = { contentType: 'HTML', content: event.description };
        if (event.start) outlookEvent.start = { dateTime: event.start.toISOString(), timeZone: 'UTC' };
        if (event.end) outlookEvent.end = { dateTime: event.end.toISOString(), timeZone: 'UTC' };

        try {
            return await this.client.api(`/me/events/${eventId}`).patch(outlookEvent);
        } catch (error) {
            console.error('Error updating Outlook Calendar event:', error);
            throw error;
        }
    }

    async deleteEvent(eventId: string) {
        try {
            await this.client.api(`/me/events/${eventId}`).delete();
        } catch (error) {
            console.error('Error deleting Outlook Calendar event:', error);
            throw error;
        }
    }
}
