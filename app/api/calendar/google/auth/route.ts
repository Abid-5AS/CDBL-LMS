import { GoogleCalendarService } from '@/lib/integrations/calendar/google-calendar';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Get authenticated user from session
        const user = await getCurrentUser();

        if (!user?.id) {
            return new NextResponse('Unauthorized - Please log in', { status: 401 });
        }

        const calendarService = new GoogleCalendarService();
        const url = await calendarService.setupGoogleCalendarAuth(user.id.toString());

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error initiating Google Auth:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(message, { status: 500 });
    }
}
