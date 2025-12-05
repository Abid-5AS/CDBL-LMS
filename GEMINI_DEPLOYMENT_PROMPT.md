# CDBL Leave Management System - Comprehensive Implementation & Deployment Guide

## Context and Current State

You are working on the **CDBL Leave Management System**, an enterprise-grade leave management platform built with modern web technologies. The system is currently **60-70% complete** with core functionality operational and several advanced features in various stages of implementation.

### Technology Stack
- **Frontend**: Next.js 16.0.0 (App Router), React 19.2.0, TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.x, shadcn/ui (Radix UI primitives), Framer Motion 12.23.24
- **Backend**: Next.js API Routes, Prisma 7.0.1 ORM, MySQL/MariaDB
- **Authentication**: JWT (jose 6.1.0) with HTTP-only cookies
- **State Management**: Zustand 5.0.8, SWR 2.3.6
- **Testing**: Vitest 4.0.6, Playwright 1.49.0
- **Build Tools**: Turbopack (integrated), pnpm package manager
- **Deployment**: Vercel-ready with Docker support

### Current Git Status
- **Branch**: `consolidated-work`
- **Main Branch**: `main`
- **Last Commit**: "feat: Complete Weeks 8-12 features (Calendar, PWA, Delegation, Storybook)"
- **Status**: Clean working directory

### Project Structure
```
cdbl-leave-management/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # Protected routes
│   ├── (protected)/              # Role-based routes
│   ├── api/                      # REST API endpoints
│   ├── admin/, ceo/, dashboard/  # Role-specific dashboards
│   ├── leaves/, approvals/       # Core features
│   └── calendar/, encashment/    # Advanced features
├── components/                   # React components
│   ├── dashboards/               # Role-specific widgets
│   ├── ui/                       # shadcn/ui primitives
│   └── shared/                   # Shared components
├── lib/                          # Business logic
│   ├── services/                 # 19 service classes
│   ├── repositories/             # Data access layer
│   ├── integrations/             # HRIS, Calendar APIs
│   ├── policy.ts                 # CDBL leave policy rules
│   └── workflow.ts               # Approval workflow engine
├── prisma/schema.prisma          # 744-line data model
├── types/                        # TypeScript definitions
├── hooks/                        # React hooks (20+)
└── tests/                        # Test suites
```

---

## PART 1: COMPLETE INCOMPLETE FEATURES

### Task 1.1: Complete Calendar Integration

**Current State**:
- ✅ Database schema ready (`CalendarConfig`, `LeaveCalendarMapping` models)
- ✅ TypeScript types defined
- ⚠️ Provider implementations (Google Calendar, Outlook) incomplete
- ⚠️ Bi-directional sync logic missing
- ⚠️ OAuth flow partially implemented

**What You Need to Do**:

#### 1.1.1 Complete Google Calendar Integration
**File**: `lib/integrations/calendar/google-calendar.ts`

```typescript
// Implement the following functions:

1. **setupGoogleCalendarAuth(userId: string)**
   - Generate OAuth 2.0 authorization URL using googleapis
   - Store state token in database for CSRF protection
   - Return authorization URL for user redirect
   - Handle scopes: 'https://www.googleapis.com/auth/calendar.events'

2. **handleGoogleCallback(code: string, state: string, userId: string)**
   - Verify state token matches stored value
   - Exchange authorization code for access + refresh tokens
   - Store tokens in CalendarConfig table (encrypt refresh token)
   - Set provider as 'GOOGLE_CALENDAR'
   - Return success status

3. **syncLeaveToGoogleCalendar(leaveRequestId: string, userId: string)**
   - Fetch leave request from database
   - Retrieve user's CalendarConfig with valid tokens
   - Refresh access token if expired using refresh token
   - Create calendar event with:
     * Summary: "Leave: [LeaveType]"
     * Description: Leave details and approval status
     * Start/End: Leave dates (all-day events)
     * Transparency: 'transparent' (mark as free/busy)
   - Store event ID in LeaveCalendarMapping table
   - Handle API errors gracefully (invalid token, quota exceeded)

4. **updateGoogleCalendarEvent(leaveRequestId: string)**
   - Fetch existing event ID from LeaveCalendarMapping
   - Update event if leave status changes (APPROVED → CANCELLED)
   - Update event dates if leave dates modified
   - Delete event if leave is rejected or cancelled

5. **deleteGoogleCalendarEvent(leaveRequestId: string)**
   - Remove event from Google Calendar
   - Delete LeaveCalendarMapping record
   - Handle cases where event already deleted

6. **disconnectGoogleCalendar(userId: string)**
   - Revoke OAuth tokens via Google API
   - Delete CalendarConfig record
   - Delete all LeaveCalendarMapping records for user
   - Return confirmation
```

**Error Handling Requirements**:
- Token expiration: Auto-refresh using refresh token
- Network failures: Retry with exponential backoff (3 attempts)
- Quota limits: Queue operations for later retry
- Invalid credentials: Notify user to re-authenticate

**Testing Requirements**:
- Unit tests for each function in `tests/unit/calendar/google-calendar.test.ts`
- Integration test: Full OAuth flow end-to-end
- Test token refresh mechanism
- Test sync for all leave statuses (PENDING, APPROVED, REJECTED, CANCELLED)

---

#### 1.1.2 Complete Microsoft Outlook Integration
**File**: `lib/integrations/calendar/outlook-calendar.ts`

```typescript
// Similar structure to Google Calendar, implement:

1. **setupOutlookAuth(userId: string)**
   - Use @azure/msal-node for OAuth
   - Scopes: 'Calendars.ReadWrite', 'offline_access'
   - Store MSAL configuration in environment variables

2. **handleOutlookCallback(code: string, state: string, userId: string)**
   - Exchange code for tokens using MSAL
   - Store in CalendarConfig with provider='OUTLOOK'

3. **syncLeaveToOutlook(leaveRequestId: string, userId: string)**
   - Use @microsoft/microsoft-graph-client
   - Create event at /me/calendar/events endpoint
   - Store event ID in LeaveCalendarMapping

4. **updateOutlookEvent(leaveRequestId: string)**
5. **deleteOutlookEvent(leaveRequestId: string)**
6. **disconnectOutlook(userId: string)**
```

**API Endpoints to Create**:

```typescript
// app/api/calendar/google/auth/route.ts
POST /api/calendar/google/auth
- Initiates OAuth flow
- Returns authorization URL

// app/api/calendar/google/callback/route.ts
GET /api/calendar/google/callback?code=XXX&state=YYY
- Handles OAuth callback
- Stores tokens
- Redirects to dashboard

// app/api/calendar/outlook/auth/route.ts
POST /api/calendar/outlook/auth

// app/api/calendar/outlook/callback/route.ts
GET /api/calendar/outlook/callback

// app/api/calendar/sync/route.ts
POST /api/calendar/sync
Body: { leaveRequestId: string, action: 'create' | 'update' | 'delete' }

// app/api/calendar/disconnect/route.ts
POST /api/calendar/disconnect
Body: { provider: 'GOOGLE_CALENDAR' | 'OUTLOOK' }
```

