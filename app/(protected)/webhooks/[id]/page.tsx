import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { DeliveryHistory } from "@/app/(protected)/webhooks/components/DeliveryHistory";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function WebhookDetailsContent({ params }: PageProps) {
  const { id } = await params;
  const webhookId = parseInt(id);
  
  if (isNaN(webhookId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const [webhook, stats, deliveriesData] = await Promise.all([
    WebhookService.getById(webhookId),
    WebhookService.getStats(webhookId),
    WebhookService.getDeliveries(webhookId, 1, 20),
  ]);

  if (!webhook) {
    notFound();
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
          </div>
          <Link
            href={`/webhooks/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

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

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Event Subscriptions</h2>
        <div className="flex flex-wrap gap-2">
          {(webhook.events as unknown as string[]).map((event) => (
            <span
              key={event}
              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-md"
            >
              {event}
            </span>
          ))}
        </div>
      </div>

      <DeliveryHistory 
        webhookId={webhook.id}
        initialDeliveries={deliveriesData.deliveries.map(d => ({
            ...d,
            responseBody: d.responseBody || null,
            responseStatus: d.responseStatus || null,
            errorMessage: d.errorMessage || null,
            deliveredAt: d.deliveredAt || null,
            event: d.event as string
        }))}
        hasMoreInitial={deliveriesData.pagination.hasNext}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function WebhookDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebhookDetailsContent params={params} />
    </Suspense>
  );
}
