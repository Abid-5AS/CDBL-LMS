import { NextRequest, NextResponse } from 'next/server';
import { getOutlookTokens } from '@/lib/integrations/calendar/outlook-auth';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings/calendar?error=outlook_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings/calendar?error=no_code', request.url));
    }

    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const tokens = await getOutlookTokens(code);

        if (!tokens.accessToken) {
            throw new Error('Invalid tokens received');
        }

        // Outlook tokens usually expire in 1 hour
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + 3600);

        await prisma.calendarConfig.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider: CalendarProvider.OUTLOOK,
                },
            },
            update: {
                accessToken: tokens.accessToken,
                // refreshToken: tokens.refreshToken, // MSAL handles this, but we might need to store account info
                tokenExpiry: expiryDate,
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                provider: CalendarProvider.OUTLOOK,
                providerAccountId: 'outlook', // Should fetch profile
                accessToken: tokens.accessToken,
                refreshToken: '', // MSAL cache
                tokenExpiry: expiryDate,
                isActive: true,
            },
        });

        return NextResponse.redirect(new URL('/settings/calendar?success=outlook_connected', request.url));
    } catch (error) {
        console.error('Outlook Auth Error:', error);
        return NextResponse.redirect(new URL('/settings/calendar?error=token_exchange_failed', request.url));
    }
}
