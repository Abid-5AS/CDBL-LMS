import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { error } from '@/lib/errors';
import { getTraceId } from '@/lib/trace';
import { WebhookEvent, ALL_WEBHOOK_EVENTS } from '@/lib/webhooks/types';
import crypto from 'crypto';

/**
 * Validation schema for webhook creation
 */
const CreateWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL'),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1, 'At least one event is required'),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
});

/**
 * @swagger
 * /api/v1/webhooks:
 *   get:
 *     summary: List all webhooks
 *     description: Retrieve all webhooks created by the current user or organization
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: enabled
 *         in: query
 *         description: Filter by enabled status
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Successfully retrieved webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       events:
 *                         type: array
 *                         items:
 *                           type: string
 *                       enabled:
 *                         type: boolean
 *                       description:
 *                         type: string
 *                       lastTriggeredAt:
 *                         type: string
 *                         format: date-time
 *                       failureCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export async function GET(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error('unauthorized', undefined, traceId), { status: 401 });
  }

  // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can manage webhooks
  if (!['HR_ADMIN', 'HR_HEAD', 'SYSTEM_ADMIN'].includes(me.role)) {
    return NextResponse.json(
      error('forbidden', 'Insufficient permissions to access webhooks', traceId),
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const enabledParam = url.searchParams.get('enabled');

    const where: any = {};
    if (enabledParam !== null) {
      where.enabled = enabledParam === 'true';
    }

    const webhooks = await prisma.webhook.findMany({
      where,
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        enabled: true,
        description: true,
        lastTriggeredAt: true,
        failureCount: true,
        lastFailureAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (err) {
    console.error('GET /api/v1/webhooks error:', err);
    return NextResponse.json(
      error('internal_error', 'Failed to fetch webhooks', traceId),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/webhooks:
 *   post:
 *     summary: Create a new webhook
 *     description: Create a new webhook subscription for receiving event notifications
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 description: Webhook name
 *                 example: 'Slack Integration'
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook endpoint URL
 *                 example: 'https://hooks.slack.com/services/XXX/YYY/ZZZ'
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [leave.submitted, leave.approved, leave.rejected, leave.cancelled, balance.updated, employee.created]
 *                 description: Events to subscribe to
 *                 example: ['leave.submitted', 'leave.approved']
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: 'Send leave notifications to Slack'
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Custom headers to include in webhook requests
 *                 example: { "X-Custom-Header": "value" }
 *               enabled:
 *                 type: boolean
 *                 description: Whether webhook is enabled
 *                 default: true
 *     responses:
 *       201:
 *         description: Webhook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhook:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *                     secret:
 *                       type: string
 *                       description: HMAC secret for signature verification
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json(error('unauthorized', undefined, traceId), { status: 401 });
  }

  // Only HR_ADMIN, HR_HEAD, and SYSTEM_ADMIN can create webhooks
  if (!['HR_ADMIN', 'HR_HEAD', 'SYSTEM_ADMIN'].includes(me.role)) {
    return NextResponse.json(
      error('forbidden', 'Insufficient permissions to create webhooks', traceId),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = CreateWebhookSchema.parse(body);

    // Generate a random secret for HMAC signatures
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        events: data.events as any,
        secret,
        description: data.description,
        headers: data.headers as any,
        enabled: data.enabled,
        createdBy: me.id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        secret: true,
        enabled: true,
        description: true,
        headers: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        error('validation_error', 'Invalid request data', traceId, { errors: err.format() }),
        { status: 400 }
      );
    }
    console.error('POST /api/v1/webhooks error:', err);
    return NextResponse.json(
      error('internal_error', 'Failed to create webhook', traceId),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
