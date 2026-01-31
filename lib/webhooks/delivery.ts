/**
 * Webhook Delivery Service
 * Handles webhook delivery with retry logic, signature generation, and error tracking
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
  WebhookEvent,
  WebhookPayload,
  WebhookDeliveryStatus,
  DeliveryOptions,
  calculateNextRetryTime,
} from './types';

const DEFAULT_OPTIONS: Required<DeliveryOptions> = {
  timeout: 10000, // 10 seconds
  retryDelay: 1000, // 1 second
  retryMultiplier: 2,
  maxRetries: 3,
};

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Deliver webhook to a single endpoint
 */
export async function deliverWebhook(
  webhookId: number,
  event: WebhookEvent,
  payload: WebhookPayload,
  options: DeliveryOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get webhook configuration
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    throw new Error(`Webhook ${webhookId} not found`);
  }

  if (!webhook.enabled) {
    console.log(`[Webhook] Webhook ${webhookId} is disabled, skipping delivery`);
    return;
  }

  // Check if webhook is subscribed to this event
  const events = webhook.events as string[];
  if (!events.includes(event)) {
    console.log(`[Webhook] Webhook ${webhookId} not subscribed to event ${event}, skipping`);
    return;
  }

  // Prepare request body
  const requestBody = JSON.stringify(payload);

  // Generate signature
  const signature = generateSignature(requestBody, webhook.secret);

  // Prepare headers
  const customHeaders = (webhook.headers as Record<string, string>) || {};
  const requestHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'CDBL-Leave-Management-Webhook/1.0',
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': event,
    'X-Webhook-ID': webhookId.toString(),
    'X-Webhook-Delivery-ID': '', // Will be set after creating delivery record
    ...customHeaders,
  };

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload: payload as any,
      requestUrl: webhook.url,
      requestHeaders: requestHeaders as any,
      requestBody: payload as any,
      status: WebhookDeliveryStatus.PENDING,
      attempts: 0,
      maxAttempts: opts.maxRetries,
    },
  });

  // Update delivery ID in headers
  requestHeaders['X-Webhook-Delivery-ID'] = delivery.id.toString();

  // Perform delivery
  await performDelivery(delivery.id, webhook.url, requestHeaders, requestBody, opts);
}

/**
 * Perform actual HTTP delivery
 */
async function performDelivery(
  deliveryId: number,
  url: string,
  headers: Record<string, string>,
  body: string,
  options: Required<DeliveryOptions>
): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    throw new Error(`Delivery ${deliveryId} not found`);
  }

  const currentAttempt = delivery.attempts + 1;

  try {
    console.log(`[Webhook] Delivering webhook ${deliveryId}, attempt ${currentAttempt}/${delivery.maxAttempts}`);

    // Update delivery status to retrying if not first attempt
    if (currentAttempt > 1) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.RETRYING,
          attempts: currentAttempt,
        },
      });
    } else {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attempts: currentAttempt,
        },
      });
    }

    // Make HTTP request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Read response
    const responseBody = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());

    // Update delivery record with success
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: WebhookDeliveryStatus.SUCCESS,
        responseStatus: response.status,
        responseHeaders: responseHeaders as any,
        responseBody: responseBody.substring(0, 10000), // Limit response body size
        deliveredAt: new Date(),
      },
    });

    // Update webhook last triggered time
    await prisma.webhook.update({
      where: { id: delivery.webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      },
    });

    console.log(`[Webhook] Delivery ${deliveryId} successful (HTTP ${response.status})`);
  } catch (error: any) {
    console.error(`[Webhook] Delivery ${deliveryId} failed:`, error.message);

    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN_ERROR';

    // Check if we should retry
    const shouldRetry = currentAttempt < delivery.maxAttempts;

    if (shouldRetry) {
      // Calculate next retry time
      const nextRetryAt = calculateNextRetryTime(currentAttempt, options.retryDelay);

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.RETRYING,
          errorMessage,
          errorCode,
          nextRetryAt,
        },
      });

      console.log(`[Webhook] Scheduling retry for delivery ${deliveryId} at ${nextRetryAt.toISOString()}`);

      // Schedule retry (in production, this would use a job queue like BullMQ)
      const delay = nextRetryAt.getTime() - Date.now();
      setTimeout(() => {
        performDelivery(deliveryId, url, headers, body, options).catch((err) => {
          console.error(`[Webhook] Retry failed for delivery ${deliveryId}:`, err);
        });
      }, delay);
    } else {
      // Max retries reached, mark as failed
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          errorMessage,
          errorCode,
        },
      });

      // Update webhook failure count
      await prisma.webhook.update({
        where: { id: delivery.webhookId },
        data: {
          failureCount: { increment: 1 },
          lastFailureAt: new Date(),
        },
      });

      console.error(`[Webhook] Delivery ${deliveryId} failed after ${currentAttempt} attempts`);
    }
  }
}

