/**
 * Calendar Integration Types
 * Type definitions for Google Calendar and Microsoft Outlook integration
 */

export type CalendarProvider = 'google' | 'outlook';

export type CalendarSyncStatus = 'active' | 'inactive' | 'error' | 'pending';

export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled';

/**
 * Calendar Configuration
 */
export interface CalendarConfig {
  id?: number;
  userId: number;
  provider: CalendarProvider;
  providerAccountId: string; // External account ID
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  calendarId?: string; // Specific calendar ID to sync to
  isActive: boolean;
  lastSyncAt?: Date;
  syncErrors?: string[];
}

/**
 * Calendar Event
 */
export interface CalendarEvent {
  id?: string; // External event ID
  provider: CalendarProvider;
  summary: string; // Event title
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  isAllDay: boolean;
  status: CalendarEventStatus;
  attendees?: CalendarAttendee[];
  reminders?: CalendarReminder[];
  metadata?: Record<string, any>; // Provider-specific data
}

/**
 * Calendar Attendee
 */
export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  optional?: boolean;
}

/**
 * Calendar Reminder
 */
export interface CalendarReminder {
  method: 'email' | 'popup';
  minutes: number; // Minutes before event
}

/**
 * Leave to Calendar Event Mapping
 */
export interface LeaveCalendarMapping {
  id: number;
  leaveId: number;
  calendarConfigId: number;
  provider: CalendarProvider;
  externalEventId: string;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'failed' | 'deleted';
  errorMessage?: string;
}

/**
 * Calendar Sync Result
 */
export interface CalendarSyncResult {
  success: boolean;
  provider: CalendarProvider;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
  syncedAt: Date;
}

/**
 * OAuth Credentials
 */
export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // Unix timestamp
  scope: string[];
  tokenType: string;
}

/**
 * OAuth Authorization URL
 */
export interface OAuthAuthUrl {
  url: string;
  state: string; // CSRF token
}

/**
 * Calendar Provider Interface
 * All calendar providers must implement this interface
 */
export interface ICalendarProvider {
  /**
   * Provider name
   */
  readonly provider: CalendarProvider;

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(userId: number, redirectUri: string): Promise<OAuthAuthUrl>;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<OAuthCredentials>;

  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthCredentials>;

  /**
   * Create calendar event
   */
  createEvent(
    accessToken: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<string>; // Returns external event ID

  /**
   * Update calendar event
   */
  updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void>;

  /**
   * Delete calendar event
   */
  deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void>;

  /**
   * Get user's calendars
   */
  listCalendars(accessToken: string): Promise<CalendarInfo[]>;

  /**
   * Verify access token is valid
   */
  verifyToken(accessToken: string): Promise<boolean>;
}

/**
 * Calendar Information
 */
export interface CalendarInfo {
  id: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  accessRole: string;
}

/**
 * Calendar Sync Service Interface
 */
export interface ICalendarSyncService {
  /**
   * Sync a leave request to calendar
   */
  syncLeaveToCalendar(leaveId: number, userId: number): Promise<CalendarSyncResult>;

  /**
   * Update synced leave in calendar
   */
  updateLeaveInCalendar(leaveId: number): Promise<CalendarSyncResult>;

  /**
   * Delete leave from calendar
   */
  deleteLeaveFromCalendar(leaveId: number): Promise<CalendarSyncResult>;

  /**
   * Sync all approved leaves for a user
   */
  syncAllLeavesForUser(userId: number): Promise<CalendarSyncResult>;

  /**
   * Get sync status for a leave
   */
  getSyncStatus(leaveId: number): Promise<LeaveCalendarMapping[]>;
}

/**
 * Google Calendar Specific Types
 */
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
    optional?: boolean;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
  status?: string;
  colorId?: string;
}

/**
 * Microsoft Outlook Specific Types
 */
export interface OutlookCalendarEvent {
  id?: string;
  subject: string;
  body?: {
    contentType: 'text' | 'html';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: {
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional';
    status?: {
      response: string;
    };
  }[];
  isAllDay?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  reminderMinutesBeforeStart?: number;
}
