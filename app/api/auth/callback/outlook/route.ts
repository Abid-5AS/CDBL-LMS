import { OutlookCalendarProvider } from '@/lib/integrations/calendar/outlook';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CalendarProvider } from '@prisma/client';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload.userId as number;
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/profile/integrations?error=outlook_auth_failed', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/profile/integrations?error=no_code', req.url));
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const provider = new OutlookCalendarProvider();
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/outlook`;

    const tokens = await provider.exchangeCode(code, redirectUri);

    // Save to DB
    await prisma.calendarConfig.upsert({
      where: {
        userId_provider: {
          userId,
          provider: CalendarProvider.OUTLOOK
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
        userId,
        provider: CalendarProvider.OUTLOOK,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(tokens.expiryDate),
        providerAccountId: tokens.email || 'unknown',
        isActive: true
      }
    });

    return NextResponse.redirect(new URL('/profile/integrations?success=outlook_connected', req.url));
  } catch (error) {
    console.error('Outlook Auth Error:', error);
    return NextResponse.redirect(new URL('/profile/integrations?error=exchange_failed', req.url));
  }
}
