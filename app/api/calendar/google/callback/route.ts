import { GoogleCalendarService } from '@/lib/integrations/calendar/google-calendar';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return new NextResponse('Missing code or state', { status: 400 });
    }

    try {
        const calendarService = new GoogleCalendarService();
        // The state parameter contains the userId as set in the auth route
        await calendarService.handleGoogleCallback(code, state, state);

        // Redirect back to calendar page or settings
        return NextResponse.redirect(new URL('/calendar', req.url));
    } catch (error) {
        console.error('Error handling Google Callback:', error);
        return NextResponse.redirect(new URL('/calendar?error=auth_failed', req.url));
    }
}
