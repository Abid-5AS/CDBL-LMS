import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FAQPageContent } from "@/components/faq/FAQPageContent";
import { Skeleton } from "@/components/ui/skeleton";

async function FAQPageWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <FAQPageContent />;
}

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <FAQPageWrapper />
      </Suspense>
    </div>
  );
}