**UI Components to Create**:

```typescript
// components/calendar/CalendarConnectionCard.tsx
- Display connected calendar provider (icon + name)
- "Connect Google Calendar" button → triggers OAuth
- "Connect Outlook" button → triggers OAuth
- "Disconnect" button with confirmation dialog
- Show last sync time and status

// components/calendar/CalendarSyncToggle.tsx
- Toggle to enable/disable automatic sync
- Update UserPreferences.enableCalendarSync field

// components/calendar/CalendarEventPreview.tsx
- Preview how leave will appear in calendar
- Show event title, dates, description
```

**Integration Points**:
- After leave is APPROVED: Auto-sync to calendar if user has connected provider
- After leave is CANCELLED/REJECTED: Delete calendar event
- After leave dates modified: Update calendar event
- User preferences page: Add calendar connection section

---

#### 1.1.3 Calendar UI Implementation
**File**: `app/calendar/page.tsx`

Create a comprehensive calendar page:

```typescript
import { Calendar } from '@/components/ui/calendar';
import { CalendarConnectionCard } from '@/components/calendar/CalendarConnectionCard';

Features to implement:
1. **Monthly Calendar View**
   - Show all team leaves (if manager/dept head)
   - Show own leaves (if employee)
   - Color-code by leave type (EL=green, CL=blue, ML=red, etc.)
   - Click date to see leave details
   - Hover to show tooltip with leave info

2. **Calendar Controls**
   - Month/Year navigation
   - "Today" quick jump button
   - View switcher: Month / Week / List

3. **Filter Panel**
   - Filter by leave type
   - Filter by team member (managers only)
   - Filter by status (APPROVED only, or ALL)

4. **Export Options**
   - Export team calendar to PDF
   - Export to ICS file (import to any calendar app)

5. **Calendar Connection Section**
   - CalendarConnectionCard component
   - Instructions for first-time setup
   - Sync status indicator
```

---

### Task 1.2: Complete PWA Offline Functionality

**Current State**:
- ✅ Manifest file exists (`public/manifest.json`)
- ⚠️ Service worker registration incomplete
- ⚠️ Offline data sync strategy missing
- ⚠️ Background sync not implemented

**What You Need to Do**:

#### 1.2.1 Service Worker Implementation
**File**: `public/sw.js`

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `cdbl-lms-${CACHE_VERSION}`;

// Resources to cache on install
const STATIC_CACHE = [
  '/',
  '/login',
  '/dashboard/employee',
  '/offline',
  '/_next/static/css/app/layout.css',
  // Add critical CSS/JS bundles
];

// Install event: Cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('cdbl-lms-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first strategy for API, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaves') {
    event.waitUntil(syncOfflineLeaves());
  }
});

async function syncOfflineLeaves() {
  // Retrieve pending actions from IndexedDB
  const db = await openDB();
  const pendingActions = await db.getAll('pendingActions');

  for (const action of pendingActions) {
    try {
      await fetch(action.url, action.options);
      await db.delete('pendingActions', action.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cdbl-lms-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
    };
  });
}
```

#### 1.2.2 Service Worker Registration
**File**: `app/layout.tsx`

Add after line 69:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  }
}, []);
```

#### 1.2.3 Offline Data Storage
**File**: `lib/offline/storage.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  pendingActions: {
    key: number;
    value: {
      id?: number;
      url: string;
      method: string;
      body: any;
      timestamp: number;
      retryCount: number;
    };
  };
  cachedLeaves: {
    key: string;
    value: {
      id: string;
      data: any;
      cachedAt: number;
    };
  };
}

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  return openDB<OfflineDB>('cdbl-lms-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('cachedLeaves', { keyPath: 'id' });
    },
  });
}

export async function queueOfflineAction(url: string, method: string, body: any) {
  const db = await getDB();
  await db.add('pendingActions', {
    url,
    method,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  });

  // Register background sync
  if ('sync' in registration) {
    await registration.sync.register('sync-leaves');
  }
}

export async function cacheLeaveData(id: string, data: any) {
  const db = await getDB();
  await db.put('cachedLeaves', {
    id,
    data,
    cachedAt: Date.now(),
  });
}

export async function getCachedLeave(id: string) {
  const db = await getDB();
  return db.get('cachedLeaves', id);
}
```

#### 1.2.4 Offline Hook
**File**: `hooks/useOffline.ts`

```typescript
import { useState, useEffect } from 'react';
import { queueOfflineAction } from '@/lib/offline/storage';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchWithOfflineSupport = async (url: string, options: RequestInit) => {
    if (!isOnline) {
      await queueOfflineAction(url, options.method || 'GET', options.body);
      setPendingCount(prev => prev + 1);
      return { offline: true, queued: true };
    }

    try {
      const response = await fetch(url, options);
      return response.json();
    } catch (error) {
      // Network error - queue for later
      await queueOfflineAction(url, options.method || 'GET', options.body);
      setPendingCount(prev => prev + 1);
      return { offline: true, queued: true };
    }
  };

  return { isOnline, pendingCount, fetchWithOfflineSupport };
}
```

#### 1.2.5 Offline Banner Component
**File**: `components/OfflineBanner.tsx`

```typescript
'use client';

import { useOffline } from '@/hooks/useOffline';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <Alert className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            Back online! Syncing {pendingCount} pending action{pendingCount > 1 ? 's' : ''}...
          </AlertDescription>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Changes will sync when you're back online.
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
```

Add to `app/layout.tsx` after Navbar component.

#### 1.2.6 Install Prompt
**File**: `components/InstallPrompt.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install CDBL LMS</h3>
          <p className="text-sm opacity-90 mb-3">
            Install our app for quick access and offline support
          </p>
          <Button onClick={handleInstall} size="sm" variant="secondary">
            Install Now
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 1.3: Complete Webhook Event System

**Current State**:
- ✅ Database models (`Webhook`, `WebhookDelivery`)
- ⚠️ Event dispatching minimal
- ⚠️ Retry logic incomplete

**What You Need to Do**:

#### 1.3.1 Webhook Service
**File**: `lib/services/webhook.service.ts`

```typescript
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type WebhookEvent =
  | 'leave.created'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.cancelled'
  | 'encashment.created'
  | 'encashment.approved'
  | 'balance.updated';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

