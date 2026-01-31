import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/cache';

// Health check should always be dynamic (no caching)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis (optional)
    let redisStatus = 'disabled';
    if (redis.status === 'ready') {
      redisStatus = 'connected';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
