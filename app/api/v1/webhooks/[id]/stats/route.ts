import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { getWebhookStats } from '@/lib/webhooks/delivery';

/**
 * @swagger
 * /api/v1/webhooks/{id}/stats:
 *   get:
 *     summary: Get webhook statistics
 *     description: Retrieve delivery statistics and success rate for a webhook
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
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     webhookId:
 *                       type: number
 *                     totalDeliveries:
 *                       type: number
 *                     successCount:
 *                       type: number
 *                     failureCount:
 *                       type: number
 *                     retryCount:
 *                       type: number
 *                     successRate:
 *                       type: number
 *                     lastDeliveryAt:
 *                       type: string
 *                       format: date-time
 *                     lastSuccessAt:
 *                       type: string
 *                       format: date-time
 *                     lastFailureAt:
 *                       type: string
 *                       format: date-time
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error('unauthorized', undefined, traceId), { status: 401 });
  }

  if (!['HR_ADMIN', 'HR_HEAD', 'SYSTEM_ADMIN'].includes(me.role)) {
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

    // Get statistics
    const stats = await getWebhookStats(webhookId);

    return NextResponse.json({ stats });
  } catch (err) {
    console.error(`GET /api/v1/webhooks/${params.id}/stats error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to fetch webhook statistics', traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
