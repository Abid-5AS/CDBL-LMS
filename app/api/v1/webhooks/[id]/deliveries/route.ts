import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { WebhookDeliveryStatus } from '@/lib/webhooks/types';

/**
 * @swagger
 * /api/v1/webhooks/{id}/deliveries:
 *   get:
 *     summary: Get webhook delivery history
 *     description: Retrieve delivery history for a specific webhook with pagination
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
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, success, failed, retrying]
 *     responses:
 *       200:
 *         description: Delivery history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveries:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     totalPages:
 *                       type: number
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    // Parse pagination parameters
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const statusFilter = url.searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { webhookId };
    if (statusFilter && Object.values(WebhookDeliveryStatus).includes(statusFilter as any)) {
      where.status = statusFilter;
    }

    // Fetch deliveries with pagination
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          event: true,
          status: true,
          attempts: true,
          maxAttempts: true,
          responseStatus: true,
          errorMessage: true,
          errorCode: true,
          deliveredAt: true,
          nextRetryAt: true,
          createdAt: true,
          updatedAt: true,
          // Don't include full payload and response body for list view
        },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error(`GET /api/v1/webhooks/${params.id}/deliveries error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to fetch delivery history', traceId),
      { status: 500 }
    );
  }
}
