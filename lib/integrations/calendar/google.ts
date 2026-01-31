import { google } from 'googleapis';
import { CalendarProvider, CalendarEvent } from './types';
import { LeaveRequest, User, LeaveType } from '@prisma/client';
import { format } from 'date-fns';

export class GoogleCalendarProvider implements CalendarProvider {
  name = 'GOOGLE' as const;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('Google Calendar credentials not found in environment variables');
    }
  }

  private getOAuth2Client(redirectUri?: string) {
    return new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      redirectUri
    );
  }

  getAuthUrl(redirectUri: string): string {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent' // Force refresh token generation
    });
  }

  async exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    email?: string;
  }> {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);

    // Get user email to verify identity
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!, // Only returned on first consent or if prompt='consent'
      expiryDate: tokens.expiry_date!,
      email: userInfo.data.email || undefined
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }> {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiryDate: credentials.expiry_date!
    };
  }

  async createEvent(
    accessToken: string, 
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        reminders: event.reminders,
        attendees: event.attendees
      }
    });

    return this.mapGoogleEventToCalendarEvent(response.data);
  }

  async updateEvent(
    accessToken: string, 
    eventId: string, 
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        reminders: event.reminders,
        attendees: event.attendees
      }
    });

    return this.mapGoogleEventToCalendarEvent(response.data);
  }

  async deleteEvent(
    accessToken: string, 
    eventId: string, 
    calendarId: string = 'primary'
  ): Promise<void> {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId,
      eventId
    });
  }

  async listCalendars(accessToken: string): Promise<{ id: string; summary: string; primary?: boolean }[]> {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list();
    
    return (response.data.items || []).map(item => ({
      id: item.id!,
      summary: item.summary!,
      primary: item.primary || false
    }));
  }

  mapLeaveToEvent(leave: LeaveRequest & { requester: User }): CalendarEvent {
    const isFullDay = true; // Most leaves are full day
    
    // Format dates (YYYY-MM-DD)
    const startDate = format(new Date(leave.startDate), 'yyyy-MM-dd');
    const endDate = format(new Date(leave.endDate), 'yyyy-MM-dd');
    
    // For Google Calendar full-day events, end date is exclusive (so add 1 day if needed, 
    // but typically the LeaveRequest endDate is inclusive. 
    // Google Calendar: start=2023-01-01, end=2023-01-02 is a 1-day event (Jan 1).
    // If LeaveRequest is Jan 1 to Jan 1, we need Google to be Jan 1 to Jan 2.
    
    const endDateTime = new Date(leave.endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    const formattedEndDate = format(endDateTime, 'yyyy-MM-dd');

    const leaveTypeLabel = leave.type.replace(/_/g, ' ');

    return {
      summary: `Leave: ${leaveTypeLabel} (${leave.workingDays} days)`,
      description: `Leave Request #${leave.id}\nType: ${leaveTypeLabel}\nReason: ${leave.reason}\nStatus: ${leave.status}`,
      start: {
        date: startDate, // All-day event
      },
      end: {
        date: formattedEndDate, // All-day event (exclusive)
      }
    };
  }

  // Helper to handle the specific Google API response structure
  private mapGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary,
      description: googleEvent.description,
      start: {
        dateTime: googleEvent.start.dateTime,
        date: googleEvent.start.date,
        timeZone: googleEvent.start.timeZone
      },
      end: {
        dateTime: googleEvent.end.dateTime,
        date: googleEvent.end.date,
        timeZone: googleEvent.end.timeZone
      },
      htmlLink: googleEvent.htmlLink
    };
  }
}
