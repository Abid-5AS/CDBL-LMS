import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminToolsContent } from "./AdminToolsContent";
import { Skeleton } from "@/components/ui/skeleton";

async function AdminToolsWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow admin roles
  const allowedRoles = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
  if (!allowedRoles.includes(user.role as string)) {
    redirect("/dashboard");
  }

  return <AdminToolsContent userRole={user.role} />;
}

export default function AdminToolsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <AdminToolsWrapper />
      </Suspense>
    </div>
  );
}
