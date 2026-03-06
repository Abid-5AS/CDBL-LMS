import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HRISContent } from "./components/HRISContent";

async function HRISPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const allowedRoles = ["SYSTEM_ADMIN", "HR_ADMIN"];
  if (!allowedRoles.includes(user.role as string)) {
    redirect("/dashboard");
  }
  return <HRISContent />;
}

export default async function HRISIntegrationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 animate-pulse" />}>
      <HRISPageContent />
    </Suspense>
  );
}
