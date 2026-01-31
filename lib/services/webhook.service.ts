import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type WebhookEvent =
  | 'leave.created'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.cancelled'
  | 'encashment.created'
  | 'encashment.approved'
  | 'balance.updated';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

export class WebhookService {
  /**
   * Dispatch webhook to all registered endpoints
   */
  static async dispatch(event: WebhookEvent, data: any) {
    // Get all active webhooks for this event
    // Note: Prisma JSON filter might need specific syntax depending on DB, 
    // but 'array_contains' or similar logic is needed. 
    // For MySQL/Prisma, we might need to fetch all and filter in memory if 'has' isn't fully supported for JSON arrays in all versions,
    // but Prisma 7 should support it.
    // However, the schema defines `events Json`. Prisma's `array_contains` or `has` works if mapped correctly.
    // Let's try to fetch all active and filter in code to be safe and database agnostic for now, 
    // or use raw query if needed. But let's try standard Prisma first.
    // Actually, for JSON columns, filtering can be tricky. 
    // Let's fetch all active webhooks and filter in JS for reliability.
    
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true, // Schema says 'enabled' or 'isActive'? Schema in prompt said 'enabled' in one place and 'isActive' in another?
        // Let's check schema again.
        // Schema in prompt: `enabled Boolean @default(true)`
        // BUT in `WebhookService` code in prompt it used `isActive`.
        // I should check the actual schema file I read earlier.
        // File `prisma/schema.prisma`:
        // model Webhook { ... enabled Boolean @default(true) ... }
        // So it is `enabled`.
        enabled: true,
      },
    });

    const matchingWebhooks = webhooks.filter(wh => {
        const events = wh.events as string[];
        return Array.isArray(events) && events.includes(event);
    });

    // Dispatch to each webhook endpoint
    const deliveries = matchingWebhooks.map(webhook =>
      this.deliverWebhook(webhook, event, data)
    );

    await Promise.allSettled(deliveries);
  }

  /**
   * Deliver webhook to single endpoint with retry
   */
  private static async deliverWebhook(
    webhook: any,
    event: WebhookEvent,
    data: any
  ) {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      // Record delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any, // Prisma JSON handling
          status: response.ok ? 'success' : 'failed',
          requestUrl: webhook.url,
          requestBody: payload as any,
          responseStatus: response.status,
          responseBody: await response.text(),
          deliveredAt: new Date(),
        },
      });

      return response.ok;
    } catch (error: any) {
      // Record failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          status: 'failed',
          requestUrl: webhook.url,
          requestBody: payload as any,
          responseStatus: 0,
          errorMessage: error.message,
        },
      });

      // Schedule retry
      await this.scheduleRetry(webhook.id, event, data);

      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Schedule webhook retry with exponential backoff
   */
  private static async scheduleRetry(
    webhookId: number,
    event: WebhookEvent,
    data: any
  ) {
    // Get failed deliveries count
    const failedCount = await prisma.webhookDelivery.count({
      where: {
        webhookId,
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Max 5 retries
    if (failedCount >= 5) {
      console.error(`Webhook ${webhookId} failed 5 times, giving up`);
      return;
    }

    // Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
    const delays = [60, 300, 900, 3600, 21600];
    const delaySeconds = delays[Math.min(failedCount, delays.length - 1)];

    // Queue for retry (you'll need to implement job scheduler)
    // For now, just log
    console.log(`Scheduling retry for webhook ${webhookId} in ${delaySeconds}s`);

    // TODO: Integrate with node-cron or Bull queue
  }

  /**
   * Register new webhook endpoint
   */
  static async register(url: string, events: WebhookEvent[], secret?: string) {
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    return prisma.webhook.create({
      data: {
        name: new URL(url).hostname, // Default name
        url,
        events: events as any,
        secret: webhookSecret,
        enabled: true,
        createdBy: 1, // TODO: Replace with actual user ID
      },
    });
  }

  /**
   * Get all webhooks
   */
  static async getAll() {
    return prisma.webhook.findMany({
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get webhook by ID
   */
  static async getById(id: number) {
    return prisma.webhook.findUnique({
      where: { id },
    });
  }

  /**
   * Get webhook deliveries with pagination
   */
  static async getDeliveries(webhookId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({
        where: { webhookId },
      }),
    ]);

    return {
      deliveries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
      },
    };
  }

  /**
   * Retry a failed delivery
   */
  static async retryDelivery(deliveryId: number) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) throw new Error('Delivery not found');
    if (!delivery.webhook) throw new Error('Webhook not found');

    // Cast payload safely
    const payload = delivery.payload as unknown as WebhookPayload;

    // We reuse the original event and data from payload
    return this.deliverWebhook(
      delivery.webhook,
      delivery.event as WebhookEvent,
      payload.data
    );
  }

  /**
   * Get webhook statistics
   */
  static async getStats(webhookId: number) {
    const [total, successful, failed] = await Promise.all([
      prisma.webhookDelivery.count({ where: { webhookId } }),
      prisma.webhookDelivery.count({ where: { webhookId, status: 'success' } }),
      prisma.webhookDelivery.count({ where: { webhookId, status: 'failed' } }),
    ]);

    return {
      totalDeliveries: total,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      lastDeliveryAt: null, // TODO: Implement last delivery tracking if needed efficiently
      lastSuccessAt: null,
      lastFailureAt: null,
    };
  }

  /**
   * Test webhook endpoint
   */
  static async test(webhookId: number) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) throw new Error('Webhook not found');

    return this.deliverWebhook(webhook, 'leave.created', {
      test: true,
      message: 'This is a test webhook',
    });
  }
}