export class WebhookService {
  /**
   * Dispatch webhook to all registered endpoints
   */
  static async dispatch(event: WebhookEvent, data: any) {
    // Get all active webhooks for this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        events: { has: event },
        isActive: true,
      },
    });

    // Dispatch to each webhook endpoint
    const deliveries = webhooks.map(webhook =>
      this.deliverWebhook(webhook, event, data)
    );

    await Promise.allSettled(deliveries);
  }

  /**
   * Deliver webhook to single endpoint with retry
   */
  private static async deliverWebhook(
    webhook: any,
    event: WebhookEvent,
    data: any
  ) {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      // Record delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          statusCode: response.status,
          response: await response.text(),
          success: response.ok,
          deliveredAt: new Date(),
        },
      });

      return response.ok;
    } catch (error) {
      // Record failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          statusCode: 0,
          response: error.message,
          success: false,
          error: error.message,
        },
      });

      // Schedule retry
      await this.scheduleRetry(webhook.id, event, data);

      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Schedule webhook retry with exponential backoff
   */
  private static async scheduleRetry(
    webhookId: string,
    event: WebhookEvent,
    data: any
  ) {
    // Get failed deliveries count
    const failedCount = await prisma.webhookDelivery.count({
      where: {
        webhookId,
        success: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Max 5 retries
    if (failedCount >= 5) {
      console.error(`Webhook ${webhookId} failed 5 times, giving up`);
      return;
    }

    // Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
    const delays = [60, 300, 900, 3600, 21600];
    const delaySeconds = delays[Math.min(failedCount, delays.length - 1)];

    // Queue for retry (you'll need to implement job scheduler)
    // For now, just log
    console.log(`Scheduling retry for webhook ${webhookId} in ${delaySeconds}s`);

    // TODO: Integrate with node-cron or Bull queue
  }

  /**
   * Register new webhook endpoint
   */
  static async register(url: string, events: WebhookEvent[], secret?: string) {
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    return prisma.webhook.create({
      data: {
        url,
        events,
        secret: webhookSecret,
        isActive: true,
      },
    });
  }

  /**
   * Test webhook endpoint
   */
  static async test(webhookId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) throw new Error('Webhook not found');

    return this.deliverWebhook(webhook, 'leave.created', {
      test: true,
      message: 'This is a test webhook',
    });
  }
}
```

#### 1.3.2 Integrate Webhooks into Leave Workflow

**File**: `lib/services/leave.service.ts`

After creating a leave request, add:

```typescript
// After leave created successfully
await WebhookService.dispatch('leave.created', {
  leaveId: newLeave.id,
  userId: newLeave.userId,
  leaveType: newLeave.leaveType,
  startDate: newLeave.startDate,
  endDate: newLeave.endDate,
  status: newLeave.status,
});
```

Similarly in approval service after approval:

```typescript
// After approval decision
const event = decision === 'APPROVED' ? 'leave.approved' : 'leave.rejected';
await WebhookService.dispatch(event, {
  leaveId: leave.id,
  approvedBy: approverId,
  decision,
  comment: approvalComment,
});
```

#### 1.3.3 Webhook Management API

**File**: `app/api/webhooks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/services/webhook.service';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const webhooks = await prisma.webhook.findMany({
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { url, events, secret } = await req.json();

  const webhook = await WebhookService.register(url, events, secret);
  return NextResponse.json(webhook, { status: 201 });
}
```

**File**: `app/api/webhooks/[id]/test/route.ts`

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(req);
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await WebhookService.test(params.id);
  return NextResponse.json({ success: true });
}
```

#### 1.3.4 Webhook Management UI

**File**: `app/admin/webhooks/page.tsx`

Create admin page to:
- List all webhooks
- Add new webhook (URL, events, optional secret)
- Test webhook (send test payload)
- View delivery history
- Enable/disable webhooks
- Delete webhooks

---

### Task 1.4: Enhance ModernTable Component

**Current State**:
- File `components/ui/modern-table.tsx` is a simple wrapper
- Lacks advanced table features

**What You Need to Do**:

**File**: `components/ui/modern-table.tsx`

Replace entire file with:

```typescript
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface ModernTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

export function ModernTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  searchable = false,
  searchPlaceholder = 'Search...',
  paginated = false,
  pageSize = 10,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
}: ModernTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  // Search/filter logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;

    return sortedData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="h-4 w-4 ml-1" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4 ml-1" />;
    return <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          {caption && <TableCaption>{caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={column.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Usage Example** in leave listing page:

```typescript
<ModernTable
  data={leaves}
  columns={[
    { key: 'id', header: 'ID', sortable: true, width: '100px' },
    {
      key: 'leaveType',
      header: 'Type',
      sortable: true,
      render: (row) => <Badge>{row.leaveType}</Badge>
    },
    { key: 'startDate', header: 'Start Date', sortable: true },
    { key: 'endDate', header: 'End Date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
  ]}
  searchable
  searchPlaceholder="Search leaves..."
  paginated
  pageSize={15}
  emptyMessage="No leave requests found"
  onRowClick={(row) => router.push(`/leaves/${row.id}`)}
/>
```

---

## PART 2: COMPREHENSIVE TESTING STRATEGY

### Task 2.1: Unit Tests

**Goal**: Achieve 80%+ code coverage for critical business logic

#### 2.1.1 Policy Engine Tests
**File**: `tests/unit/policy.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateLeaveRequest, calculateWorkingDays } from '@/lib/policy';

