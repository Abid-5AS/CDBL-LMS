import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { CalendarProvider } from '@prisma/client';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');

    if (!provider) {
        return NextResponse.json({ error: 'Provider required' }, { status: 400 });
    }

    await prisma.calendarConfig.updateMany({
        where: {
            userId: session.user.id,
            provider: provider as CalendarProvider,
        },
        data: {
            isActive: false,
            accessToken: '',
            refreshToken: '',
        },
    });

    return NextResponse.json({ success: true });
}
