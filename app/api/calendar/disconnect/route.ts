import { GoogleCalendarService } from '@/lib/integrations/calendar/google-calendar';
import { OutlookCalendarService } from '@/lib/integrations/calendar/outlook-calendar';
import { getCurrentUser } from '@/lib/auth';
import { CalendarProvider } from '@prisma/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Authenticate user
        const user = await getCurrentUser();

        if (!user?.id) {
            return new NextResponse('Unauthorized - Please log in', { status: 401 });
        }

        // Parse request body with proper error handling
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            return new NextResponse('Invalid JSON in request body', { status: 400 });
        }

        const { provider } = body;

        if (!provider) {
            return new NextResponse('Missing required field: provider', { status: 400 });
        }

        // Validate provider type
        if (provider !== 'GOOGLE_CALENDAR' && provider !== 'OUTLOOK') {
            return new NextResponse('Invalid provider. Must be GOOGLE_CALENDAR or OUTLOOK', { status: 400 });
        }

        // Use authenticated user's ID instead of accepting it from body (security)
        const userId = user.id.toString();

        if (provider === 'GOOGLE_CALENDAR') {
            const service = new GoogleCalendarService();
            await service.disconnectGoogleCalendar(userId);
        } else if (provider === 'OUTLOOK') {
            const service = new OutlookCalendarService('');
            await service.disconnectOutlook(userId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(message, { status: 500 });
    }
}