describe('Policy Engine', () => {
  describe('validateLeaveRequest', () => {
    it('should allow EL with sufficient balance', async () => {
      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'EARNED',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        workingDays: 3,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject EL without 5-day notice', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'EARNED',
        startDate: tomorrow,
        endDate: tomorrow,
        workingDays: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EL requires 5 working days notice');
    });

    it('should allow CL for less than 3 days without notice', async () => {
      const today = new Date();

      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'CASUAL',
        startDate: today,
        endDate: today,
        workingDays: 1,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject leave exceeding balance', async () => {
      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'CASUAL',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-30'),
        workingDays: 12, // Exceeds 10-day CL balance
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient balance');
    });

    it('should allow medical leave with certificate', async () => {
      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'MEDICAL',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        workingDays: 3,
        hasCertificate: true,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject medical leave without certificate for 3+ days', async () => {
      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'MEDICAL',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        workingDays: 3,
        hasCertificate: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Medical certificate required for 3+ days');
    });

    it('should enforce maximum continuous leave limits', async () => {
      const result = await validateLeaveRequest({
        userId: 'user1',
        leaveType: 'EARNED',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-15'),
        workingDays: 35, // Exceeds max continuous EL
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should exclude weekends', () => {
      const days = calculateWorkingDays(
        new Date('2025-01-06'), // Monday
        new Date('2025-01-10')  // Friday
      );
      expect(days).toBe(5);
    });

    it('should exclude holidays', () => {
      const days = calculateWorkingDays(
        new Date('2025-02-21'), // Shaheed Dibosh
        new Date('2025-02-21')
      );
      expect(days).toBe(0);
    });

    it('should handle month boundaries', () => {
      const days = calculateWorkingDays(
        new Date('2025-01-30'),
        new Date('2025-02-03')
      );
      expect(days).toBe(3); // Fri, Mon, Tue (excluding Sat, Sun)
    });
  });
});
```

**Test all policy functions**:
- Balance calculations
- Accrual logic
- Notice period validation
- Certificate requirements
- Carry-forward limits

#### 2.1.2 Workflow Engine Tests
**File**: `tests/unit/workflow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getApprovalChain, getNextApprover } from '@/lib/workflow';

describe('Workflow Engine', () => {
  it('should route employee EL through standard chain', async () => {
    const chain = await getApprovalChain({
      userId: 'emp1',
      userRole: 'EMPLOYEE',
      leaveType: 'EARNED',
    });

    expect(chain).toEqual(['HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD']);
  });

  it('should route dept head to CEO', async () => {
    const chain = await getApprovalChain({
      userId: 'depthead1',
      userRole: 'DEPT_HEAD',
      leaveType: 'EARNED',
    });

    expect(chain).toContain('CEO');
  });

  it('should handle approval delegation', async () => {
    // Setup delegation from HR_ADMIN to another user
    // ... delegation setup

    const nextApprover = await getNextApprover({
      leaveId: 'leave1',
      currentStep: 0,
    });

    expect(nextApprover).toBe('delegatedUserId');
  });

  it('should calculate total approval steps correctly', async () => {
    const steps = await getTotalApprovalSteps({
      userId: 'emp1',
      leaveType: 'EARNED',
    });

    expect(steps).toBe(3);
  });
});
```

#### 2.1.3 Service Layer Tests
**File**: `tests/unit/services/leave.service.test.ts`

Test all CRUD operations, edge cases, error handling.

#### 2.1.4 Run Unit Tests

```bash
pnpm test:unit
```

**Coverage Target**: 80%+

---

### Task 2.2: Integration Tests

#### 2.2.1 API Integration Tests
**File**: `tests/integration/api/leaves.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Leave API Integration', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        employeeId: 'TEST001',
        email: 'test@cdbl.com',
        name: 'Test User',
        role: 'EMPLOYEE',
        passwordHash: 'hashed',
      },
    });
    testUserId = user.id;

    // Get JWT token (implement login)
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@cdbl.com', password: 'test123' }),
    });
    const { token } = await loginRes.json();
    authToken = token;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it('should create leave request', async () => {
    const res = await fetch('http://localhost:3000/api/leaves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2025-02-01',
        endDate: '2025-02-01',
        reason: 'Personal',
      }),
    });

    expect(res.status).toBe(201);
    const leave = await res.json();
    expect(leave.status).toBe('PENDING');
  });

  it('should reject leave with insufficient balance', async () => {
    const res = await fetch('http://localhost:3000/api/leaves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2025-02-01',
        endDate: '2025-02-15',
        reason: 'Personal',
      }),
    });

    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.message).toContain('Insufficient balance');
  });

  it('should approve leave through workflow', async () => {
    // Create leave as employee
    const createRes = await fetch('http://localhost:3000/api/leaves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        leaveType: 'CASUAL',
        startDate: '2025-02-01',
        endDate: '2025-02-01',
        reason: 'Test',
      }),
    });
    const leave = await createRes.json();

    // Get HR_ADMIN token
    const hrToken = await getHRAdminToken();

    // Approve as HR_ADMIN
    const approveRes = await fetch(`http://localhost:3000/api/approvals/${leave.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hrToken}`,
      },
    });

    expect(approveRes.status).toBe(200);

    // Verify status updated
    const updatedLeave = await prisma.leaveRequest.findUnique({
      where: { id: leave.id },
    });
    expect(updatedLeave.status).toBe('APPROVED'); // or IN_PROGRESS if multi-step
  });

  // Add more tests for:
  // - Cancellation workflow
  // - Rejection flow
  // - Delegation
  // - Balance updates
  // - Encashment
});
```

Run: `pnpm test:integration`

---

### Task 2.3: E2E Tests with Playwright

#### 2.3.1 Leave Application Flow
**File**: `tests/e2e/leave-application.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Leave Application E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'employee@cdbl.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/employee');
  });

  test('should apply for casual leave successfully', async ({ page }) => {
    // Navigate to leave application
    await page.click('text=Apply for Leave');

    // Fill form
    await page.selectOption('[name="leaveType"]', 'CASUAL');
    await page.fill('[name="startDate"]', '2025-02-15');
    await page.fill('[name="endDate"]', '2025-02-15');
    await page.fill('[name="reason"]', 'Personal matters');

    // Submit
    await page.click('button:has-text("Submit")');

    // Verify success
    await expect(page.locator('text=Leave request submitted')).toBeVisible();

    // Verify appears in list
    await page.goto('/leaves');
    await expect(page.locator('text=Personal matters')).toBeVisible();
  });

  test('should show validation error for EL without notice', async ({ page }) => {
    await page.click('text=Apply for Leave');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await page.selectOption('[name="leaveType"]', 'EARNED');
    await page.fill('[name="startDate"]', dateStr);
    await page.fill('[name="endDate"]', dateStr);
    await page.fill('[name="reason"]', 'Urgent');

    await page.click('button:has-text("Submit")');

    await expect(page.locator('text=requires 5 working days notice')).toBeVisible();
  });

  test('should show insufficient balance error', async ({ page }) => {
    await page.click('text=Apply for Leave');

    await page.selectOption('[name="leaveType"]', 'CASUAL');
    await page.fill('[name="startDate"]', '2025-02-01');
    await page.fill('[name="endDate"]', '2025-02-20'); // 20 days
    await page.fill('[name="reason"]', 'Long vacation');

    await page.click('button:has-text("Submit")');

    await expect(page.locator('text=Insufficient balance')).toBeVisible();
  });
});

test.describe('Approval Workflow E2E', () => {
  test('should approve leave as HR Admin', async ({ page }) => {
    // Login as HR Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'hradmin@cdbl.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to approvals
    await page.goto('/approvals');

    // Click first pending approval
    await page.click('text=Pending >> nth=0');

    // Review and approve
    await page.fill('[name="comment"]', 'Approved');
    await page.click('button:has-text("Approve")');

    // Verify success
    await expect(page.locator('text=Leave approved successfully')).toBeVisible();
  });

  test('should reject leave with comment', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'hradmin@cdbl.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/approvals');
    await page.click('text=Pending >> nth=0');

    await page.fill('[name="comment"]', 'Denied due to team capacity');
    await page.click('button:has-text("Reject")');

    await expect(page.locator('text=Leave rejected')).toBeVisible();
  });
});
```

Run: `pnpm test:e2e`

---

### Task 2.4: Component Tests with Storybook

#### 2.4.1 Create Stories for Key Components

**File**: `components/dashboards/EmployeeDashboard.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeDashboard } from './EmployeeDashboard';

