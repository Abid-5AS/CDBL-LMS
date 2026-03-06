import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { retryDelivery } from '@/lib/webhooks/delivery';

/**
 * @swagger
 * /api/v1/webhooks/{id}/deliveries/{deliveryId}:
 *   get:
 *     summary: Get delivery details
 *     description: Retrieve detailed information about a specific webhook delivery
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
 *       - name: deliveryId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Delivery details retrieved successfully
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string; deliveryId: string } }
) {
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
    const deliveryId = parseInt(params.deliveryId);

    const delivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhookId,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        error('not_found', 'Delivery not found', traceId),
        { status: 404 }
      );
    }

    return NextResponse.json({ delivery });
  } catch (err) {
    console.error(`GET /api/v1/webhooks/${params.id}/deliveries/${params.deliveryId} error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to fetch delivery details', traceId),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/webhooks/{id}/deliveries/{deliveryId}:
 *   post:
 *     summary: Retry failed delivery
 *     description: Manually retry a failed webhook delivery
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
 *       - name: deliveryId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Retry initiated successfully
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string; deliveryId: string } }
) {
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
    const deliveryId = parseInt(params.deliveryId);

    // Verify delivery exists and belongs to this webhook
    const delivery = await prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhookId,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        error('not_found', 'Delivery not found', traceId),
        { status: 404 }
      );
    }

    // Retry the delivery
    await retryDelivery(deliveryId);

    return NextResponse.json({
      success: true,
      message: 'Delivery retry initiated successfully',
    });
  } catch (err: any) {
    console.error(`POST /api/v1/webhooks/${params.id}/deliveries/${params.deliveryId} error:`, err);
    return NextResponse.json(
      error('internal_error', err.message || 'Failed to retry delivery', traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
