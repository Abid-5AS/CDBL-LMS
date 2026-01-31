import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
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
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configs = await prisma.calendarConfig.findMany({
    where: {
      userId,
      isActive: true
    },
    select: {
      provider: true,
      providerAccountId: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    google: configs.find(c => c.provider === 'GOOGLE') || null,
    outlook: configs.find(c => c.provider === 'OUTLOOK') || null
  });
}
