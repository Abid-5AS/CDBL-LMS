import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { WebhookList } from "./components/WebhookList";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function WebhooksPageContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const webhooks = await WebhookService.getAll();

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

      <WebhookList initialWebhooks={webhooks} />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebhooksPageContent />
    </Suspense>
  );
}
