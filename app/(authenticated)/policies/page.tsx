import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PolicyPageContent } from "@/components/policies/PolicyPageContent";
import { Skeleton } from "@/components/ui/skeleton";

async function PolicyPageWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <PolicyPageContent />;
}

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PolicyPageWrapper />
      </Suspense>
    </div>
  );
}
