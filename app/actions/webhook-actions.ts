"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WebhookService } from "@/lib/services/webhook.service";
import { revalidatePath } from "next/cache";

export async function createWebhook(data: any) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const { name, url, events, description, enabled } = data;
    
    // Basic validation
    if (!name || !url || !events || !events.length) {
      return { success: false, error: "Missing required fields" };
    }

    // Since WebhookService.register only takes url, events, secret, we might need to update it to accept more fields
    // or update the record after creation.
    // Or just create directly with prisma here if service is limited, BUT better to update service.
    // Let's create directly here for now to support all fields including name/description/enabled in one go,
    // OR update WebhookService.register signature.
    // Updating service signature is cleaner but requires more file edits.
    // Let's use Prisma directly here for simplicity and power, keeping service for complex logic like dispatch.
    
    // Generate secret
    const crypto = require('crypto');
    const secret = crypto.randomBytes(32).toString('hex');

    await prisma.webhook.create({
      data: {
        name,
        url,
        events: events, // Prisma handles string[] for JSON types if configured, or needs casting? Schema said Json.
        description,
        enabled: enabled ?? true,
        secret,
        createdBy: user.id,
      },
    });

    revalidatePath("/webhooks");
    return { success: true };
  } catch (error: any) {
    console.error("Create Webhook Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWebhook(id: number, data: any) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const { name, url, events, description, enabled } = data;

    await prisma.webhook.update({
      where: { id },
      data: {
        name,
        url,
        events,
        description,
        enabled,
      },
    });

    revalidatePath("/webhooks");
    revalidatePath(`/webhooks/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Webhook Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteWebhook(id: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.webhook.delete({
      where: { id },
    });
    revalidatePath("/webhooks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleWebhook(id: number, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.webhook.update({
      where: { id },
      data: { enabled },
    });
    revalidatePath("/webhooks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testWebhook(id: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    await WebhookService.test(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function retryDelivery(webhookId: number, deliveryId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // We need to fetch the delivery to get the original event/payload
    // Or adding a retry method to WebhookService would be cleaner.
    // Let's assume we add a retry method to WebhookService.
    await WebhookService.retryDelivery(deliveryId);
    revalidatePath(`/webhooks/${webhookId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
