import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { HRISSyncEngine } from '@/lib/integrations/hris/syncEngine';
import { CSVProvider } from '@/lib/integrations/hris/providers/csv';
import { ExcelProvider } from '@/lib/integrations/hris/providers/excel';

/**
 * POST /api/hris/sync
 * Trigger HRIS employee data synchronization
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SYSTEM_ADMIN and HR_ADMIN can trigger sync
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const provider = formData.get('provider') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine provider based on file type or explicit provider parameter
    let syncProvider;

    if (provider === 'csv' || file.name.endsWith('.csv')) {
      syncProvider = new CSVProvider(file);
    } else if (
      provider === 'excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    ) {
      syncProvider = new ExcelProvider(file);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV or Excel file.' },
        { status: 400 }
      );
    }

    // Create sync engine and execute sync
    const syncEngine = new HRISSyncEngine(syncProvider);
    const result = await syncEngine.syncAll(user.id);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[HRIS Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync HRIS data',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hris/sync
 * Get sync history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SYSTEM_ADMIN and HR_ADMIN can view sync history
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { prisma } = await import('@/lib/prisma');

    const syncs = await prisma.hRISSync.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        conflicts: {
          where: {
            resolution: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    const formattedSyncs = syncs.map((sync) => ({
      ...sync,
      unresolvedConflicts: sync.conflicts.length,
      conflicts: undefined, // Remove from response
    }));

    return NextResponse.json({ syncs: formattedSyncs });
  } catch (error) {
    console.error('[HRIS Sync History] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}
