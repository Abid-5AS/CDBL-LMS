import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WebhookService } from "@/lib/services/webhook.service";
import { WebhookForm } from "../../components/WebhookForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function EditWebhookContent({ params }: PageProps) {
  const { id } = await params;
  const webhookId = parseInt(id);
  
  if (isNaN(webhookId)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const webhook = await WebhookService.getById(webhookId);

  if (!webhook) {
    notFound();
  }

  return (
    <WebhookForm 
      mode="edit" 
      initialData={{
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        description: webhook.description || undefined,
        events: webhook.events as unknown as string[],
        enabled: webhook.enabled,
        secret: webhook.secret
      }} 
    />
  );
}

export default function EditWebhookPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EditWebhookContent params={params} />
    </Suspense>
  );
}
