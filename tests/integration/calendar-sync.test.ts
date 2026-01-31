import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarService } from '@/lib/integrations/calendar/calendar-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    calendarConfig: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    leaveRequest: {
      findUnique: vi.fn(),
    },
    leaveCalendarMapping: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock Google Calendar Integration
const mockGoogleCreateEvent = vi.fn().mockResolvedValue({ id: 'google-event-id' });
const mockGoogleUpdateEvent = vi.fn();
const mockGoogleDeleteEvent = vi.fn();

vi.mock('@/lib/integrations/calendar/google-calendar', () => ({
  GoogleCalendarService: class {
    constructor() {}
    createEvent = mockGoogleCreateEvent;
    updateEvent = mockGoogleUpdateEvent;
    deleteEvent = mockGoogleDeleteEvent;
  },
  syncLeaveToGoogleCalendar: vi.fn(),
}));

// Mock Outlook Calendar Integration
const mockOutlookCreateEvent = vi.fn().mockResolvedValue({ id: 'outlook-event-id' });
const mockOutlookUpdateEvent = vi.fn();
const mockOutlookDeleteEvent = vi.fn();

vi.mock('@/lib/integrations/calendar/outlook-calendar', () => ({
  OutlookCalendarService: class {
    constructor() {}
    createEvent = mockOutlookCreateEvent;
    updateEvent = mockOutlookUpdateEvent;
    deleteEvent = mockOutlookDeleteEvent;
  },
  syncLeaveToOutlook: vi.fn(),
}));



describe('Calendar Sync Integration', () => {
  const mockLeave = {
    id: 100,
    type: 'CASUAL',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-03'),
    reason: 'Vacation',
    status: 'APPROVED',
    requester: {
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sync to Google Calendar if configured', async () => {
    // Setup mocks
    (prisma.calendarConfig.findFirst as any).mockResolvedValue({
      userId: 1,
      provider: 'GOOGLE',
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 10000),
      id: 1,
    });

    (prisma.leaveRequest.findUnique as any).mockResolvedValue(mockLeave);
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.leaveCalendarMapping.findUnique as any).mockResolvedValue(null); // Not yet synced

    // Execute
    await CalendarService.syncLeaveEvent(100, 1);

    // Verify
    expect(mockGoogleCreateEvent).toHaveBeenCalled();
    expect(mockOutlookCreateEvent).not.toHaveBeenCalled();
    expect(prisma.leaveCalendarMapping.create).toHaveBeenCalled();
  });

  it('should sync to Outlook Calendar if configured', async () => {
    // Setup mocks
    (prisma.calendarConfig.findFirst as any).mockResolvedValue({
      userId: 1,
      provider: 'OUTLOOK',
      accessToken: 'mock-token',
      id: 1,
    });

    (prisma.leaveRequest.findUnique as any).mockResolvedValue(mockLeave);
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.leaveCalendarMapping.findUnique as any).mockResolvedValue(null);

    // Execute
    await CalendarService.syncLeaveEvent(100, 1);

    // Verify
    expect(mockOutlookCreateEvent).toHaveBeenCalled();
    expect(mockGoogleCreateEvent).not.toHaveBeenCalled();
  });

  it('should do nothing if no calendar configured', async () => {
    // Setup mocks
    (prisma.calendarConfig.findFirst as any).mockResolvedValue(null);
    (prisma.leaveRequest.findUnique as any).mockResolvedValue(mockLeave);

    // Execute
    await CalendarService.syncLeaveEvent(100, 1);

    // Verify
    expect(mockGoogleCreateEvent).not.toHaveBeenCalled();
    expect(mockOutlookCreateEvent).not.toHaveBeenCalled();
  });
});
