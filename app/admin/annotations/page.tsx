import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AnnotationsManager } from "@/components/admin/AnnotationsManager";

export const metadata = {
  title: "Annotations Manager | Admin",
  description: "Manage documentation features and guides",
};

export default async function AnnotationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <AnnotationsManager />
      </div>
    </div>
  );
}