const meta: Meta<typeof EmployeeDashboard> = {
  title: 'Dashboards/Employee',
  component: EmployeeDashboard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof EmployeeDashboard>;

export const Default: Story = {
  args: {
    user: {
      id: '1',
      name: 'John Doe',
      role: 'EMPLOYEE',
    },
  },
};

export const WithPendingLeaves: Story = {
  args: {
    user: {
      id: '1',
      name: 'John Doe',
      role: 'EMPLOYEE',
    },
    pendingLeaves: 2,
  },
};

export const LowBalance: Story = {
  args: {
    user: {
      id: '1',
      name: 'John Doe',
      role: 'EMPLOYEE',
    },
    balances: {
      EARNED: 2,
      CASUAL: 1,
      MEDICAL: 5,
    },
  },
};
```

**Create stories for**:
- LeaveRequestForm
- LeaveBalancePanel
- ApprovalTimeline
- CalendarView
- All dashboard variants
- ModernTable

Run: `pnpm storybook`

---

## PART 3: PERFORMANCE OPTIMIZATION

### Task 3.1: Database Query Optimization

#### 3.1.1 Add Database Indexes

**File**: `prisma/schema.prisma`

Add indexes to frequently queried fields:

```prisma
model LeaveRequest {
  id String @id @default(cuid())
  userId String
  leaveType LeaveType
  status LeaveStatus
  startDate DateTime
  endDate DateTime
  createdAt DateTime @default(now())

  // Add indexes
  @@index([userId, status])
  @@index([userId, leaveType])
  @@index([status, startDate])
  @@index([startDate, endDate])
  @@index([createdAt])
}

model Approval {
  id String @id @default(cuid())
  leaveRequestId String
  approverId String
  decision ApprovalDecision
  createdAt DateTime @default(now())

  @@index([approverId, decision])
  @@index([leaveRequestId])
}

model Balance {
  id String @id @default(cuid())
  userId String
  leaveType LeaveType
  year Int

  @@unique([userId, leaveType, year])
  @@index([userId, year])
}
```

Run migration:
```bash
pnpm prisma migrate dev --name add_indexes
```

#### 3.1.2 Optimize N+1 Queries

**File**: `lib/services/leave.service.ts`

Before (N+1 problem):
```typescript
const leaves = await prisma.leaveRequest.findMany();
for (const leave of leaves) {
  const approvals = await prisma.approval.findMany({ where: { leaveRequestId: leave.id } });
  leave.approvals = approvals;
}
```

After (single query with include):
```typescript
const leaves = await prisma.leaveRequest.findMany({
  include: {
    approvals: {
      include: {
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    },
    user: {
      select: { id: true, name: true, email: true },
    },
  },
});
```

**Apply this pattern throughout all services**.

#### 3.1.3 Implement Query Result Caching

**File**: `lib/cache.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await redis.setex(key, ttlSeconds, JSON.stringify(data));

  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Usage in services**:

```typescript
import { cached, invalidateCache } from '@/lib/cache';

export async function getUserLeaves(userId: string) {
  return cached(
    `leaves:user:${userId}`,
    300, // 5 minutes
    async () => {
      return prisma.leaveRequest.findMany({
        where: { userId },
        include: { approvals: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  );
}

// Invalidate cache after updates
export async function createLeave(data: any) {
  const leave = await prisma.leaveRequest.create({ data });
  await invalidateCache(`leaves:user:${data.userId}*`);
  return leave;
}
```

---

### Task 3.2: Frontend Performance

#### 3.2.1 Implement React Suspense and Lazy Loading

**File**: `app/dashboard/employee/page.tsx`

```typescript
import { Suspense, lazy } from 'react';
import { LeaveBalancePanelSkeleton } from '@/components/skeletons';

const LeaveBalancePanel = lazy(() => import('@/components/shared/LeaveBalancePanel'));
const RecentLeaves = lazy(() => import('@/components/shared/RecentLeaves'));

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LeaveBalancePanelSkeleton />}>
        <LeaveBalancePanel />
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <RecentLeaves />
      </Suspense>
    </div>
  );
}
```

#### 3.2.2 Optimize Images

Use Next.js Image component everywhere:

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="CDBL"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

#### 3.2.3 Code Splitting

Leverage Next.js automatic code splitting by using dynamic imports:

```typescript
import dynamic from 'next/dynamic';

const CalendarView = dynamic(() => import('@/components/calendar/CalendarView'), {
  loading: () => <p>Loading calendar...</p>,
  ssr: false, // Disable SSR for heavy components
});
```

#### 3.2.4 Optimize SWR Configuration

**File**: `app/layout.tsx`

```typescript
import { SWRConfig } from 'swr';

<SWRConfig
  value={{
    refreshInterval: 0, // Disable auto-refresh
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10s deduplication
    errorRetryCount: 3,
    fetcher: (url) => fetch(url).then(res => res.json()),
  }}
>
  {children}
</SWRConfig>
```

---

### Task 3.3: API Performance

#### 3.3.1 Implement API Response Compression

**File**: `next.config.ts`

```typescript
const nextConfig = {
  compress: true, // Enable gzip compression
  // ... other config
};
```

#### 3.3.2 Add Request Deduplication Middleware

**File**: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const pendingRequests = new Map<string, Promise<any>>();

export async function middleware(request: NextRequest) {
  // Only for GET requests to API
  if (request.method === 'GET' && request.url.includes('/api/')) {
    const key = request.url;

    if (pendingRequests.has(key)) {
      // Reuse in-flight request
      return pendingRequests.get(key);
    }

    const promise = fetch(request.url).then(res => res.json());
    pendingRequests.set(key, promise);

    // Clear after 1 second
    setTimeout(() => pendingRequests.delete(key), 1000);

    return promise;
  }

  return NextResponse.next();
}
```

#### 3.3.3 Implement Pagination for Large Lists

**File**: `app/api/leaves/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { approvals: true },
    }),
    prisma.leaveRequest.count(),
  ]);

  return NextResponse.json({
    data: leaves,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

---

## PART 4: SECURITY HARDENING

### Task 4.1: Authentication Security

#### 4.1.1 Implement JWT Rotation

**File**: `lib/auth.ts`

Add after line 81:

```typescript
export async function refreshToken(oldToken: string) {
  try {
    const { payload } = await jwtVerify(
      oldToken,
      new TextEncoder().encode(JWT_SECRET)
    );

    // Check if token is close to expiration (< 1 hour remaining)
    const expiresIn = (payload.exp || 0) - Math.floor(Date.now() / 1000);
    if (expiresIn > 3600) {
      return oldToken; // Still valid for > 1 hour
    }

    // Issue new token
    return generateToken({
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as any,
    });
  } catch {
    throw new Error('Invalid token');
  }
}
```

#### 4.1.2 Implement Rate Limiting

**File**: `lib/ratelimit.ts`

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count recent requests
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  // Add current request
  await redis.zadd(key, now, `${now}`);
  await redis.expire(key, windowSeconds);

  return { success: true, remaining: maxRequests - count - 1 };
}
```

**Usage in API routes**:

```typescript
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success, remaining } = await rateLimit(ip, 10, 60); // 10 req/min

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  // ... continue with request
}
```

#### 4.1.3 Add CSRF Protection

**File**: `lib/csrf.ts`

```typescript
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}
```

Store CSRF token in session, validate on POST/PUT/DELETE requests.

#### 4.1.4 Implement Password Policies

**File**: `lib/password.ts`

```typescript
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return { valid: errors.length === 0, errors };
}

