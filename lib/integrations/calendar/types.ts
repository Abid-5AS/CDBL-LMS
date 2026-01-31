import { CalendarConfig, LeaveRequest, User, LeaveType } from "@/src/generated/prisma/client";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string; // ISO 8601 for timed events
    date?: string;     // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string; // ISO 8601 for timed events
    date?: string;     // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  attendees?: {
    email: string;
    responseStatus?: string;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
  htmlLink?: string;
}

export interface CalendarProvider {
  name: 'GOOGLE' | 'OUTLOOK';
  
  /**
   * Generate the authorization URL for the provider
   */
  getAuthUrl(redirectUri: string): string;

  /**
   * Exchange the authorization code for tokens
   */
  exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number; // Timestamp
    email?: string; // Associated email
  }>;

  /**
   * Refresh the access token using the refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }>;

  /**
   * Create an event in the calendar
   */
  createEvent(
    accessToken: string, 
    event: CalendarEvent,
    calendarId?: string
  ): Promise<CalendarEvent>;

  /**
   * Update an existing event
   */
  updateEvent(
    accessToken: string, 
    eventId: string, 
    event: CalendarEvent,
    calendarId?: string
  ): Promise<CalendarEvent>;

  /**
   * Delete an event
   */
  deleteEvent(
    accessToken: string, 
    eventId: string, 
    calendarId?: string
  ): Promise<void>;

  /**
   * Get calendar list (to allow user to select which calendar to sync to)
   */
  listCalendars(accessToken: string): Promise<{ id: string; summary: string; primary?: boolean }[]>;

  /**
   * Convert a LeaveRequest to a CalendarEvent
   */
  mapLeaveToEvent(leave: LeaveRequest & { requester: User }): CalendarEvent;
}
