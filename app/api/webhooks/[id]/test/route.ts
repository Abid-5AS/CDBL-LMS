import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/services/webhook.service';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const webhookId = parseInt(params.id);
    if (isNaN(webhookId)) {
        return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
    }

    await WebhookService.test(webhookId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
      console.error('Failed to test webhook:', error);
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
