import { OutlookCalendarService } from '@/lib/integrations/calendar/outlook-calendar';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return new NextResponse('Missing code or state', { status: 400 });
    }

    try {
        const calendarService = new OutlookCalendarService();
        await calendarService.handleOutlookCallback(code, state, state);

        return NextResponse.redirect(new URL('/calendar', req.url));
    } catch (error) {
        console.error('Error handling Outlook Callback:', error);
        return NextResponse.redirect(new URL('/calendar?error=auth_failed', req.url));
    }
}
