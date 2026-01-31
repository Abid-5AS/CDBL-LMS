import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { HRISSyncEngine } from '@/lib/integrations/hris/syncEngine';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/hris/conflicts
 * Get all unresolved conflicts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conflicts = await prisma.hRISConflict.findMany({
      where: {
        resolution: null,
      },
      include: {
        sync: {
          select: {
            id: true,
            provider: true,
            startedAt: true,
          },
        },
        employee: {
          select: {
            id: true,
            empCode: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ conflicts });
  } catch (error) {
    console.error('[HRIS Conflicts] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflicts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hris/conflicts/:id/resolve
 * Resolve a conflict
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { conflictId, resolution } = body;

    if (!conflictId || !resolution) {
      return NextResponse.json(
        { error: 'Missing conflictId or resolution' },
        { status: 400 }
      );
    }

    if (!['keep_hris', 'keep_system', 'merge', 'skip'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type' },
        { status: 400 }
      );
    }

    await HRISSyncEngine.resolveConflict(conflictId, resolution, user.id);

    return NextResponse.json({
      success: true,
      message: 'Conflict resolved successfully',
    });
  } catch (error) {
    console.error('[HRIS Conflict Resolution] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}
