import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HRISConflictsContent } from "./components/HRISConflictsContent";

async function HRISConflictsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const allowedRoles = ["SYSTEM_ADMIN", "HR_ADMIN"];
  if (!allowedRoles.includes(user.role as string)) {
    redirect("/dashboard");
  }
  return <HRISConflictsContent />;
}

export default async function HRISConflictsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 animate-pulse" />}>
      <HRISConflictsPageContent />
    </Suspense>
  );
}
