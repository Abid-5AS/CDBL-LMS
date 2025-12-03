# 📅 Calendar Integration - Foundation Complete

**Status:** Database schema and types defined, ready for implementation
**Phase:** 2 Week 8 (Partial - Foundation)
**Completion:** ~10% (Schema + Types)

---

## ✅ What's Been Completed

### 1. Database Schema ✅

**New Models:**
```prisma
model CalendarConfig {
  id                Int              @id @default(autoincrement())
  userId            Int
  provider          CalendarProvider // GOOGLE or OUTLOOK
  providerAccountId String           // External account ID
  accessToken       String           @db.Text
  refreshToken      String           @db.Text
  tokenExpiry       DateTime
  calendarId        String?          // Specific calendar to sync to
  isActive          Boolean          @default(true)
  lastSyncAt        DateTime?
  syncErrors        Json?

  user     User                   @relation(...)
  mappings LeaveCalendarMapping[]

  @@unique([userId, provider])
}

model LeaveCalendarMapping {
  id               Int      @id @default(autoincrement())
  leaveId          Int
  calendarConfigId Int
  externalEventId  String   // Event ID in external calendar
  lastSyncedAt     DateTime
  syncStatus       String   // "synced", "pending", "failed", "deleted"
  errorMessage     String?

  leave          LeaveRequest   @relation(...)
  calendarConfig CalendarConfig @relation(...)

  @@unique([leaveId, calendarConfigId])
}
```

**New Enum:**
```prisma
enum CalendarProvider {
  GOOGLE
  OUTLOOK
}
```

### 2. TypeScript Definitions ✅

Created `/lib/calendar/types.ts` (500+ lines) with:

- `CalendarProvider` type
- `CalendarConfig` interface
- `CalendarEvent` interface
- `CalendarAttendee` interface
- `CalendarReminder` interface
- `LeaveCalendarMapping` interface
- `CalendarSyncResult` interface
- `OAuthCredentials` interface
- `ICalendarProvider` interface (provider abstraction)
- `ICalendarSyncService` interface (service abstraction)
- Google Calendar specific types
- Microsoft Outlook specific types

### 3. Prisma Client Generated ✅

- Database models available in Prisma client
- Full TypeScript type safety
- Relations properly configured

---

## ⏳ What Remains To Be Implemented

### Required Implementation (~40 hours)

#### 1. Google Calendar Provider (15 hours)

**File:** `/lib/calendar/providers/google.ts`

**Required:**
- OAuth 2.0 implementation
- Token management (access + refresh)
- Event CRUD operations
- Calendar listing
- Error handling

**Dependencies:**
```bash
pnpm add googleapis @types/googleapis
```

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/google/callback
```

**Key Methods:**
```typescript
class GoogleCalendarProvider implements ICalendarProvider {
  async getAuthUrl(userId, redirectUri): Promise<OAuthAuthUrl>
  async exchangeCodeForTokens(code, redirectUri): Promise<OAuthCredentials>
  async refreshAccessToken(refreshToken): Promise<OAuthCredentials>
  async createEvent(accessToken, calendarId, event): Promise<string>
  async updateEvent(accessToken, calendarId, eventId, event): Promise<void>
  async deleteEvent(accessToken, calendarId, eventId): Promise<void>
  async listCalendars(accessToken): Promise<CalendarInfo[]>
}
```

#### 2. Microsoft Outlook Provider (15 hours)

**File:** `/lib/calendar/providers/outlook.ts`

**Required:**
- OAuth 2.0 with Microsoft Identity Platform
- Token management
- Graph API integration
- Event CRUD operations
- Calendar listing

**Dependencies:**
```bash
pnpm add @microsoft/microsoft-graph-client @azure/msal-node
```

**Environment Variables:**
```env
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_TENANT_ID=common
OUTLOOK_REDIRECT_URI=https://your-domain.com/api/calendar/outlook/callback
```

#### 3. Calendar Sync Service (10 hours)

**File:** `/lib/calendar/sync-service.ts`

**Features:**
- Sync leave to calendar (on approval)
- Update calendar event (on leave modification)
- Delete calendar event (on leave cancellation)
- Bulk sync for user
- Error handling and retry logic
- Token refresh automation

**Key Methods:**
```typescript
class CalendarSyncService {
  async syncLeaveToCalendar(leaveId, userId): Promise<CalendarSyncResult>
  async updateLeaveInCalendar(leaveId): Promise<CalendarSyncResult>
  async deleteLeaveFromCalendar(leaveId): Promise<CalendarSyncResult>
  async syncAllLeavesForUser(userId): Promise<CalendarSyncResult>
  async getSyncStatus(leaveId): Promise<LeaveCalendarMapping[]>
}
```

---

## 🛠️ Implementation Guide

### Step 1: Install Dependencies

```bash
# Google Calendar
pnpm add googleapis @types/googleapis

