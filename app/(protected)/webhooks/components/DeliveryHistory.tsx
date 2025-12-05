"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { retryDelivery } from "@/app/actions/webhook-actions";

type Delivery = {
  id: number;
  event: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  // Adding attempts/maxAttempts if they exist in your schema, otherwise omit or make optional
  // Assuming standard fields from typical implementations:
  requestUrl?: string;
};

interface DeliveryHistoryProps {
  webhookId: number;
  initialDeliveries: Delivery[];
  hasMoreInitial: boolean;
}

export function DeliveryHistory({ webhookId, initialDeliveries, hasMoreInitial }: DeliveryHistoryProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRetrying, startTransition] = useTransition();
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
       // Since this is a client component, we'd typically need a server action or API route for pagination
       // For now, let's assume we just fetch from an API endpoint or use a server action
       // Using fetch for simplicity as migrating everything to actions fully might be larger scope
       // But we are modernizing, so let's use the API route that existed: /api/v1/webhooks/${id}/deliveries
       // OR better, create a server action for fetching deliveries.
       
       const res = await fetch(`/api/v1/webhooks/${webhookId}/deliveries?page=${page + 1}&limit=20`);
       if (!res.ok) throw new Error("Failed to load more");
       const data = await res.json();
       
       setDeliveries([...deliveries, ...data.deliveries]);
       setHasMore(data.pagination.hasNext);
       setPage(prev => prev + 1);
    } catch (error) {
        toast.error("Failed to load more deliveries");
    } finally {
        setIsLoadingMore(false);
    }
  };

  const handleRetry = async (deliveryId: number) => {
    setRetryingId(deliveryId);
    startTransition(async () => {
      const result = await retryDelivery(webhookId, deliveryId);
      if (result.success) {
        toast.success("Retry initiated");
        // Ideally we'd refresh the list here or rely on revalidatePath,
        // but for history lists, re-fetching just the top items or the specific item is better.
        // For now, let's just show success.
      } else {
        toast.error(result.error || "Failed to retry");
      }
      setRetryingId(null);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Delivery History</h2>
        <button 
          onClick={() => window.location.reload()} // Simple refresh for now
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {deliveries.length === 0 ? (
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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(delivery.status)}`}>
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
                {delivery.responseStatus && (
                  <div>
                    <span className="text-gray-600">Response:</span>{" "}
                    <span className={`font-mono ${delivery.responseStatus >= 200 && delivery.responseStatus < 300 ? "text-green-600" : "text-red-600"}`}>
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
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
