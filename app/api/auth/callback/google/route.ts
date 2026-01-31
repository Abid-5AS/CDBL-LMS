import { GoogleCalendarProvider } from '@/lib/integrations/calendar/google';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CalendarProvider } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/profile/integrations?error=google_auth_failed', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/profile/integrations?error=no_code', req.url));
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const provider = new GoogleCalendarProvider();
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/google`;

    const tokens = await provider.exchangeCode(code, redirectUri);

    // Save to DB
    await prisma.calendarConfig.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: CalendarProvider.GOOGLE
        }
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(tokens.expiryDate),
        providerAccountId: tokens.email || 'unknown',
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        provider: CalendarProvider.GOOGLE,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(tokens.expiryDate),
        providerAccountId: tokens.email || 'unknown',
        isActive: true
      }
    });

    return NextResponse.redirect(new URL('/profile/integrations?success=google_connected', req.url));
  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.redirect(new URL('/profile/integrations?error=exchange_failed', req.url));
  }
}
