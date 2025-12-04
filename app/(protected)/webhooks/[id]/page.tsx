"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

type Webhook = {
  id: number;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  description?: string;
};

type WebhookStats = {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  lastDeliveryAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

type Delivery = {
  id: number;
  event: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

export default function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    fetchWebhookDetails();
  }, [id]);

  useEffect(() => {
    fetchDeliveries();
  }, [id, page]);

  const fetchWebhookDetails = async () => {
    try {
      const [webhookRes, statsRes] = await Promise.all([
        fetch(`/api/v1/webhooks/${id}`),
        fetch(`/api/v1/webhooks/${id}/stats`),
      ]);

      if (!webhookRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch webhook details");
      }

      const webhookData = await webhookRes.json();
      const statsData = await statsRes.json();

      setWebhook(webhookData.webhook);
      setStats(statsData.stats);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/webhooks/${id}/deliveries?page=${page}&limit=20`);

      if (!res.ok) {
        throw new Error("Failed to fetch deliveries");
      }

      const data = await res.json();
      setDeliveries(data.deliveries || []);
      setHasMore(data.pagination?.hasNext || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (deliveryId: number) => {
    try {
      setRetryingId(deliveryId);
      const res = await fetch(`/api/v1/webhooks/${id}/deliveries/${deliveryId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to retry delivery");
      }

      alert("Delivery retry initiated");
      fetchDeliveries();
      fetchWebhookDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "retrying":
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
      retrying: "bg-blue-100 text-blue-700",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  if (error && !webhook) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/webhooks"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webhooks
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{webhook.name}</h1>
            <p className="text-sm text-gray-600 font-mono mt-1">{webhook.url}</p>
            {webhook.description && (
              <p className="text-sm text-gray-600 mt-2">{webhook.description}</p>
            )}
          </div>
          <Link
            href={`/webhooks/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Deliveries</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalDeliveries}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.successfulDeliveries}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedDeliveries}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.successRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Event Subscriptions</h2>
        <div className="flex flex-wrap gap-2">
          {webhook.events.map((event) => (
            <span
              key={event}
              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md"
            >
              {event}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delivery History</h2>
          <button
            onClick={fetchDeliveries}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading && deliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No deliveries yet</div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(delivery.status)}
                    <div>
                      <div className="font-medium text-gray-900">{delivery.event}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        delivery.status
                      )}`}
                    >
                      {delivery.status}
                    </span>
                    {delivery.status === "failed" && (
                      <button
                        onClick={() => handleRetry(delivery.id)}
                        disabled={retryingId === delivery.id}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {retryingId === delivery.id ? "Retrying..." : "Retry"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="text-gray-600">Attempts:</span>{" "}
                    <span className="text-gray-900">
                      {delivery.attempts} / {delivery.maxAttempts}
                    </span>
                  </div>
                  {delivery.responseStatus && (
                    <div>
                      <span className="text-gray-600">Response Status:</span>{" "}
                      <span
                        className={`font-mono ${
                          delivery.responseStatus >= 200 && delivery.responseStatus < 300
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {delivery.responseStatus}
                      </span>
                    </div>
                  )}
                </div>

                {delivery.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                    <strong>Error:</strong> {delivery.errorMessage}
                  </div>
                )}

                {delivery.responseBody && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      View response
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {delivery.responseBody}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