export async function checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
  // Check against last 5 passwords
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHistory: true },
  });

  if (!user?.passwordHistory) return true;

  for (const oldHash of user.passwordHistory.slice(-5)) {
    if (await bcrypt.compare(newPassword, oldHash)) {
      return false; // Password reused
    }
  }

  return true;
}
```

---

### Task 4.2: Input Validation & Sanitization

#### 4.2.1 Comprehensive Zod Schemas

**File**: `lib/validation/leave.schema.ts`

```typescript
import { z } from 'zod';

export const leaveRequestSchema = z.object({
  leaveType: z.enum([
    'EARNED',
    'CASUAL',
    'MEDICAL',
    'EXTRAWITHPAY',
    'EXTRAWITHOUTPAY',
    'MATERNITY',
    'PATERNITY',
    'STUDY',
    'SPECIAL_DISABILITY',
    'QUARANTINE',
    'SPECIAL',
  ]),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters')
    .regex(/^[a-zA-Z0-9\s.,!?-]+$/, 'Invalid characters in reason'),
  certificateUrl: z.string().url().optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const approvalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'RETURNED']),
  comment: z.string().max(500).optional(),
});
```

Use in API routes:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = leaveRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten() },
      { status: 400 }
    );
  }

  // ... continue with validated data
}
```

#### 4.2.2 SQL Injection Prevention

Prisma ORM already prevents SQL injection, but for raw queries:

```typescript
// NEVER do this:
const leaves = await prisma.$queryRaw`SELECT * FROM LeaveRequest WHERE userId = ${userId}`;

// Instead, use parameterized queries:
const leaves = await prisma.$queryRaw`SELECT * FROM LeaveRequest WHERE userId = ${userId}`;
```

Or better, use Prisma's query builder.

#### 4.2.3 XSS Prevention

Sanitize all user inputs before rendering:

**File**: `lib/sanitize.ts`

```typescript
export function sanitizeHTML(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

Use in components:

```typescript
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
```

Or use a library like DOMPurify for rich text.

---

### Task 4.3: Authorization Checks

#### 4.3.1 Middleware for Role-Based Access

**File**: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes
  if (path.startsWith('/login') || path.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  // Verify JWT
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access
  if (path.startsWith('/admin') && !['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (path.startsWith('/ceo') && user.role !== 'CEO') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### 4.3.2 API-Level Authorization

**File**: `lib/permissions.ts`

```typescript
export function canApproveLeave(user: User, leave: LeaveRequest): boolean {
  // Check if user is in the approval chain
  const approvalChain = getApprovalChain(leave);
  return approvalChain.includes(user.role);
}

export function canViewLeave(user: User, leave: LeaveRequest): boolean {
  // Own leave
  if (leave.userId === user.id) return true;

  // Approvers
  if (['HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD', 'CEO'].includes(user.role)) return true;

  // Department head can see team leaves
  if (user.role === 'DEPT_HEAD' && leave.user.departmentId === user.departmentId) {
    return true;
  }

  return false;
}

export function canModifyLeave(user: User, leave: LeaveRequest): boolean {
  // Only owner can modify, and only if PENDING
  return leave.userId === user.id && leave.status === 'PENDING';
}
```

Use in API routes:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAuth(req);
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!leave) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!canViewLeave(user, leave)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(leave);
}
```

---

### Task 4.4: Secrets Management

#### 4.4.1 Use Environment Variables

**File**: `.env.example`

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_lms"

# Authentication
JWT_SECRET="generate-strong-secret-min-32-chars"
AUTH_SECRET="another-strong-secret"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="app-specific-password"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Calendar APIs
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Webhook
WEBHOOK_SECRET="webhook-signing-secret"
```

**Never commit `.env` to git!**

#### 4.4.2 Vault Integration (Production)

For production, use a secrets manager like:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

**File**: `lib/secrets.ts`

```typescript
// Example for production deployment
export async function getSecret(key: string): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    // Fetch from vault (AWS Secrets Manager example)
    const AWS = require('aws-sdk');
    const client = new AWS.SecretsManager({ region: 'us-east-1' });

    const data = await client.getSecretValue({ SecretId: key }).promise();
    return data.SecretString;
  } else {
    return process.env[key] || '';
  }
}
```

---

## PART 5: PRODUCTION DEPLOYMENT

### Task 5.1: Pre-Deployment Checklist

Create checklist file:

**File**: `DEPLOYMENT_CHECKLIST.md`

```markdown
# Pre-Deployment Checklist

## Code Quality
- [ ] All tests passing (unit, integration, e2e)
- [ ] Test coverage > 80%
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No ESLint warnings (`pnpm lint`)
- [ ] Storybook builds successfully

## Security
- [ ] All dependencies updated (`pnpm audit`)
- [ ] No high/critical vulnerabilities
- [ ] JWT_SECRET set to strong value (32+ chars)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured

## Performance
- [ ] Database indexes created
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Redis caching configured
- [ ] Bundle size analyzed (`pnpm build`)

## Database
- [ ] All migrations run successfully
- [ ] Backup strategy in place
- [ ] Connection pooling configured
- [ ] Indexes verified

## Environment
- [ ] Production .env configured
- [ ] Email credentials verified
- [ ] Calendar API credentials set
- [ ] Redis connection tested
- [ ] Database connection tested

## Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring (Vercel Analytics, etc.)
- [ ] Log aggregation (CloudWatch, etc.)
- [ ] Uptime monitoring (Pingdom, etc.)

## Documentation
- [ ] API documentation updated
- [ ] User guide written
- [ ] Admin guide written
- [ ] Deployment guide written

## Legal/Compliance
- [ ] Privacy policy reviewed
- [ ] Terms of service updated
- [ ] Data retention policy documented
- [ ] GDPR compliance verified (if applicable)
```

---

### Task 5.2: Vercel Deployment

#### 5.2.1 Configure Vercel

**File**: `vercel.json`

Update or create:

```json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "EMAIL_HOST": "@email_host",
    "EMAIL_PORT": "@email_port",
    "EMAIL_USER": "@email_user",
    "EMAIL_PASSWORD": "@email_password",
    "REDIS_URL": "@redis_url",
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

