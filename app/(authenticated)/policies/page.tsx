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
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PolicyPageWrapper />
      </Suspense>
    </div>
  );
}
