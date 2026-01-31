import { GoogleCalendarService } from '@/lib/integrations/calendar/google-calendar';
import { OutlookCalendarService } from '@/lib/integrations/calendar/outlook-calendar';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { leaveRequestId, userId, action } = body;

        if (!leaveRequestId || !userId || !action) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Determine provider
        const config = await prisma.calendarConfig.findFirst({
            where: { userId: parseInt(userId), isActive: true },
        });

        if (!config) {
            return new NextResponse('No active calendar connection', { status: 400 });
        }

        if (config.provider === CalendarProvider.GOOGLE) {
            const service = new GoogleCalendarService(config.accessToken, config.refreshToken);
            if (action === 'create') {
                await service.syncLeaveToGoogleCalendar(leaveRequestId, userId);
            } else if (action === 'update') {
                await service.updateGoogleCalendarEvent(leaveRequestId);
            } else if (action === 'delete') {
                await service.deleteGoogleCalendarEvent(leaveRequestId);
            }
        } else if (config.provider === CalendarProvider.OUTLOOK) {
            const service = new OutlookCalendarService(config.accessToken);
             if (action === 'create') {
                await service.syncLeaveToOutlook(leaveRequestId, userId);
            } else if (action === 'update') {
                await service.updateOutlookEvent(leaveRequestId);
            } else if (action === 'delete') {
                await service.deleteOutlookEvent(leaveRequestId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error syncing calendar:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