#### 5.2.2 Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all required env vars

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 5.2.3 Configure Custom Domain

```bash
vercel domains add lms.cdbl.com
```

Add DNS records as instructed by Vercel.

---

### Task 5.3: Docker Deployment (Alternative)

#### 5.3.1 Optimize Dockerfile

**File**: `Dockerfile`

```dockerfile
# Multi-stage build for optimization
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: mariadb:11
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=cdbl_lms
    volumes:
      - db_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

#### 5.3.2 Build and Deploy

```bash
# Build image
docker build -t cdbl-lms:latest .

# Run with docker-compose
docker-compose up -d

# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# View logs
docker-compose logs -f app
```

---

### Task 5.4: Database Migration Strategy

#### 5.4.1 Production Migration Script

**File**: `scripts/migrate-production.sh`

```bash
#!/bin/bash

set -e

echo "🔍 Checking database connection..."
pnpm prisma db pull --schema=./prisma/schema.prisma

echo "📊 Running migrations..."
pnpm prisma migrate deploy

echo "✅ Migrations completed successfully"

echo "🌱 Running seed (if needed)..."
read -p "Run seed data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    pnpm prisma:seed
fi

echo "🎉 Database setup complete!"
```

Make executable:
```bash
chmod +x scripts/migrate-production.sh
```

#### 5.4.2 Backup Before Migration

**File**: `scripts/backup-db.sh`

```bash
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/cdbl_lms_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD cdbl_lms > $BACKUP_FILE

echo "✅ Backup saved to $BACKUP_FILE"
```

---

### Task 5.5: Monitoring & Observability

#### 5.5.1 Error Tracking with Sentry

Install Sentry:

```bash
pnpm add @sentry/nextjs
```

**File**: `sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
```

**File**: `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**File**: `app/error.tsx`

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
```

#### 5.5.2 Performance Monitoring

**File**: `lib/monitoring.ts`

```typescript
export function trackPerformance(metricName: string, value: number) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(metricName);

    // Send to analytics
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({ metric: metricName, value, timestamp: Date.now() }),
      });
    }
  }
}

export function measurePageLoad() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      trackPerformance('page_load_time', pageLoadTime);
    });
  }
}
```

#### 5.5.3 Health Check Endpoint

**File**: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis (if using)
    // await redis.ping();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

Monitor with:
```bash
curl https://your-domain.com/api/health
```

---

### Task 5.6: CI/CD Pipeline

#### 5.6.1 GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Generate Prisma Client
        run: pnpm prisma generate

      - name: Run linter
        run: pnpm lint

      - name: Run type check
        run: pnpm tsc --noEmit

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Build application
        run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## PART 6: DOCUMENTATION

### Task 6.1: API Documentation

#### 6.1.1 Swagger/OpenAPI Documentation

**File**: `app/api/docs/route.ts`

```typescript
import { createSwaggerSpec } from 'next-swagger-doc';

