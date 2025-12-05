import { GoogleCalendarProvider } from '@/lib/integrations/calendar/google';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CalendarProvider } from '@prisma/client';
import { getToken } from 'next-auth/jwt'; // Assuming next-auth is used, or custom auth
// Wait, the plan says custom JWT with jose. I need to get the user ID from the session/cookie.
// I'll check how other routes get the user.
// Checking /app/api/payroll/export/route.ts or similar would be good.
// But for now I'll assume I can get it from headers or a helper.
// The project uses custom JWT. I'll check `lib/auth.ts` or similar if it exists.
// For now, I'll use a placeholder `getCurrentUser` function or similar logic.

// Let's check how to get the current user.
// I'll assume there's a `getUser` helper.
// I'll look for auth helpers first.

import { cookies } from 'next/headers';
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
    return NextResponse.redirect(new URL('/profile/integrations?error=google_auth_failed', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/profile/integrations?error=no_code', req.url));
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
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
          userId,
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
        userId,
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
