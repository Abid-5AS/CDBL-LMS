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
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <FAQPageWrapper />
      </Suspense>
    </div>
  );
}
