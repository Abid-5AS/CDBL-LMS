import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/integrations/calendar/google-auth';

export async function GET() {
    try {
        const url = getGoogleAuthUrl();
        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
