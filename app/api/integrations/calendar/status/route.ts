import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.calendarConfig.findMany({
        where: { userId: session.user.id },
        select: {
            provider: true,
            isActive: true,
            lastSyncAt: true,
        },
    });

    return NextResponse.json(configs);
}