# Microsoft Outlook
pnpm add @microsoft/microsoft-graph-client @azure/msal-node
```

### Step 2: Set Up OAuth Apps

**Google Calendar:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI
6. Copy Client ID and Client Secret

**Microsoft Outlook:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Add redirect URI
5. Create client secret
6. Add Calendars.ReadWrite permission
7. Copy Application (client) ID and secret

### Step 3: Implement Google Provider

```typescript
// /lib/calendar/providers/google.ts
import { google } from 'googleapis';
import type { ICalendarProvider, CalendarEvent } from '../types';

export class GoogleCalendarProvider implements ICalendarProvider {
  readonly provider = 'google' as const;
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getAuthUrl(userId: number, redirectUri: string) {
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: JSON.stringify({ userId, provider: 'google' }),
    });

    return {
      url,
      state: JSON.stringify({ userId, provider: 'google' }),
    };
  }

  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date!,
      scope: tokens.scope!.split(' '),
      tokenType: tokens.token_type!,
    };
  }

  async createEvent(accessToken: string, calendarId: string, event: CalendarEvent) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const googleEvent = this.convertToGoogleEvent(event);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: googleEvent,
    });

    return response.data.id!;
  }

  // ... other methods
}
```

### Step 4: Implement Sync Service

```typescript
// /lib/calendar/sync-service.ts
import { prisma } from '@/lib/prisma';
import { GoogleCalendarProvider } from './providers/google';
import { OutlookCalendarProvider } from './providers/outlook';

export class CalendarSyncService {
  private providers = {
    google: new GoogleCalendarProvider(),
    outlook: new OutlookCalendarProvider(),
  };

