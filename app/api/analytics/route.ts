import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AnalyticsCalculator } from '@/lib/analytics/calculator';

/**
 * GET /api/analytics
 * Get key analytics metrics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and managers can view analytics
    const allowedRoles = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_HEAD', 'DEPT_HEAD', 'CEO'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department') || undefined;

    const metrics = await AnalyticsCalculator.getKeyMetrics({ department });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
