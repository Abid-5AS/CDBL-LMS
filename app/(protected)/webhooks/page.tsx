"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, TestTube, Activity, Eye } from "lucide-react";
import Link from "next/link";

type Webhook = {
  id: number;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  lastDeliveryAt: string | null;
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/webhooks");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch webhooks");
      }
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete webhook");
      }

      setWebhooks(webhooks.filter((w) => w.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update webhook");
      }

      setWebhooks(
        webhooks.map((w) =>
          w.id === id ? { ...w, enabled: !enabled } : w
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTest = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send test webhook");
      }

      alert("Test webhook sent successfully!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage webhook endpoints for external integrations
          </p>
        </div>
        <Link
          href="/webhooks/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Webhook
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {webhooks.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {webhook.name}
                    </h3>
                    <button
                      onClick={() => handleToggle(webhook.id, webhook.enabled)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        webhook.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {webhook.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-mono break-all">
                    {webhook.url}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(webhook.createdAt).toLocaleString()}
                    {webhook.lastDeliveryAt && (
                      <> • Last delivery: {new Date(webhook.lastDeliveryAt).toLocaleString()}</>
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
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Send test webhook"
                  >
                    <TestTube className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