/**
 * Trigger webhooks for a specific event
 * Finds all webhooks subscribed to the event and delivers the payload
 */
export async function triggerWebhooks(event: WebhookEvent, payload: WebhookPayload): Promise<void> {
  console.log(`[Webhook] Triggering webhooks for event: ${event}`);

  // Find all active webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      enabled: true,
      events: {
        array_contains: event,
      },
    },
  });

  if (webhooks.length === 0) {
    console.log(`[Webhook] No webhooks found for event: ${event}`);
    return;
  }

  console.log(`[Webhook] Found ${webhooks.length} webhook(s) for event: ${event}`);

  // Deliver to all webhooks in parallel (non-blocking)
  const deliveryPromises = webhooks.map((webhook) =>
    deliverWebhook(webhook.id, event, payload).catch((error) => {
      console.error(`[Webhook] Failed to deliver to webhook ${webhook.id}:`, error);
      // Don't throw, continue with other webhooks
    })
  );

  // Fire and forget (don't wait for delivery)
  Promise.all(deliveryPromises).catch((err) => {
    console.error('[Webhook] Error in webhook delivery batch:', err);
  });
}

/**
 * Retry failed webhook delivery manually
 */
export async function retryDelivery(deliveryId: number): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      webhook: true,
    },
  });

  if (!delivery) {
    throw new Error(`Delivery ${deliveryId} not found`);
  }

  if (delivery.status === WebhookDeliveryStatus.SUCCESS) {
    throw new Error(`Delivery ${deliveryId} already succeeded`);
  }

  const requestBody = JSON.stringify(delivery.requestBody);
  const headers = (delivery.requestHeaders as Record<string, string>) || {};

  await performDelivery(
    deliveryId,
    delivery.webhook.url,
    headers,
    requestBody,
    DEFAULT_OPTIONS
  );
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookStats(webhookId: number) {
  const [totalDeliveries, successCount, failureCount, retryCount] = await Promise.all([
    prisma.webhookDelivery.count({ where: { webhookId } }),
    prisma.webhookDelivery.count({ where: { webhookId, status: WebhookDeliveryStatus.SUCCESS } }),
    prisma.webhookDelivery.count({ where: { webhookId, status: WebhookDeliveryStatus.FAILED } }),
    prisma.webhookDelivery.count({ where: { webhookId, status: WebhookDeliveryStatus.RETRYING } }),
  ]);

  const lastDelivery = await prisma.webhookDelivery.findFirst({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
  });

  const lastSuccess = await prisma.webhookDelivery.findFirst({
    where: { webhookId, status: WebhookDeliveryStatus.SUCCESS },
    orderBy: { deliveredAt: 'desc' },
  });

  const lastFailure = await prisma.webhookDelivery.findFirst({
    where: { webhookId, status: WebhookDeliveryStatus.FAILED },
    orderBy: { updatedAt: 'desc' },
  });

  const successRate = totalDeliveries > 0 ? (successCount / totalDeliveries) * 100 : 0;

  return {
    webhookId,
    totalDeliveries,
    successCount,
    failureCount,
    retryCount,
    lastDeliveryAt: lastDelivery?.createdAt,
    lastSuccessAt: lastSuccess?.deliveredAt,
    lastFailureAt: lastFailure?.updatedAt,
    successRate: Math.round(successRate * 100) / 100,
  };
}