  async syncLeaveToCalendar(leaveId: number, userId: number) {
    // Get leave details
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { requester: true },
    });

    if (!leave || leave.status !== 'APPROVED') {
      throw new Error('Leave not found or not approved');
    }

    // Get user's calendar configs
    const configs = await prisma.calendarConfig.findMany({
      where: { userId, isActive: true },
    });

    const results = [];

    for (const config of configs) {
      try {
        const provider = this.providers[config.provider.toLowerCase()];

        // Create calendar event
        const event = this.convertLeaveToCalendarEvent(leave);
        const eventId = await provider.createEvent(
          config.accessToken,
          config.calendarId!,
          event
        );

        // Create mapping
        await prisma.leaveCalendarMapping.create({
          data: {
            leaveId,
            calendarConfigId: config.id,
            externalEventId: eventId,
            syncStatus: 'synced',
          },
        });

        results.push({ provider: config.provider, success: true });
      } catch (error) {
        results.push({
          provider: config.provider,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private convertLeaveToCalendarEvent(leave: any): CalendarEvent {
    return {
      summary: `Leave: ${leave.type}`,
      description: `Reason: ${leave.reason}`,
      startDateTime: leave.startDate,
      endDateTime: leave.endDate,
      isAllDay: true,
      status: 'confirmed',
    };
  }
}
```

### Step 5: Create API Routes

```typescript
// /app/api/calendar/google/auth/route.ts
import { GoogleCalendarProvider } from '@/lib/calendar/providers/google';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const provider = new GoogleCalendarProvider();

  const { url } = await provider.getAuthUrl(user.id, process.env.GOOGLE_REDIRECT_URI!);

  return NextResponse.redirect(url);
}

// /app/api/calendar/google/callback/route.ts
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  const { userId } = JSON.parse(state!);
  const provider = new GoogleCalendarProvider();

  const credentials = await provider.exchangeCodeForTokens(code!);

  // Save to database
  await prisma.calendarConfig.create({
    data: {
      userId,
      provider: 'GOOGLE',
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      tokenExpiry: new Date(credentials.expiryDate),
      // ...
    },
  });

  return NextResponse.redirect('/settings?calendar=connected');
}
```

---

## 🎯 Architecture Overview

```
User approves leave
    ↓
Leave status = APPROVED
    ↓
Trigger: CalendarSyncService.syncLeaveToCalendar()
    ↓
For each CalendarConfig (user has):
    ↓
    Get appropriate provider (Google/Outlook)
    ↓
    Convert leave to CalendarEvent
    ↓
    provider.createEvent()
    ↓
    Save LeaveCalendarMapping
    ↓
Return sync results
```

### Data Flow

```
1. User connects calendar (OAuth)
   → CalendarConfig created

2. Leave approved
   → Trigger sync
   → Create event in external calendar
   → LeaveCalendarMapping created

3. Leave modified
   → Find mapping
   → provider.updateEvent()
   → Update mapping timestamp

4. Leave cancelled
   → Find mapping
   → provider.deleteEvent()
   → Update mapping status = "deleted"
```

---

## 🔒 Security Considerations

1. **Token Storage:**
   - Encrypt access tokens and refresh tokens before storing
   - Use environment-based encryption key
   - Consider using a secrets manager (AWS Secrets Manager, Azure Key Vault)

2. **OAuth Security:**
   - Validate state parameter to prevent CSRF
   - Use HTTPS for all redirect URIs
   - Implement proper error handling

3. **API Rate Limits:**
   - Implement retry logic with exponential backoff
   - Cache calendar data when possible
   - Batch operations when syncing multiple events

4. **Token Refresh:**
   - Automatically refresh tokens before expiry
   - Handle refresh token expiration gracefully
   - Notify user if re-authentication needed

---

## 📚 Resources

### Google Calendar API
- [Official Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Node.js Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)

### Microsoft Graph API
- [Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [OAuth Setup](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [JavaScript SDK](https://learn.microsoft.com/en-us/graph/sdks/sdks-overview)

---

## ✅ Current Status Summary

**Completed:**
- ✅ Database schema (CalendarConfig, LeaveCalendarMapping)
- ✅ TypeScript type definitions
- ✅ Prisma client generated
- ✅ Architecture designed
- ✅ Implementation guide created

**Remaining (40 hours):**
- ⏳ Google Calendar OAuth & API implementation (15h)
- ⏳ Microsoft Outlook OAuth & API implementation (15h)
- ⏳ Calendar sync service (10h)
- ⏳ API routes for auth callbacks (2h)
- ⏳ Settings UI for calendar connection (4h)
- ⏳ Testing and error handling (4h)

**Can Be Implemented Independently:**
Each provider can be implemented separately:
1. Start with Google Calendar (most common)
2. Then add Outlook support
3. Test with real accounts
4. Deploy incrementally

---

## 🚀 Next Steps

**When Ready to Implement:**

1. Install dependencies
2. Set up OAuth apps (Google + Outlook)
3. Add environment variables
4. Implement Google provider first
5. Create API routes
6. Add settings UI
7. Test with real Google account
8. Repeat for Outlook
9. Document user-facing features

**Estimated Timeline:**
- Google Calendar: 1 week (20 hours)
- Outlook Calendar: 1 week (20 hours)
- **Total: 2 weeks (40 hours)**

---

**Status:** Foundation complete, ready for full implementation
**Phase:** 2 Week 8
**Last Updated:** December 3, 2025
