import { OutlookCalendarService } from '@/lib/integrations/calendar/outlook-calendar';
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

        const calendarService = new OutlookCalendarService();
        const url = await calendarService.setupOutlookAuth(user.id.toString());

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error initiating Outlook Auth:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(message, { status: 500 });
    }
}
