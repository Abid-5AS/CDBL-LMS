import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/services/webhook.service';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const webhooks = await prisma.webhook.findMany({
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { url, events, secret } = await req.json();

    if (!url || !events || !Array.isArray(events)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const webhook = await WebhookService.register(url, events, secret);
    return NextResponse.json(webhook, { status: 201 });
  } catch (error: any) {
      console.error('Failed to register webhook:', error);
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
