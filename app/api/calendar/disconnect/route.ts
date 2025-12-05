import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { CalendarProvider } from '@prisma/client';

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

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { provider } = body;

  if (!provider || !['GOOGLE', 'OUTLOOK'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  // Deactivate config
  await prisma.calendarConfig.updateMany({
    where: {
      userId,
      provider: provider as CalendarProvider
    },
    data: {
      isActive: false,
      accessToken: '', // Clear tokens for security
      refreshToken: ''
    }
  });

  return NextResponse.json({ success: true });
}
