import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { WebhookEvent, WebhookPayload } from '@/lib/webhooks/types';
import { deliverWebhook } from '@/lib/webhooks/delivery';

/**
 * @swagger
 * /api/v1/webhooks/{id}/test:
 *   post:
 *     summary: Test webhook
 *     description: Send a test payload to the webhook endpoint to verify it's working
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Test webhook sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deliveryId:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error('unauthorized', undefined, traceId), { status: 401 });
  }

  if (!['HR_ADMIN', 'HR_HEAD', 'SUPER_ADMIN'].includes(me.role)) {
    return NextResponse.json(
      error('forbidden', 'Insufficient permissions', traceId),
      { status: 403 }
    );
  }

  try {
    const webhookId = parseInt(params.id);

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return NextResponse.json(
        error('not_found', 'Webhook not found', traceId),
        { status: 404 }
      );
    }

    // Create test payload
    const testPayload: WebhookPayload = {
      event: WebhookEvent.LEAVE_SUBMITTED,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook from CDBL Leave Management System',
        webhookId,
        triggeredBy: me.name,
        triggeredAt: new Date().toISOString(),
      },
      meta: {
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        requestId: traceId,
      },
    };

    // Deliver the test webhook
    await deliverWebhook(webhookId, WebhookEvent.LEAVE_SUBMITTED, testPayload);

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent successfully. Check the deliveries tab for results.',
    });
  } catch (err) {
    console.error(`POST /api/v1/webhooks/${params.id}/test error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to send test webhook', traceId),
      { status: 500 }
    );
  }
}
