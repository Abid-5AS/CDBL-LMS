"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Edit, TestTube, Eye, Activity, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteWebhook, toggleWebhook, testWebhook } from "@/app/actions/webhook-actions";

type Webhook = {
  id: number;
  name: string;
  url: string;
  events: any; // Prisma Json type
  enabled: boolean;
  createdAt: Date;
  lastDeliveryAt: Date | null;
  _count?: {
    deliveries: number;
  };
};

interface WebhookListProps {
  initialWebhooks: Webhook[];
}

export function WebhookList({ initialWebhooks }: WebhookListProps) {
  const [isPending, startTransition] = useTransition();

  // We don't strictly need local state if we rely on revalidatePath and Server Components,
  // but optimistic updates make the UI feel snappier. 
  // However, for simplicity and consistency with the Server Actions pattern (where revalidatePath updates the server component prop),
  // we can just rely on the prop updating if the parent re-renders.
  // But since this is a client component receiving props from a server component, 
  // when the server component re-renders (due to revalidatePath), it will pass new props.
  
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    startTransition(async () => {
      const result = await deleteWebhook(id);
      if (result.success) {
        toast.success("Webhook deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete webhook");
      }
    });
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleWebhook(id, !currentStatus);
      if (result.success) {
        toast.success(`Webhook ${!currentStatus ? "enabled" : "disabled"}`);
      } else {
        toast.error(result.error || "Failed to update webhook");
      }
    });
  };

  const handleTest = async (id: number) => {
    startTransition(async () => {
        const result = await testWebhook(id);
        if (result.success) {
            toast.success("Test webhook sent successfully");
        } else {
            toast.error(result.error || "Failed to send test webhook");
        }
    });
  };

  if (initialWebhooks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No webhooks configured
        </h3>
        <p className="text-gray-600 mb-4">
          Get started by creating your first webhook endpoint
        </p>
        <Link
          href="/webhooks/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Webhook
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialWebhooks.map((webhook) => (
        <div
          key={webhook.id}
          className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${isPending ? 'opacity-70' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {webhook.name}
                </h3>
                <button
                  onClick={() => handleToggle(webhook.id, webhook.enabled)}
                  disabled={isPending}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    webhook.enabled
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {webhook.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3 font-mono break-all">
                {webhook.url}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(Array.isArray(webhook.events) ? webhook.events : []).map((event: string) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                  >
                    {event}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 flex gap-4">
                <span>Created: {new Date(webhook.createdAt).toLocaleDateString()}</span>
                {webhook.lastDeliveryAt && (
                  <span>Last delivery: {new Date(webhook.lastDeliveryAt).toLocaleString()}</span>
                )}
                {webhook._count && (
                    <span>Deliveries: {webhook._count.deliveries}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Link
                href={`/webhooks/${webhook.id}`}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/webhooks/${webhook.id}/edit`}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleTest(webhook.id)}
                disabled={isPending}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                title="Send test webhook"
              >
                <TestTube className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(webhook.id)}
                disabled={isPending}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
