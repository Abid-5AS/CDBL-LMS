import { NextResponse } from 'next/server';
import { getOutlookAuthUrl } from '@/lib/integrations/calendar/outlook-auth';

export async function GET() {
    try {
        const url = await getOutlookAuthUrl();
        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
