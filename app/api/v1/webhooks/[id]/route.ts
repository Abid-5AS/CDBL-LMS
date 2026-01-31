import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { WebhookEvent } from '@/lib/webhooks/types';

const UpdateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1).optional(),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
});

/**
 * @swagger
 * /api/v1/webhooks/{id}:
 *   get:
 *     summary: Get webhook details
 *     description: Retrieve detailed information about a specific webhook
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
 *         description: Webhook details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json(
        error('not_found', 'Webhook not found', traceId),
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook });
  } catch (err) {
    console.error(`GET /api/v1/webhooks/${params.id} error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to fetch webhook', traceId),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/webhooks/{id}:
 *   patch:
 *     summary: Update webhook
 *     description: Update webhook configuration
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    const body = await req.json();
    const data = UpdateWebhookSchema.parse(body);

    // Check if webhook exists
    const existing = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existing) {
      return NextResponse.json(
        error('not_found', 'Webhook not found', traceId),
        { status: 404 }
      );
    }

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events as any }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.headers !== undefined && { headers: data.headers as any }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ webhook });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        error('validation_error', 'Invalid request data', traceId, { errors: err.format() }),
        { status: 400 }
      );
    }
    console.error(`PATCH /api/v1/webhooks/${params.id} error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to update webhook', traceId),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/webhooks/{id}:
 *   delete:
 *     summary: Delete webhook
 *     description: Delete a webhook subscription
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
 *         description: Webhook deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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
    const existing = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existing) {
      return NextResponse.json(
        error('not_found', 'Webhook not found', traceId),
        { status: 404 }
      );
    }

    // Delete webhook (cascades to deliveries)
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err) {
    console.error(`DELETE /api/v1/webhooks/${params.id} error:`, err);
    return NextResponse.json(
      error('internal_error', 'Failed to delete webhook', traceId),
      { status: 500 }
    );
  }
}
