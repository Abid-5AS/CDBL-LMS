import { Client } from '@microsoft/microsoft-graph-client';
import { CalendarProvider, CalendarEvent } from './types';
import { LeaveRequest, User } from '@prisma/client';
import { format } from 'date-fns';

export class OutlookCalendarProvider implements CalendarProvider {
  name = 'OUTLOOK' as const;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID || '';
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Outlook Calendar credentials not found in environment variables');
    }
  }

  getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: 'offline_access User.Read Calendars.ReadWrite',
      state: 'outlook_auth'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    email?: string;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'offline_access User.Read Calendars.ReadWrite',
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      client_secret: this.clientSecret,
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Outlook token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    const now = Date.now();

    // Get user email
    const client = Client.init({
      authProvider: (done) => done(null, data.access_token)
    });
    
    const user = await client.api('/me').get();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: now + (data.expires_in * 1000),
      email: user.mail || user.userPrincipalName
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'offline_access User.Read Calendars.ReadWrite',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_secret: this.clientSecret,
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Outlook token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    const now = Date.now();

    return {
      accessToken: data.access_token,
      expiryDate: now + (data.expires_in * 1000)
    };
  }

  async createEvent(
    accessToken: string, 
    event: CalendarEvent,
    calendarId: string = 'primary' // Outlook uses 'Calendar' usually, or specific ID
  ): Promise<CalendarEvent> {
    const client = Client.init({
      authProvider: (done) => done(null, accessToken)
    });

    const outlookEvent = {
      subject: event.summary,
      body: {
        contentType: 'Text',
        content: event.description
      },
      start: {
        dateTime: event.start.dateTime || `${event.start.date}T00:00:00`,
        timeZone: event.start.timeZone || 'UTC'
      },
      end: {
        dateTime: event.end.dateTime || `${event.end.date}T00:00:00`,
        timeZone: event.end.timeZone || 'UTC'
      },
      isAllDay: !!event.start.date
    };

    // If calendarId is 'primary', use '/me/calendar/events'
    // Otherwise use '/me/calendars/{id}/events'
    const endpoint = calendarId === 'primary' 
      ? '/me/calendar/events' 
      : `/me/calendars/${calendarId}/events`;

    const response = await client.api(endpoint).post(outlookEvent);

    return this.mapOutlookEventToCalendarEvent(response);
  }

  async updateEvent(
    accessToken: string, 
    eventId: string, 
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    const client = Client.init({
      authProvider: (done) => done(null, accessToken)
    });

    const outlookEvent = {
      subject: event.summary,
      body: {
        contentType: 'Text',
        content: event.description
      },
      start: {
        dateTime: event.start.dateTime || `${event.start.date}T00:00:00`,
        timeZone: event.start.timeZone || 'UTC'
      },
      end: {
        dateTime: event.end.dateTime || `${event.end.date}T00:00:00`,
        timeZone: event.end.timeZone || 'UTC'
      },
      isAllDay: !!event.start.date
    };

    const endpoint = calendarId === 'primary' 
      ? `/me/calendar/events/${eventId}` 
      : `/me/calendars/${calendarId}/events/${eventId}`;

    const response = await client.api(endpoint).patch(outlookEvent);

    return this.mapOutlookEventToCalendarEvent(response);
  }

  async deleteEvent(
    accessToken: string, 
    eventId: string, 
    calendarId: string = 'primary'
  ): Promise<void> {
    const client = Client.init({
      authProvider: (done) => done(null, accessToken)
    });

    const endpoint = calendarId === 'primary' 
      ? `/me/calendar/events/${eventId}` 
      : `/me/calendars/${calendarId}/events/${eventId}`;

    await client.api(endpoint).delete();
  }

  async listCalendars(accessToken: string): Promise<{ id: string; summary: string; primary?: boolean }[]> {
    const client = Client.init({
      authProvider: (done) => done(null, accessToken)
    });

    const response = await client.api('/me/calendars').get();

    return (response.value || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.name,
      primary: cal.isDefaultCalendar
    }));
  }

  mapLeaveToEvent(leave: LeaveRequest & { requester: User }): CalendarEvent {
    const startDate = format(new Date(leave.startDate), 'yyyy-MM-dd');
    const endDate = format(new Date(leave.endDate), 'yyyy-MM-dd');
    
    // Outlook inclusive end date for all-day events? 
    // Microsoft Graph API: For all-day events, if start is 2023-01-01 and end is 2023-01-02, it is 1 day.
    // So similar to Google, we need to add 1 day to the end date.
    
    const endDateTime = new Date(leave.endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    const formattedEndDate = format(endDateTime, 'yyyy-MM-dd');

    const leaveTypeLabel = leave.type.replace(/_/g, ' ');

    return {
      summary: `Leave: ${leaveTypeLabel} (${leave.workingDays} days)`,
      description: `Leave Request #${leave.id}\nType: ${leaveTypeLabel}\nReason: ${leave.reason}\nStatus: ${leave.status}`,
      start: {
        date: startDate,
      },
      end: {
        date: formattedEndDate,
      }
    };
  }

  private mapOutlookEventToCalendarEvent(outlookEvent: any): CalendarEvent {
    return {
      id: outlookEvent.id,
      summary: outlookEvent.subject,
      description: outlookEvent.bodyPreview,
      start: {
        dateTime: outlookEvent.start.dateTime,
        timeZone: outlookEvent.start.timeZone
      },
      end: {
        dateTime: outlookEvent.end.dateTime,
        timeZone: outlookEvent.end.timeZone
      },
      htmlLink: outlookEvent.webLink
    };
  }
}
