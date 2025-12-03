import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/integrations/calendar/google-auth';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';
import { getSession } from '@/lib/auth'; // Assuming auth helper exists

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings/calendar?error=google_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings/calendar?error=no_code', request.url));
    }

    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const tokens = await getGoogleTokens(code);

        if (!tokens.access_token || !tokens.expiry_date) {
            throw new Error('Invalid tokens received');
        }

        await prisma.calendarConfig.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider: CalendarProvider.GOOGLE,
                },
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined, // Only update if present
                tokenExpiry: new Date(tokens.expiry_date),
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                provider: CalendarProvider.GOOGLE,
                providerAccountId: 'google', // We might want to fetch user profile to get email
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                tokenExpiry: new Date(tokens.expiry_date),
                isActive: true,
            },
        });

        return NextResponse.redirect(new URL('/settings/calendar?success=google_connected', request.url));
    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.redirect(new URL('/settings/calendar?error=token_exchange_failed', request.url));
    }
}