const spec = createSwaggerSpec({
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CDBL Leave Management API',
      version: '1.0.0',
      description: 'RESTful API for CDBL Leave Management System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://lms.cdbl.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});

export async function GET() {
  return new Response(JSON.stringify(spec), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Add JSDoc to API routes**:

```typescript
/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get all leave requests
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of leave requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *                 pagination:
 *                   type: object
 */
export async function GET(req: NextRequest) {
  // ...
}
```

#### 6.1.2 Create Swagger UI Page

**File**: `app/api-docs/page.tsx`

```typescript
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function APIDocsPage() {
  return <SwaggerUI url="/api/docs" />;
}
```

Access at: `http://localhost:3000/api-docs`

---

### Task 6.2: User Documentation

#### 6.2.1 User Guide

**File**: `docs/USER_GUIDE.md`

```markdown
# CDBL Leave Management System - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Applying for Leave](#applying-for-leave)
3. [Checking Leave Balance](#checking-leave-balance)
4. [Viewing Leave History](#viewing-leave-history)
5. [Cancelling Leave](#cancelling-leave)
6. [Encashment Requests](#encashment-requests)
7. [Calendar Integration](#calendar-integration)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Logging In
1. Navigate to the CDBL LMS login page
2. Enter your CDBL email address
3. Enter your password
4. Click "Login"

### Dashboard Overview
After logging in, you'll see:
- **Leave Balance Card**: Your available leave balances by type
- **Recent Requests**: Your 5 most recent leave applications
- **Quick Apply**: Button to apply for new leave
- **Calendar**: Visual representation of your upcoming leaves

## Applying for Leave

### Step-by-Step Process

1. **Click "Apply for Leave"** from the dashboard

2. **Select Leave Type**
   - **Earned Leave (EL)**: 2 days/month, requires 5 working days notice
   - **Casual Leave (CL)**: 10 days/year, no notice for <3 days
   - **Medical Leave (ML)**: 14 days/year, certificate required for 3+ days
   - *(Other leave types available based on policy)*

3. **Choose Dates**
   - Click start date on calendar
   - Click end date on calendar
   - System automatically calculates working days

4. **Enter Reason**
   - Provide clear reason (10-500 characters)
   - Be specific but professional

5. **Upload Certificate** (if applicable)
   - Required for Medical Leave 3+ days
   - Supported formats: PDF, JPG, PNG

6. **Review & Submit**
   - Check all details
   - Review automatic validation warnings
   - Click "Submit Application"

### Validation Rules

The system will automatically check:
- ✅ Sufficient balance available
- ✅ Notice period requirements met
- ✅ No team capacity conflicts
- ✅ No overlapping leave requests
- ✅ Certificate uploaded if required

## Checking Leave Balance

### Balance Card
Your dashboard shows real-time balance for all leave types:

```
EARNED LEAVE (EL)
24 days available
━━━━━━━━━━━━━━━━━━━━ 100%

CASUAL LEAVE (CL)
7 days available
━━━━━━━━━━░░░░░░░░░░ 70%
```

### Balance Projection
Click "View Projection" to see:
- Balance for next 24 months
- Expected accruals
- Planned deductions
- Expiry warnings

## Approval Process

Your leave request goes through multiple approval stages:

1. **HR Admin** - Initial review
2. **HR Head** - Policy compliance
3. **Department Head** - Team capacity review

**Tracking Progress:**
- View approval timeline on request details page
- Receive email notifications at each stage
- See approver comments

## Cancelling Leave

### Before Approval
1. Go to "My Leaves"
2. Find pending request
3. Click "Cancel Request"
4. Confirm cancellation

### After Approval
1. Click "Request Cancellation"
2. Enter reason for cancellation
3. Submit for approval
4. Cancellation follows same approval chain

## Encashment Requests

**Eligibility:** EL balance > 10 days

1. Navigate to "Encashment"
2. Click "Request Encashment"
3. Enter number of days (max: balance - 10)
4. Submit request
5. Wait for multi-level approval
6. Receive payment after approval

## Calendar Integration

### Connecting Google Calendar

1. Go to "Settings" → "Calendar"
2. Click "Connect Google Calendar"
3. Authorize CDBL LMS
4. Your approved leaves auto-sync

### Connecting Outlook

1. Go to "Settings" → "Calendar"
2. Click "Connect Outlook"
3. Sign in with Microsoft account
4. Authorize access

**Auto-Sync Features:**
- Approved leaves added to calendar
- Rejected leaves removed
- Updated dates reflected automatically

## Troubleshooting

### "Insufficient Balance" Error
**Solution:** Check balance projection, may need to wait for accrual

### "Notice Period Not Met" Error
**Solution:** Choose future dates or use CL/Quarantine leave types

### "Team Capacity Conflict" Warning
**Solution:** Coordinate with team, choose different dates, or proceed with warning

### Cannot Login
1. Verify email address is correct
2. Reset password if forgotten
3. Contact HR Admin if account locked

### Leave Not Showing in Calendar
1. Check calendar connection status
2. Reconnect calendar if needed
3. Only APPROVED leaves sync to calendar

## Getting Help

- **Email:** hr@cdbl.com
- **Internal Support:** Extension 123
- **System Issues:** it-support@cdbl.com
```

---

### Task 6.3: Administrator Guide

**File**: `docs/ADMIN_GUIDE.md`

Create comprehensive admin guide covering:
- User management
- Policy configuration
- HRIS sync procedures
- Report generation
- System configuration
- Troubleshooting
- Backup and restore procedures

---

## PART 7: FINAL STEPS BEFORE DEPLOYMENT

### Task 7.1: Security Audit

Run security checks:

```bash
# Check for vulnerabilities
pnpm audit

# Fix auto-fixable issues
pnpm audit fix

# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm update
```

### Task 7.2: Performance Audit

```bash
# Build and analyze bundle
pnpm build

# Check bundle size
npx @next/bundle-analyzer
```

Optimize if any route exceeds 250KB.

### Task 7.3: Final Testing

```bash
# Run all tests
pnpm test

# E2E tests
pnpm test:e2e

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

All must pass with 0 errors.

### Task 7.4: Database Preparation

```bash
# Create production database backup
./scripts/backup-db.sh

# Run migrations on production DB
./scripts/migrate-production.sh

# Verify data integrity
pnpm verify:deployment
```

### Task 7.5: Environment Setup

1. Set all production environment variables in Vercel/hosting platform
2. Verify all API keys and secrets
3. Test email sending
4. Test calendar API connections
5. Test database connection
6. Test Redis connection

### Task 7.6: Deploy to Staging

```bash
# Deploy to staging environment
vercel --target staging

# Run smoke tests on staging
pnpm test:e2e --base-url=https://staging.cdbl.com

# Performance test on staging
# Load test with k6 or Artillery
```

### Task 7.7: Deploy to Production

```bash
# Final production deployment
vercel --prod

# Monitor deployment
vercel logs --follow

# Run health check
curl https://lms.cdbl.com/api/health

# Monitor error rates in Sentry
```

### Task 7.8: Post-Deployment Monitoring

First 24 hours:
- [ ] Monitor error rates (should be < 0.1%)
- [ ] Check API response times (should be < 500ms p95)
- [ ] Verify user logins working
- [ ] Test critical flows (leave application, approval)
- [ ] Monitor database performance
- [ ] Check email delivery
- [ ] Verify webhook deliveries

---

## SUMMARY OF DELIVERABLES

### Completed Features
1. ✅ Calendar Integration (Google + Outlook)
2. ✅ PWA Offline Functionality
3. ✅ Webhook Event System
4. ✅ Enhanced ModernTable Component

### Testing
1. ✅ Unit Tests (80%+ coverage)
2. ✅ Integration Tests (API + Database)
3. ✅ E2E Tests (Critical user flows)
4. ✅ Component Tests (Storybook)

### Performance
1. ✅ Database Indexing
2. ✅ Query Optimization
3. ✅ Redis Caching
4. ✅ Frontend Optimization

### Security
1. ✅ JWT Rotation
2. ✅ Rate Limiting
3. ✅ CSRF Protection
4. ✅ Input Validation
5. ✅ Authorization Checks
6. ✅ Secrets Management

### Deployment
1. ✅ Vercel Configuration
2. ✅ Docker Setup (Alternative)
3. ✅ CI/CD Pipeline
4. ✅ Monitoring & Observability
5. ✅ Health Checks

### Documentation
1. ✅ API Documentation (Swagger)
2. ✅ User Guide
3. ✅ Admin Guide
4. ✅ Deployment Guide

---

## IMPORTANT NOTES

1. **Memory Optimization**: Your current setup uses memory optimization flags. Monitor memory usage in production and adjust NODE_OPTIONS accordingly.

2. **Database Migrations**: Always backup before running migrations in production. Use the provided scripts.

3. **Redis**: While ioredis is installed, full caching implementation is part of this guide. Implement caching for frequently accessed data.

4. **Testing**: Achieve 80%+ code coverage before production deployment. This is critical for enterprise systems.

5. **Security**: Rotate JWT_SECRET regularly (quarterly recommended). Use strong secrets (32+ characters).

6. **Calendar APIs**: Ensure you have proper OAuth credentials from Google and Microsoft before enabling calendar features.

7. **Webhooks**: Test webhook delivery with real endpoints before enabling for production integrations.

8. **Monitoring**: Set up Sentry or similar error tracking BEFORE production deployment.

9. **Backups**: Implement automated daily database backups with 30-day retention.

10. **Load Testing**: Perform load testing with realistic user volumes before launch.

---

## TIMELINE ESTIMATE

- **Calendar Integration**: 5-7 days
- **PWA Implementation**: 3-5 days
- **Webhook System**: 2-3 days
- **ModernTable Enhancement**: 1 day
- **Testing Suite**: 7-10 days
- **Performance Optimization**: 3-5 days
- **Security Hardening**: 3-5 days
- **Documentation**: 3-5 days
- **Deployment Setup**: 2-3 days
- **Testing & QA**: 5-7 days

**Total Estimated Time**: 35-50 days

---

## SUCCESS CRITERIA

The system is ready for production when:

1. ✅ All tests passing (unit, integration, e2e)
2. ✅ Code coverage > 80%
3. ✅ Zero high/critical security vulnerabilities
4. ✅ API response time < 500ms (p95)
5. ✅ Error rate < 0.1%
6. ✅ All core features functional
7. ✅ Documentation complete
8. ✅ Staging environment tested
9. ✅ Monitoring configured
10. ✅ Backup strategy in place

---

**Good luck with your deployment! This system is well-architected and ready for the final push to production. Follow this guide systematically, and you'll have a robust, secure, enterprise-grade leave management system.**
