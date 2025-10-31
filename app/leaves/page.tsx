import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UnifiedLayout } from "@/components/unified/UnifiedLayout";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { MyLeavesPageContent } from "./MyLeavesPageContent";

async function MyLeavesPageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const userData = { name: user.name, email: user.email };

  // Only employees use unified layout for this page
  if (role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  return (
    <UnifiedLayout currentPage="Requests" role="EMPLOYEE" user={userData}>
      <Suspense fallback={<MyLeavesFallback />}>
        <MyLeavesPageContent />
      </Suspense>
    </UnifiedLayout>
  );
}

export default function MyLeavesPage() {
  return <MyLeavesPageWrapper />;
}

function MyLeavesFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
      <div className="h-96 rounded-2xl border border-gray-200 bg-white p-6" />
    </div>
  );
}
