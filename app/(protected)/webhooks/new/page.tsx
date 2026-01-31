import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WebhookForm } from "../components/WebhookForm";

export default async function NewWebhookPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <WebhookForm mode="create" />
    </Suspense>
  );
}
